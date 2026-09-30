import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Plus, HelpCircle, Search, SlidersHorizontal, X } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { getContacts, getTags, getLanguages, createContact, updateContact } from '../services/contactsApi';
import toast from 'react-hot-toast';

// Components
import Sidebar from '../components/Sidebar';
import SearchOverlay from '../components/SearchOverlay';
import SearchBar from '../components/SearchBar';
import FilterDrawer from '../components/FilterDrawer';
import ContactCard from '../components/ContactCard';
import Pagination from '../components/Pagination';
import ContactDetailModal from '../components/ContactDetailModal';
import ContactFormModal from '../components/ContactFormModal';
import EmergencyModal from '../components/EmergencyModal';
import LocationModal from '../components/LocationModal';
import FmcNetworkModal from '../components/FmcNetworkModal';
import HelpModal from '../components/HelpModal';
import QuickTipModal from '../components/QuickTipModal';
import AccessCodeModal from '../components/AccessCodeModal';
import Loader from '../components/Loader';

const ITEMS_PER_PAGE = 20; // 4x5 grid
const EMPTY_FILTERS = {
  tags: [],
  languages: [],
  departments: [],
  companies: [],
  designations: [],
  statuses: {
    ert: false,
    ifa: false,
    thirdParty: false,
  },
};

const HomePage = () => {
  const { isFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();

  // Access verification state
  const [isAccessVerified, setIsAccessVerified] = useState(false);

  // State Management
  const [currentView, setCurrentView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState('all');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState('name');
  const [browseMode, setBrowseMode] = useState('cards');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState(null);
  const [formContact, setFormContact] = useState(null);

  // Modal States
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isFmcNetworkModalOpen, setIsFmcNetworkModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isQuickTipModalOpen, setIsQuickTipModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check access verification on mount
  useEffect(() => {
    const isVerified = sessionStorage.getItem('hotel_access_verified');
    if (isVerified === 'true' && !navigator.onLine) setIsAccessVerified(true);
    else if (isVerified === 'true') {
      fetch('/api/access/me').then(response => {
        if (response.ok) setIsAccessVerified(true);
        else sessionStorage.removeItem('hotel_access_verified');
      }).catch(() => sessionStorage.removeItem('hotel_access_verified'));
    }
  }, []);

  // Show Quick Tip modal on first visit (only after access is verified)
  useEffect(() => {
    if (isAccessVerified) {
      const hasSeenQuickTip = sessionStorage.getItem('hasSeenQuickTip');
      if (!hasSeenQuickTip) {
        setIsQuickTipModalOpen(true);
        sessionStorage.setItem('hasSeenQuickTip', 'true');
      }
    }
  }, [isAccessVerified]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tab - Focus search (only if no modal is open)
      if (
        e.key === 'Tab' &&
        !isDetailModalOpen &&
        !isFormModalOpen &&
        !isEmergencyModalOpen &&
        !isLocationModalOpen &&
        !isFmcNetworkModalOpen &&
        !isHelpModalOpen &&
        !isQuickTipModalOpen
      ) {
        e.preventDefault();
        setIsSearchOverlayOpen(true);
      }

      // Escape - Close modals or clear search
      if (e.key === 'Escape') {
        if (isSearchOverlayOpen) {
          setSearchQuery('');
          setIsSearchOverlayOpen(false);
        } else if (isDetailModalOpen) {
          setIsDetailModalOpen(false);
        } else if (isFormModalOpen) {
          setIsFormModalOpen(false);
        } else if (isEmergencyModalOpen) {
          setIsEmergencyModalOpen(false);
        } else if (isLocationModalOpen) {
          setIsLocationModalOpen(false);
        } else if (isFmcNetworkModalOpen) {
          setIsFmcNetworkModalOpen(false);
        } else if (isHelpModalOpen) {
          setIsHelpModalOpen(false);
        } else if (isQuickTipModalOpen) {
          setIsQuickTipModalOpen(false);
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isSearchOverlayOpen,
    isDetailModalOpen,
    isFormModalOpen,
    isEmergencyModalOpen,
    isLocationModalOpen,
    isFmcNetworkModalOpen,
    isHelpModalOpen,
    isQuickTipModalOpen,
    searchQuery,
  ]);

  // Fetch ALL contacts at once for client-side filtering and pagination
  const {
    data: allContactsData,
    isLoading: isLoadingContacts,
    error: contactsError,
    refetch: refetchContacts,
  } = useQuery({
    queryKey: ['contacts', 'all'],
    queryFn: async () => {
      const params = {
        page: 1,
        limit: 500, // Reasonable limit for performance
        sortBy: 'name',
        include_pictures: true, // Include profile picture URLs
      };

      const response = await getContacts(params);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // Cache for 1 minute only
    cacheTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
    enabled: isAccessVerified, // Only fetch if access is verified
  });

  // Fetch tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await getTags();
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
    enabled: isAccessVerified, // Only fetch if access is verified
  });

  // Fetch languages
  const { data: languagesData } = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const response = await getLanguages();
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
    enabled: isAccessVerified, // Only fetch if access is verified
  });

  // Client-side filtering and pagination with useMemo
  const { contacts: filteredContacts, groupedContacts, totalPages, totalResults } = useMemo(() => {
    if (!allContactsData?.contacts || !Array.isArray(allContactsData.contacts)) {
      return { contacts: [], groupedContacts: [], totalPages: 1, totalResults: 0 };
    }

    let filtered = [...allContactsData.contacts];

    // Apply view filter
    if (currentView === 'emergency') {
      filtered = filtered.filter(contact => contact.is_ert);
    } else if (currentView === 'ifa') {
      filtered = filtered.filter(contact => contact.is_ifa);
    } else if (currentView === 'thirdparty') {
      filtered = filtered.filter(contact => contact.is_third_party);
    } else if (currentView === 'all') {
      filtered = filtered.filter(contact => !contact.is_third_party);
    } else if (currentView === 'favorites') {
      filtered = filtered.filter(contact => {
        const id = contact._id || contact.id;
        return id && isFavorite(id);
      });
    } else if (currentView === 'languages' || currentView === 'tags') {
      // For languages and tags views, exclude IFA and 3rd Party contacts
      filtered = filtered.filter(contact => !contact.is_ifa && !contact.is_third_party);
    }

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      const matchesScope = (contact, scope) => {
        const fields = {
          name: contact.name,
          extension: contact.extension,
          department: contact.department,
          company: contact.company,
          designation: contact.designation,
          email: contact.email,
          mobile: contact.mobile,
          landline: contact.landline,
        };

        if (scope === 'all') {
          return Object.values(fields).some((value) => value?.toLowerCase().includes(query));
        }

        return fields[scope]?.toLowerCase().includes(query);
      };

      filtered = filtered.filter(contact =>
        matchesScope(contact, searchScope)
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter((contact) =>
        (contact.name || '').trim().toUpperCase().startsWith(selectedLetter)
      );
    }

    if (filters.statuses.ert) {
      filtered = filtered.filter((contact) => contact.is_ert);
    }

    if (filters.statuses.ifa) {
      filtered = filtered.filter((contact) => contact.is_ifa);
    }

    if (filters.statuses.thirdParty) {
      filtered = filtered.filter((contact) => contact.is_third_party);
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter((contact) =>
        filters.tags.some((tag) => contact.tags?.includes(tag))
      );
    }

    if (filters.languages.length > 0) {
      filtered = filtered.filter((contact) =>
        filters.languages.some((language) => contact.languages?.includes(language))
      );
    }

    if (filters.departments.length > 0) {
      filtered = filtered.filter((contact) => filters.departments.includes(contact.department));
    }

    if (filters.companies.length > 0) {
      filtered = filtered.filter((contact) => filters.companies.includes(contact.company));
    }

    if (filters.designations.length > 0) {
      filtered = filtered.filter((contact) => filters.designations.includes(contact.designation));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'department') {
        return (a.department || '').localeCompare(b.department || '');
      } else if (sortBy === 'extension') {
        return (a.extension || '').localeCompare(b.extension || '');
      }
      return 0;
    });
    const totalResults = filtered.length;
    let groupedContacts;
    if (currentView === 'languages' || currentView === 'tags') {
      const groupField = currentView === 'languages' ? 'languages' : 'tags';
      const fallbackLabel = currentView === 'languages' ? 'No Language' : 'No Tag';
      const groupsMap = new Map();

      filtered.forEach((currentContact) => {
        const values = currentContact[groupField];
        const groupKeys = Array.isArray(values) && values.length > 0 ? values : [fallbackLabel];

        groupKeys.forEach((groupKey) => {
          if (!groupsMap.has(groupKey)) {
            groupsMap.set(groupKey, []);
          }
          groupsMap.get(groupKey).push(currentContact);
        });
      });

      groupedContacts = [...groupsMap.entries()].map(([name, contacts]) => ({ name, contacts }));
    } else {
      groupedContacts = filtered.reduce((groups, currentContact) => {
        const departmentName = currentContact.department || 'Other';
        const existingGroup = groups.find((group) => group.name === departmentName);

        if (existingGroup) {
          existingGroup.contacts.push(currentContact);
        } else {
          groups.push({
            name: departmentName,
            contacts: [currentContact],
          });
        }

        return groups;
      }, []);
    }

    groupedContacts.sort((a, b) => a.name.localeCompare(b.name));
    const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE) || 1;

    // Paginate
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedContacts = filtered.slice(startIndex, endIndex);

    return {
      contacts: paginatedContacts,
      groupedContacts,
      totalPages,
      totalResults
    };
  }, [allContactsData, currentView, debouncedSearchQuery, searchScope, selectedLetter, filters, sortBy, currentPage, isFavorite]);

  const searchSuggestions = useMemo(() => {
    const contacts = allContactsData?.contacts || [];
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const getMatchLabel = (contact) => {
      const candidates = [
        ['Name', contact.name],
        ['Extension', contact.extension],
        ['Department', contact.department],
        ['Company', contact.company],
        ['Designation', contact.designation],
        ['Email', contact.email],
      ];

      if (searchScope !== 'all') {
        const matched = candidates.find(([label]) => label.toLowerCase() === searchScope && (contact[searchScope] || '').toLowerCase().includes(query));
        if (matched) return `${matched[0]}: ${matched[1]}`;
      }

      const firstMatch = candidates.find(([, value]) => value?.toLowerCase().includes(query));
      return firstMatch ? `${firstMatch[0]}: ${firstMatch[1]}` : null;
    };

    return contacts
      .filter((contact) => getMatchLabel(contact))
      .slice(0, 6)
      .map((contact) => ({
        id: contact._id || contact.id,
        name: contact.name,
        label: getMatchLabel(contact),
        contact,
      }));
  }, [allContactsData, searchQuery, searchScope]);

  const availableLetters = useMemo(() => {
    const contacts = allContactsData?.contacts || [];
    const visibleContacts = contacts.filter((contact) => {
      if (currentView === 'emergency') return contact.is_ert;
      if (currentView === 'ifa') return contact.is_ifa;
      if (currentView === 'thirdparty') return contact.is_third_party;
      if (currentView === 'all') return !contact.is_third_party;
      if (currentView === 'favorites') {
        const id = contact._id || contact.id;
        return id && isFavorite(id);
      }
      if (currentView === 'languages' || currentView === 'tags') {
        return !contact.is_ifa && !contact.is_third_party;
      }
      return true;
    });

    return [...new Set(
      visibleContacts
        .map((contact) => (contact.name || '').trim().charAt(0).toUpperCase())
        .filter((letter) => /^[A-Z]$/.test(letter))
    )].sort();
  }, [allContactsData, currentView, isFavorite]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedLetter, filters, currentView, browseMode]);

  const filterOptions = useMemo(() => {
    const contacts = allContactsData?.contacts || [];
    const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

    return {
      departments: uniqueSorted(contacts.map((contact) => contact.department)),
      companies: uniqueSorted(contacts.map((contact) => contact.company)),
      designations: uniqueSorted(contacts.map((contact) => contact.designation)),
      tags: uniqueSorted(tagsData?.tags || []),
      languages: uniqueSorted(languagesData?.languages || []),
    };
  }, [allContactsData, tagsData, languagesData]);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    filters.tags.forEach((tag) => chips.push({ key: `tag-${tag}`, group: 'tags', value: tag, label: `Tag: ${tag}` }));
    filters.languages.forEach((language) =>
      chips.push({ key: `language-${language}`, group: 'languages', value: language, label: `Language: ${language}` })
    );
    filters.departments.forEach((department) =>
      chips.push({ key: `department-${department}`, group: 'departments', value: department, label: `Dept: ${department}` })
    );
    filters.companies.forEach((company) =>
      chips.push({ key: `company-${company}`, group: 'companies', value: company, label: `Company: ${company}` })
    );
    filters.designations.forEach((designation) =>
      chips.push({
        key: `designation-${designation}`,
        group: 'designations',
        value: designation,
        label: `Designation: ${designation}`,
      })
    );

    if (filters.statuses.ert) chips.push({ key: 'status-ert', group: 'status', value: 'ert', label: 'ERT' });
    if (filters.statuses.ifa) chips.push({ key: 'status-ifa', group: 'status', value: 'ifa', label: 'IFA' });
    if (filters.statuses.thirdParty) {
      chips.push({ key: 'status-thirdParty', group: 'status', value: 'thirdParty', label: 'Third Party' });
    }

    return chips;
  }, [filters]);

  const activeFilterCount = activeFilterChips.length;

  // Handlers
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleApplyFilters = (nextFilters) => {
    setFilters(nextFilters);
  };

  const handleClearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  const handleRemoveFilterChip = (chip) => {
    if (chip.group === 'status') {
      setFilters((prev) => ({
        ...prev,
        statuses: {
          ...prev.statuses,
          [chip.value]: false,
        },
      }));
      return;
    }

    setFilters((prev) => ({
      ...prev,
      [chip.group]: prev[chip.group].filter((item) => item !== chip.value),
    }));
  };

  const handleOpenDetail = (contact) => {
    setSelectedContact(contact);
    setIsDetailModalOpen(true);
  };

  const handleSelectSuggestion = (suggestion) => {
    setSelectedContact(suggestion.contact);
    setIsDetailModalOpen(true);
    setIsSearchOverlayOpen(false);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedContact(null);
  };

  const handleOpenForm = () => {
    setFormContact(null);
    setIsFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setFormContact(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (formContact) {
        await updateContact(formContact.id || formContact._id, formData);
        toast.success('Contact updated successfully!');
      } else {
        await createContact(formData);
        toast.success('Contact added successfully!');
      }
      refetchContacts();
      handleCloseForm();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          (formContact ? 'Failed to update contact. Please try again.' : 'Failed to add contact. Please try again.')
      );
      throw error;
    }
  };

  const handleEditContact = (contact) => {
    setSelectedContact(null);
    setIsDetailModalOpen(false);
    setFormContact(contact);
    setIsFormModalOpen(true);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleBrowseModeChange = (mode) => {
    setBrowseMode(mode);
  };

  const handleLetterToggle = (letter) => {
    setSelectedLetter((currentLetter) => (currentLetter === letter ? '' : letter));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAccessVerified = () => {
    setIsAccessVerified(true);
  };

  // Show initial loader
  if (isLoadingContacts && !allContactsData) {
    return <Loader text="Loading contacts..." />;
  }

  // Show error state only when we have no data to fall back on (e.g. offline first visit)
  if (contactsError && !allContactsData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Error Loading Contacts
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {contactsError.message || 'Something went wrong'}
            </p>
            <button
              onClick={() => refetchContacts()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-[#151515] dark:via-[#1b1b1b] dark:to-[#242424] transition-colors">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={handleViewChange}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        onOpenFmcNetwork={() => setIsFmcNetworkModalOpen(true)}
      />

      {/* Main Content */}
      <div className="lg:pl-64 h-screen flex flex-col">
        {/* Mobile Search Bar */}
        <div className="flex-shrink-0">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchScope={searchScope}
            setSearchScope={setSearchScope}
            suggestions={searchSuggestions}
            onSearch={() => {}}
            onClear={() => setSearchQuery('')}
            onSelectSuggestion={handleSelectSuggestion}
          />
        </div>

        {/* Main Container - Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-4 sm:px-6 sm:py-4 lg:px-8 lg:py-6">
            {/* Top Bar */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Results Count */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {currentView === 'all' && 'All Contacts'}
                {currentView === 'emergency' && 'Emergency Response Team'}
                {currentView === 'ifa' && 'IFA Contacts'}
                {currentView === 'thirdparty' && 'Third Party Companies'}
                {currentView === 'favorites' && 'Favorites'}
                {currentView === 'languages' && 'Languages'}
                {currentView === 'tags' && 'Tags'}
              </h1>
              <span className="badge badge-primary">
                {isLoadingContacts ? '...' : totalResults}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="badge badge-primary min-w-[1.5rem] justify-center px-2 py-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="input appearance-none pl-3 pr-10 py-2 text-sm cursor-pointer"
                >
                  <option value="name">Sort by Name</option>
                  <option value="department">Sort by Department</option>
                  <option value="extension">Sort by Extension</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Search Button - Desktop Only */}
              <button
                onClick={() => setIsSearchOverlayOpen(true)}
                className="hidden md:flex btn-secondary p-2"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Help Button */}
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="btn-secondary p-2"
                aria-label="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Add Contact Button */}
              <button
                onClick={handleOpenForm}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Contact</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {currentView !== 'languages' && currentView !== 'tags' && (
            <div className="mb-5 flex justify-start xl:pl-2">
              <div className="inline-flex rounded-2xl bg-gray-100 p-1 shadow-sm dark:bg-[#10151b]">
                <button
                  onClick={() => handleBrowseModeChange('cards')}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    browseMode === 'cards'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-[#1d2732] dark:text-white'
                      : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Card View
                </button>
                <button
                  onClick={() => handleBrowseModeChange('grouped')}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    browseMode === 'grouped'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-[#1d2732] dark:text-white'
                      : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Department View
                </button>
              </div>
            </div>
          )}

          {activeFilterChips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => handleRemoveFilterChip(chip)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[#29556e] dark:bg-[#171d24] dark:text-[#dbe4ec] dark:hover:bg-[#1f252d]"
                >
                  <span>{chip.label}</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
              <button onClick={handleClearAllFilters} className="btn-ghost text-sm">
                Clear all
              </button>
            </div>
          )}

          {debouncedSearchQuery && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm dark:border-[#24303c] dark:bg-[#171d24] dark:text-slate-300">
              <span className="font-semibold text-gray-900 dark:text-white">Search active</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-[#24303c] dark:text-slate-300">
                Scope: {searchScope === 'all' ? 'All Fields' : searchScope}
              </span>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-[#112433] dark:text-[#69d6ff]">
                “{debouncedSearchQuery}”
              </span>
              <span>{totalResults} results</span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-[#2a2416] dark:text-amber-300">
                Press `Esc` to clear search
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-[#2d3a47] dark:text-slate-300 dark:hover:bg-[#1f252d]"
              >
                <X className="h-3.5 w-3.5" />
                Clear Search
              </button>
            </div>
          )}

          {/* Contact Grid */}
          {isLoadingContacts ? (
            <div className="flex items-center justify-center py-20">
              <Loader text="Loading contacts..." />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-center card max-w-md p-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No contacts found
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : currentView === 'favorites'
                    ? 'You have not added any favorites yet'
                    : 'No contacts available'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      handleClearAllFilters();
                    }}
                    className="btn-primary"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : browseMode === 'grouped' || currentView === 'languages' || currentView === 'tags' ? (
            <div className="space-y-6 md:pr-16 xl:pr-20">
              {groupedContacts.map((group) => (
                <section key={group.name} className="rounded-3xl border border-gray-200 bg-white/75 p-4 shadow-sm dark:border-[#24303c] dark:bg-[#171d24]">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-[#24303c]">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{group.name}</h2>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {group.contacts.length} contact{group.contacts.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                    {group.contacts.map((contact) => (
                      <ContactCard
                        key={contact._id || contact.id}
                        contact={contact}
                        onOpenDetail={handleOpenDetail}
                        onEdit={handleEditContact}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:pr-16 lg:grid-cols-3 xl:grid-cols-4 xl:pr-20 2xl:grid-cols-4">
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact._id || contact.id}
                    contact={contact}
                    onOpenDetail={handleOpenDetail}
                    onEdit={handleEditContact}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="sticky bottom-0 bg-gradient-to-t from-purple-50 via-purple-50 to-transparent dark:from-[#151515] dark:via-[#1b1b1b] pt-2 pb-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {availableLetters.length > 0 && (
        <div className="fixed right-3 top-1/2 z-20 hidden -translate-y-1/2 md:flex">
          <div className="flex max-h-[72vh] flex-col items-center gap-1 overflow-y-auto rounded-3xl border border-gray-200 bg-white/92 px-2 py-3 shadow-lg backdrop-blur dark:border-[#24303c] dark:bg-[#171d24]/95">
            <button
              onClick={() => setSelectedLetter('')}
              className={`flex min-h-7 w-8 items-center justify-center rounded-full px-1 text-[10px] font-bold transition-colors ${
                !selectedLetter
                  ? 'bg-indigo-600 text-white dark:bg-[#23b7f2] dark:text-[#051018]'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-[#24303c]'
              }`}
              title="Show all letters"
            >
              All
            </button>
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterToggle(letter)}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                  selectedLetter === letter
                    ? 'bg-indigo-600 text-white dark:bg-[#23b7f2] dark:text-[#051018]'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-[#24303c]'
                }`}
                title={`Jump to ${letter}`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchScope={searchScope}
        setSearchScope={setSearchScope}
        suggestions={searchSuggestions}
        onSelectSuggestion={handleSelectSuggestion}
      />

      {/* Contact Detail Modal */}
      <ContactDetailModal
        contact={selectedContact}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        onEdit={handleEditContact}
      />

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        contact={formContact}
        onSubmit={handleFormSubmit}
      />

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* FMC Network Modal */}
      <FmcNetworkModal
        isOpen={isFmcNetworkModalOpen}
        onClose={() => setIsFmcNetworkModalOpen(false)}
      />

      {/* Help Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* Quick Tip Modal */}
      <QuickTipModal isOpen={isQuickTipModalOpen} onClose={() => setIsQuickTipModalOpen(false)} />

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onClearAll={handleClearAllFilters}
        options={filterOptions}
      />

      {/* Access Code Modal */}
      <AccessCodeModal
        isOpen={!isAccessVerified}
        onVerified={handleAccessVerified}
      />
    </div>
  );
};

export default HomePage;
