import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  Shield,
  ShieldOff,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Building2,
  Building,
  ExternalLink,
  LogOut,
  BookOpen,
  User,
  LayoutDashboard,
  Users,
  Settings2,
  Mail,
  Phone,
  Briefcase,
  ScanSearch,
  Layers3,
  Tags,
  Languages,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import AdminContactFormModal from '../components/AdminContactFormModal';
import ConfirmModal from '../components/ConfirmModal';
import * as contactsApi from '../services/contactsApi';

const ADMIN_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'contacts', label: 'Contact Management', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const CONTACT_FILTERS = [
  { id: 'all', label: 'All Records' },
  { id: 'quality', label: 'Needs Review' },
  { id: 'visible', label: 'Visible' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'ert', label: 'ERT' },
  { id: 'ifa', label: 'IFA' },
  { id: 'thirdParty', label: 'Third Party' },
];

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [activeSection, setActiveSection] = useState('overview');
  const [adminFilter, setAdminFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [settingsSearchTerm, setSettingsSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState('departments');
  const [newTaxonomyName, setNewTaxonomyName] = useState('');
  const [selectedTaxonomyItem, setSelectedTaxonomyItem] = useState(null);
  const [renameTaxonomyName, setRenameTaxonomyName] = useState('');
  const [replacementTaxonomyName, setReplacementTaxonomyName] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isBulkEditorOpen, setIsBulkEditorOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [isImportPanelOpen, setIsImportPanelOpen] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [bulkUpdates, setBulkUpdates] = useState({
    department: '',
    company: '',
    designation: '',
    tags: '',
    languages: '',
    expose: 'keep',
    is_ert: 'keep',
    is_ifa: 'keep',
    is_third_party: 'keep',
  });

  const {
    data: contactsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      const response = await contactsApi.getContacts({
        page: 1,
        limit: 500,
        include_pictures: true,
      });
      return response.data;
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to fetch contacts');
    },
  });

  const {
    data: taxonomyInventoryData,
    isLoading: isTaxonomyLoading,
  } = useQuery({
    queryKey: ['admin-taxonomy', selectedTaxonomy],
    queryFn: async () => {
      const response = await contactsApi.getAdminTaxonomy(selectedTaxonomy);
      return response.data;
    },
    enabled: activeSection === 'settings',
  });

  const createMutation = useMutation({
    mutationFn: (data) => contactsApi.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success('Contact created successfully');
      setIsFormModalOpen(false);
      setSelectedContact(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create contact');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => contactsApi.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success('Contact updated successfully');
      setIsFormModalOpen(false);
      setSelectedContact(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update contact');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => contactsApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success('Contact deleted successfully');
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete contact');
    },
  });

  const toggleERTMutation = useMutation({
    mutationFn: ({ id, isErt }) => contactsApi.toggleERT(id, isErt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success('ERT status updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update ERT status');
    },
  });

  const toggleIFAMutation = useMutation({
    mutationFn: ({ id, isIfa }) => contactsApi.toggleIFA(id, isIfa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success('IFA status updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update IFA status');
    },
  });

  const toggleExposeMutation = useMutation({
    mutationFn: ({ id, expose }) => contactsApi.toggleExpose(id, expose),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success('Expose status updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update expose status');
    },
  });

  const toggleThirdPartyMutation = useMutation({
    mutationFn: ({ id, isThirdParty }) => contactsApi.toggleThirdParty(id, isThirdParty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success('Third Party status updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update third party status');
    },
  });

  const createTaxonomyMutation = useMutation({
    mutationFn: ({ taxonomyType, name }) => contactsApi.createAdminTaxonomy(taxonomyType, name),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-taxonomy'] });
      toast.success(response.data?.message || 'Taxonomy value created successfully');
      setNewTaxonomyName('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to create taxonomy value');
    },
  });

  const renameTaxonomyMutation = useMutation({
    mutationFn: ({ taxonomyType, currentName, newName }) =>
      contactsApi.renameAdminTaxonomy(taxonomyType, currentName, newName),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-taxonomy'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success(response.data?.message || 'Taxonomy value updated successfully');
      setSelectedTaxonomyItem(null);
      setRenameTaxonomyName('');
      setReplacementTaxonomyName('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update taxonomy value');
    },
  });

  const deleteTaxonomyMutation = useMutation({
    mutationFn: ({ taxonomyType, name, replacementName }) =>
      contactsApi.deleteAdminTaxonomy(taxonomyType, name, replacementName),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-taxonomy'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      toast.success(response.data?.message || 'Taxonomy value removed successfully');
      setSelectedTaxonomyItem(null);
      setRenameTaxonomyName('');
      setReplacementTaxonomyName('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to remove taxonomy value');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ contactIds, updates }) => contactsApi.bulkUpdateContacts(contactIds, updates),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-taxonomy'] });
      toast.success(response.data?.message || 'Contacts updated successfully');
      setSelectedContactIds([]);
      setBulkUpdates({
        department: '',
        company: '',
        designation: '',
        tags: '',
        languages: '',
        expose: 'keep',
        is_ert: 'keep',
        is_ifa: 'keep',
        is_third_party: 'keep',
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update selected contacts');
    },
  });

  const importPreviewMutation = useMutation({
    mutationFn: ({ file, applyChanges }) => contactsApi.importContactsCsv(file, applyChanges),
    onSuccess: (response, variables) => {
      setImportPreview(response.data);
      if (variables.applyChanges) {
        queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
        queryClient.invalidateQueries({ queryKey: ['admin-taxonomy'] });
        toast.success(`Imported ${response.data?.created_count || 0} contacts`);
        setSelectedImportFile(null);
      } else {
        toast.success('Import preview ready');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to import CSV');
    },
  });

  const allContacts = contactsData?.contacts || [];

  const dashboardMetrics = useMemo(() => {
    const extensionCounts = new Map();
    const emailCounts = new Map();
    const departmentSet = new Set();
    const companySet = new Set();
    const designationSet = new Set();
    const tagSet = new Set();
    const languageSet = new Set();

    allContacts.forEach((contact) => {
      if (contact.extension) {
        extensionCounts.set(contact.extension, (extensionCounts.get(contact.extension) || 0) + 1);
      }
      if (contact.email) {
        const normalizedEmail = contact.email.toLowerCase();
        emailCounts.set(normalizedEmail, (emailCounts.get(normalizedEmail) || 0) + 1);
      }
      if (contact.department) departmentSet.add(contact.department);
      if (contact.company) companySet.add(contact.company);
      if (contact.designation) designationSet.add(contact.designation);
      (contact.tags || []).forEach((tag) => tagSet.add(tag));
      (contact.languages || []).forEach((language) => languageSet.add(language));
    });

    const needsReviewContacts = allContacts.filter(
      (contact) =>
        !contact.extension ||
        !contact.department ||
        !contact.designation ||
        !contact.company ||
        (!contact.email && !contact.mobile && !contact.landline)
    );

    return {
      total: allContacts.length,
      visible: allContacts.filter((contact) => contact.expose).length,
      hidden: allContacts.filter((contact) => !contact.expose).length,
      ert: allContacts.filter((contact) => contact.is_ert).length,
      ifa: allContacts.filter((contact) => contact.is_ifa).length,
      thirdParty: allContacts.filter((contact) => contact.is_third_party).length,
      missingExtension: allContacts.filter((contact) => !contact.extension).length,
      missingEmail: allContacts.filter((contact) => !contact.email).length,
      missingDepartment: allContacts.filter((contact) => !contact.department).length,
      missingDesignation: allContacts.filter((contact) => !contact.designation).length,
      missingCompany: allContacts.filter((contact) => !contact.company).length,
      duplicatesByExtension: [...extensionCounts.values()].filter((count) => count > 1).length,
      duplicatesByEmail: [...emailCounts.values()].filter((count) => count > 1).length,
      needsReviewContacts,
      uniqueDepartments: departmentSet.size,
      uniqueCompanies: companySet.size,
      uniqueDesignations: designationSet.size,
      uniqueTags: tagSet.size,
      uniqueLanguages: languageSet.size,
    };
  }, [allContacts]);

  const qualityAlerts = useMemo(
    () =>
      [
        { id: 'missing-extension', label: 'Missing extension', count: dashboardMetrics.missingExtension, icon: Phone },
        { id: 'missing-department', label: 'Missing department', count: dashboardMetrics.missingDepartment, icon: Building },
        { id: 'missing-designation', label: 'Missing designation', count: dashboardMetrics.missingDesignation, icon: Briefcase },
        { id: 'missing-company', label: 'Missing company', count: dashboardMetrics.missingCompany, icon: Building2 },
        { id: 'duplicate-extension', label: 'Duplicate extensions', count: dashboardMetrics.duplicatesByExtension, icon: ScanSearch },
        { id: 'duplicate-email', label: 'Duplicate emails', count: dashboardMetrics.duplicatesByEmail, icon: Mail },
      ].filter((item) => item.count > 0),
    [dashboardMetrics]
  );

  const processedContacts = useMemo(() => {
    let filtered = [...allContacts];

    if (adminFilter === 'quality') {
      filtered = dashboardMetrics.needsReviewContacts;
    } else if (adminFilter === 'visible') {
      filtered = filtered.filter((contact) => contact.expose);
    } else if (adminFilter === 'hidden') {
      filtered = filtered.filter((contact) => !contact.expose);
    } else if (adminFilter === 'ert') {
      filtered = filtered.filter((contact) => contact.is_ert);
    } else if (adminFilter === 'ifa') {
      filtered = filtered.filter((contact) => contact.is_ifa);
    } else if (adminFilter === 'thirdParty') {
      filtered = filtered.filter((contact) => contact.is_third_party);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((contact) =>
        contact.name?.toLowerCase().includes(search) ||
        contact.designation?.toLowerCase().includes(search) ||
        contact.department?.toLowerCase().includes(search) ||
        contact.email?.toLowerCase().includes(search) ||
        contact.mobile?.toLowerCase().includes(search) ||
        contact.landline?.toLowerCase().includes(search) ||
        contact.extension?.toLowerCase().includes(search) ||
        contact.company?.toLowerCase().includes(search)
      );
    }

    filtered.sort((a, b) => {
      let aValue = a[sortColumn] || '';
      let bValue = b[sortColumn] || '';
      if (typeof aValue === 'boolean') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      return sortDirection === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    return filtered;
  }, [allContacts, adminFilter, dashboardMetrics.needsReviewContacts, searchTerm, sortColumn, sortDirection]);

  const totalPages = Math.ceil(processedContacts.length / itemsPerPage) || 1;

  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedContacts.slice(startIndex, startIndex + itemsPerPage);
  }, [processedContacts, currentPage, itemsPerPage]);

  const topDepartments = useMemo(() => {
    const counts = new Map();
    allContacts.forEach((contact) => {
      if (!contact.department) return;
      counts.set(contact.department, (counts.get(contact.department) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [allContacts]);

  const recentReviewContacts = useMemo(
    () => dashboardMetrics.needsReviewContacts.slice(0, 6),
    [dashboardMetrics.needsReviewContacts]
  );

  const taxonomyCards = [
    { id: 'departments', label: 'Departments', count: dashboardMetrics.uniqueDepartments, icon: Building },
    { id: 'companies', label: 'Companies', count: dashboardMetrics.uniqueCompanies, icon: Building2 },
    { id: 'designations', label: 'Designations', count: dashboardMetrics.uniqueDesignations, icon: Briefcase },
    { id: 'tags', label: 'Tags', count: dashboardMetrics.uniqueTags, icon: Tags },
    { id: 'languages', label: 'Languages', count: dashboardMetrics.uniqueLanguages, icon: Languages },
  ];

  const activeSectionMeta = ADMIN_SECTIONS.find((section) => section.id === activeSection);
  const selectedTaxonomyMeta = taxonomyCards.find((item) => item.id === selectedTaxonomy) || taxonomyCards[0];
  const selectedTaxonomySingularLabel = {
    departments: 'Department',
    companies: 'Company',
    designations: 'Designation',
    tags: 'Tag',
    languages: 'Language',
  }[selectedTaxonomy] || 'Value';

  const taxonomyCoverage = useMemo(() => {
    const total = dashboardMetrics.total || 1;
    return {
      departments: dashboardMetrics.total - dashboardMetrics.missingDepartment,
      companies: dashboardMetrics.total - dashboardMetrics.missingCompany,
      designations: dashboardMetrics.total - dashboardMetrics.missingDesignation,
      tags: allContacts.filter((contact) => (contact.tags || []).length > 0).length,
      languages: allContacts.filter((contact) => (contact.languages || []).length > 0).length,
      total,
    };
  }, [allContacts, dashboardMetrics]);

  const filteredTaxonomyItems = useMemo(() => {
    const items = taxonomyInventoryData?.items || [];
    if (!settingsSearchTerm.trim()) return items;
    const query = settingsSearchTerm.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [taxonomyInventoryData, settingsSearchTerm]);

  useEffect(() => {
    setSelectedTaxonomyItem(null);
    setRenameTaxonomyName('');
    setReplacementTaxonomyName('');
    setSettingsSearchTerm('');
  }, [selectedTaxonomy]);

  useEffect(() => {
    setSelectedContactIds((prev) =>
      prev.filter((id) => paginatedContacts.some((contact) => contact.id === id))
    );
  }, [paginatedContacts]);

  useEffect(() => {
    if (selectedContactIds.length === 0) {
      setIsBulkEditorOpen(false);
    }
  }, [selectedContactIds]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleAddContact = () => {
    setSelectedContact(null);
    setIsFormModalOpen(true);
  };

  const handleEditContact = (contact) => {
    setSelectedContact(contact);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (contact) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (contactToDelete) {
      deleteMutation.mutate(contactToDelete.id);
    }
  };

  const handleFormSubmit = async (data) => {
    if (selectedContact) {
      await updateMutation.mutateAsync({ id: selectedContact.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleToggleERT = (contact) => {
    toggleERTMutation.mutate({ id: contact.id, isErt: !contact.is_ert });
  };

  const handleToggleIFA = (contact) => {
    toggleIFAMutation.mutate({ id: contact.id, isIfa: !contact.is_ifa });
  };

  const handleToggleExpose = (contact) => {
    toggleExposeMutation.mutate({ id: contact.id, expose: !contact.expose });
  };

  const handleToggleThirdParty = (contact) => {
    toggleThirdPartyMutation.mutate({ id: contact.id, isThirdParty: !contact.is_third_party });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleOpenPhonebook = () => {
    window.open('/', '_blank');
  };

  const handleOpenTaxonomyInContacts = (taxonomyType, value) => {
    const searchPrefixes = {
      departments: value,
      companies: value,
      designations: value,
      tags: value,
      languages: value,
    };

    setActiveSection('contacts');
    setAdminFilter('all');
    setCurrentPage(1);
    setSearchTerm(searchPrefixes[taxonomyType] || value);
  };

  const handleToggleSelectContact = (contactId) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleToggleSelectAllVisible = () => {
    const visibleIds = paginatedContacts.map((contact) => contact.id);
    const allSelected = visibleIds.every((id) => selectedContactIds.includes(id));
    setSelectedContactIds((prev) =>
      allSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : [...new Set([...prev, ...visibleIds])]
    );
  };

  const handleBulkInputChange = (field, value) => {
    setBulkUpdates((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyBulkUpdates = () => {
    if (selectedContactIds.length === 0) return;

    const updates = {};
    if (bulkUpdates.department.trim()) updates.department = bulkUpdates.department.trim();
    if (bulkUpdates.company.trim()) updates.company = bulkUpdates.company.trim();
    if (bulkUpdates.designation.trim()) updates.designation = bulkUpdates.designation.trim();
    if (bulkUpdates.tags.trim()) {
      updates.tags = bulkUpdates.tags.split(',').map((item) => item.trim()).filter(Boolean);
    }
    if (bulkUpdates.languages.trim()) {
      updates.languages = bulkUpdates.languages.split(',').map((item) => item.trim()).filter(Boolean);
    }
    ['expose', 'is_ert', 'is_ifa', 'is_third_party'].forEach((key) => {
      if (bulkUpdates[key] !== 'keep') {
        updates[key] = bulkUpdates[key] === 'true';
      }
    });

    if (Object.keys(updates).length === 0) {
      toast.error('Choose at least one bulk update before applying');
      return;
    }

    bulkUpdateMutation.mutate({ contactIds: selectedContactIds, updates });
  };

  const handleExportContacts = async () => {
    try {
      const params = {
        search: searchTerm || undefined,
        is_ert: adminFilter === 'ert' ? true : undefined,
        is_ifa: adminFilter === 'ifa' ? true : undefined,
        is_third_party: adminFilter === 'thirdParty' ? true : undefined,
      };
      if (adminFilter === 'hidden') params.exclude_third_party = undefined;

      const response = await contactsApi.exportContactsCsv(params);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'phonebook_contacts.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV export downloaded');
    } catch (error) {
      toast.error('Failed to export contacts');
    }
  };

  const handlePreviewImport = () => {
    if (!selectedImportFile) {
      toast.error('Choose a CSV file first');
      return;
    }
    importPreviewMutation.mutate({ file: selectedImportFile, applyChanges: false });
  };

  const handleApplyImport = () => {
    if (!selectedImportFile) {
      toast.error('Choose a CSV file first');
      return;
    }
    importPreviewMutation.mutate({ file: selectedImportFile, applyChanges: true });
  };

  const handleCreateTaxonomy = () => {
    const nextName = newTaxonomyName.trim();
    if (!nextName) return;
    createTaxonomyMutation.mutate({ taxonomyType: selectedTaxonomy, name: nextName });
  };

  const handleSelectTaxonomyItem = (item) => {
    setSelectedTaxonomyItem(item);
    setRenameTaxonomyName(item.name);
    setReplacementTaxonomyName('');
  };

  const handleRenameTaxonomy = () => {
    if (!selectedTaxonomyItem || !renameTaxonomyName.trim()) return;
    renameTaxonomyMutation.mutate({
      taxonomyType: selectedTaxonomy,
      currentName: selectedTaxonomyItem.name,
      newName: renameTaxonomyName.trim(),
    });
  };

  const handleDeleteTaxonomy = () => {
    if (!selectedTaxonomyItem) return;
    deleteTaxonomyMutation.mutate({
      taxonomyType: selectedTaxonomy,
      name: selectedTaxonomyItem.name,
      replacementName: replacementTaxonomyName.trim() || null,
    });
  };

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const TableHeader = ({ column, label, sortable = true, className = '' }) => (
    <th
      onClick={() => sortable && handleSort(column)}
      className={`px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider ${className} ${
        sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/60' : ''
      }`}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortable && <SortIcon column={column} />}
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-[#11161d] dark:via-[#121820] dark:to-[#19212b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 dark:text-[#23b7f2] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-[#11161d] dark:via-[#121820] dark:to-[#19212b] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="card p-8">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Contacts</h2>
            <p className="text-gray-600 dark:text-gray-300">{error?.response?.data?.message || 'Something went wrong'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3efe8] dark:bg-[#0f141b]">
      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="w-full lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-[272px] lg:flex-shrink-0">
          <div className="flex h-full flex-col overflow-y-auto rounded-[30px] border border-[#20384d] bg-gradient-to-b from-[#102234] via-[#151f31] to-[#1b2130] p-3.5 text-white shadow-[0_20px_60px_rgba(8,16,30,0.32)]">
            <div className="mb-4 rounded-[22px] border border-white/8 bg-[#ffffff08] px-4 py-3.5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#89a9be]">Control Center</div>
                <div className="text-[26px] font-semibold leading-none text-white">Phonebook</div>
              </div>
            </div>

            <div className="mb-4 rounded-[24px] border border-white/8 bg-[#ffffff08] p-3.5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#89a9be]">Admin Session</div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#67e8f9] to-[#22c55e] text-sm font-semibold text-[#06202f]">
                  {(user?.username || 'A').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-white">{user?.username || 'Admin'}</div>
                  <div className="text-[13px] text-[#8eaabd]">Directory administrator</div>
                </div>
              </div>
            </div>

            <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#89a9be]">Workspace</div>
            <nav className="space-y-2">
              {ADMIN_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-[20px] border px-3 py-3 text-left transition-all ${
                      isActive
                        ? 'border-[#d9eef7] bg-[#f7fbfd] text-[#132033] shadow-[0_14px_30px_rgba(15,23,42,0.14)]'
                        : 'border-white/8 bg-[#ffffff08] text-[#d5e7f2] hover:bg-[#ffffff10]'
                    }`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      isActive ? 'bg-[#edf8fc] text-[#1e97b6]' : 'bg-[#ffffff08] text-[#87d8ee]'
                    }`}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[14px] font-semibold leading-tight ${isActive ? 'text-[#162335]' : 'text-white'}`}>{section.label}</span>
                      <span className={`block text-[13px] leading-tight ${isActive ? 'text-[#6b7c90]' : 'text-[#8fb0c2]'}`}>
                        {section.id === 'overview' && 'Metrics and health'}
                        {section.id === 'contacts' && 'Manage directory records'}
                        {section.id === 'settings' && 'Taxonomy and config'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-3">
              <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#89a9be]">Actions</div>
              <div className="space-y-1 rounded-[20px] border border-white/8 bg-[#ffffff08] p-2">
              <button
                onClick={handleOpenPhonebook}
                className="flex w-full items-center justify-between gap-2 rounded-[14px] px-2.5 py-2 text-left text-white transition-colors hover:bg-[#ffffff10]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#ffffff08]">
                    <BookOpen className="h-4 w-4 text-[#88e0f5]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-tight">Open Phonebook</span>
                    <span className="block text-[11px] leading-tight text-[#8fb0c2]">Preview public directory</span>
                  </span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-[#88e0f5]" />
              </button>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-[14px] px-2.5 py-2 text-left text-white transition-colors hover:bg-[#ffffff10]"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#ffffff08] text-[#f8c3cb]">
                  <LogOut className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-tight">Sign out</span>
                  <span className="block text-[11px] leading-tight text-[#8fb0c2]">End this admin session</span>
                </span>
              </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6 rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,248,240,0.88))] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] dark:border-[#243244] dark:bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(135deg,rgba(18,26,35,0.96),rgba(20,29,39,0.92))]">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:border-[#21415a] dark:bg-[#102431] dark:text-[#7fdcff]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {activeSectionMeta?.label || 'Admin'} Workspace
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">
                    A clearer operating layer for managing your hotel directory.
                  </h1>
                </div>
                <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                  Review data health, update contact records, and keep taxonomy clean from one structured admin surface.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-[#2a3a4d] dark:bg-[#121a23]/80 dark:text-slate-200">
                  <span className="block text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Records</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardMetrics.total}</span>
                </div>
                <button onClick={handleAddContact} className="btn-primary flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Contact
                </button>
              </div>
            </div>
          </div>

        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Visible Contacts', value: dashboardMetrics.visible, helper: `${dashboardMetrics.hidden} hidden`, icon: Eye },
                { label: 'ERT Members', value: dashboardMetrics.ert, helper: `${dashboardMetrics.ifa} IFA flagged`, icon: Shield },
                { label: 'Third Party', value: dashboardMetrics.thirdParty, helper: `${dashboardMetrics.total - dashboardMetrics.thirdParty} internal`, icon: Building2 },
                { label: 'Needs Review', value: dashboardMetrics.needsReviewContacts.length, helper: 'Missing key data', icon: AlertCircle },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="rounded-2xl bg-indigo-50 p-3 dark:bg-[#102431]">
                        <Icon className="h-5 w-5 text-indigo-600 dark:text-[#7fdcff]" />
                      </div>
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                        live
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</div>
                    <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">{card.label}</div>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">{card.helper}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Data Quality Alerts</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Issues that should be cleaned up by admins.</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveSection('contacts');
                      setAdminFilter('quality');
                      setCurrentPage(1);
                    }}
                    className="btn-secondary text-sm"
                  >
                    Review Records
                  </button>
                </div>

                {qualityAlerts.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                    No major data quality alerts detected.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {qualityAlerts.map((alert) => {
                      const Icon = alert.icon;
                      return (
                        <div
                          key={alert.id}
                          className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-[#21415a] dark:bg-[#102431]/70"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-sky-100 p-2 dark:bg-[#143040]">
                              <Icon className="h-4 w-4 text-sky-700 dark:text-[#7fdcff]" />
                            </div>
                            <div>
                              <div className="text-lg font-bold text-slate-900 dark:text-white">{alert.count}</div>
                              <div className="text-sm text-slate-700 dark:text-slate-300">{alert.label}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Departments</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Most populated areas in the phonebook.</p>
                </div>
                <div className="space-y-3">
                  {topDepartments.map(([department, count]) => (
                    <div key={department} className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-[#253649] dark:bg-[#17212c]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-gray-900 dark:text-white">{department}</span>
                        <span className="badge badge-primary">{count}</span>
                      </div>
                    </div>
                  ))}
                  {topDepartments.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No department data available.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Records Needing Review</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Quick access to incomplete contact profiles.</p>
                </div>
                <div className="space-y-3">
                  {recentReviewContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleEditContact(contact)}
                      className="flex w-full items-start justify-between rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-left transition-colors hover:bg-gray-100 dark:border-[#253649] dark:bg-[#17212c] dark:hover:bg-[#1c2834]"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{contact.name}</div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {[contact.department, contact.designation, contact.extension && `Ext ${contact.extension}`]
                            .filter(Boolean)
                            .join(' • ') || 'Missing multiple fields'}
                        </div>
                      </div>
                      <Edit2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </button>
                  ))}
                  {recentReviewContacts.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Everything looks complete.</div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Shortcuts</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Common maintenance paths for daily operations.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: 'Manage hidden contacts',
                      helper: `${dashboardMetrics.hidden} hidden`,
                      onClick: () => {
                        setActiveSection('contacts');
                        setAdminFilter('hidden');
                        setCurrentPage(1);
                      },
                    },
                    {
                      label: 'Review third-party entries',
                      helper: `${dashboardMetrics.thirdParty} entries`,
                      onClick: () => {
                        setActiveSection('contacts');
                        setAdminFilter('thirdParty');
                        setCurrentPage(1);
                      },
                    },
                    {
                      label: 'Open data cleanup queue',
                      helper: `${dashboardMetrics.needsReviewContacts.length} records`,
                      onClick: () => {
                        setActiveSection('contacts');
                        setAdminFilter('quality');
                        setCurrentPage(1);
                      },
                    },
                    {
                      label: 'Review taxonomy',
                      helper: `${dashboardMetrics.uniqueDepartments + dashboardMetrics.uniqueCompanies} structured values`,
                      onClick: () => setActiveSection('settings'),
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-left transition-colors hover:bg-gray-100 dark:border-[#253649] dark:bg-[#17212c] dark:hover:bg-[#1c2834]"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">{item.label}</div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.helper}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'contacts' && (
          <div className="space-y-6">
            {selectedContactIds.length > 0 && (
              <div className="sticky top-4 z-20 rounded-3xl border border-sky-100 bg-white/95 p-4 shadow-lg shadow-sky-100/50 backdrop-blur dark:border-[#2d5973] dark:bg-[#121a23]/95 dark:shadow-black/20">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedContactIds.length} selected {selectedContactIds.length === 1 ? 'contact' : 'contacts'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Keep selecting contacts, then open the bulk editor when ready.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsBulkEditorOpen((prev) => !prev)}
                      className="btn-primary text-sm"
                    >
                      {isBulkEditorOpen ? 'Hide Bulk Actions' : 'Show Bulk Actions'}
                    </button>
                    <button
                      onClick={() => setSelectedContactIds([])}
                      className="btn-secondary text-sm"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                {isBulkEditorOpen && (
                  <div className="mt-4 border-t border-sky-100 pt-4 dark:border-[#2d5973]">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                      <input
                        value={bulkUpdates.department}
                        onChange={(e) => handleBulkInputChange('department', e.target.value)}
                        placeholder="Department"
                        className="input"
                      />
                      <input
                        value={bulkUpdates.company}
                        onChange={(e) => handleBulkInputChange('company', e.target.value)}
                        placeholder="Company"
                        className="input"
                      />
                      <input
                        value={bulkUpdates.designation}
                        onChange={(e) => handleBulkInputChange('designation', e.target.value)}
                        placeholder="Designation"
                        className="input"
                      />
                      <input
                        value={bulkUpdates.tags}
                        onChange={(e) => handleBulkInputChange('tags', e.target.value)}
                        placeholder="Tags (comma separated)"
                        className="input"
                      />
                      <input
                        value={bulkUpdates.languages}
                        onChange={(e) => handleBulkInputChange('languages', e.target.value)}
                        placeholder="Languages (comma separated)"
                        className="input"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['expose', 'Visibility'],
                          ['is_ert', 'ERT'],
                          ['is_ifa', 'IFA'],
                          ['is_third_party', '3rd Party'],
                        ].map(([field, label]) => (
                          <select
                            key={field}
                            value={bulkUpdates[field]}
                            onChange={(e) => handleBulkInputChange(field, e.target.value)}
                            className="input text-sm"
                          >
                            <option value="keep">{label}: Keep</option>
                            <option value="true">{label}: Yes</option>
                            <option value="false">{label}: No</option>
                          </select>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleApplyBulkUpdates}
                        disabled={bulkUpdateMutation.isPending}
                        className="btn-primary disabled:opacity-50"
                      >
                        Apply To Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative flex-1 xl:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts, departments, extensions..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="input w-full pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {CONTACT_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setAdminFilter(filter.id);
                        setCurrentPage(1);
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        adminFilter === filter.id
                          ? 'border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md dark:from-[#23b7f2] dark:to-[#139fe3] dark:text-[#051018]'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#29556e] dark:bg-[#171d24] dark:text-gray-200 dark:hover:bg-[#1f252d]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span>Showing {paginatedContacts.length} of {processedContacts.length} records</span>
                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
                <span>Total directory size: {dashboardMetrics.total}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Import / Export</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Export the current directory or preview a CSV before importing contacts.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={handleExportContacts} className="btn-secondary text-sm">
                    Export CSV
                  </button>
                  <button
                    onClick={() => setIsImportPanelOpen((prev) => !prev)}
                    className="btn-primary text-sm"
                  >
                    {isImportPanelOpen ? 'Hide Import' : 'Show Import'}
                  </button>
                </div>
              </div>

              {isImportPanelOpen && (
                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-[#243244]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedImportFile(file);
                        setImportPreview(null);
                      }}
                      className="block w-full text-sm text-gray-600 dark:text-gray-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handlePreviewImport}
                        disabled={importPreviewMutation.isPending || !selectedImportFile}
                        className="btn-secondary text-sm disabled:opacity-50"
                      >
                        Preview Import
                      </button>
                      <button
                        onClick={handleApplyImport}
                        disabled={importPreviewMutation.isPending || !selectedImportFile}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        Apply Import
                      </button>
                    </div>
                  </div>

                  {importPreview && (
                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-[#253649] dark:bg-[#17212c]">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Import Summary</div>
                        <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <div>Total rows: {importPreview.total_rows}</div>
                          <div>Valid rows: {importPreview.valid_rows}</div>
                          <div>Created rows: {importPreview.created_count}</div>
                          <div>Errors: {importPreview.errors?.length || 0}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-[#253649] dark:bg-[#17212c]">
                          <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Preview</div>
                          <div className="max-h-56 space-y-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {(importPreview.preview || []).map((row) => (
                              <div key={row.row} className="rounded-xl border border-gray-200 bg-white/80 p-3 text-sm dark:border-[#31465a] dark:bg-[#121a23]">
                                <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {[row.department, row.designation, row.company].filter(Boolean).join(' • ') || 'No taxonomy fields'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-[#253649] dark:bg-[#17212c]">
                          <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Errors</div>
                          <div className="max-h-56 space-y-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {(importPreview.errors || []).length > 0 ? (
                              importPreview.errors.map((item, index) => (
                                <div key={`${item.row}-${index}`} className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
                                  Row {item.row}: {item.message}
                                </div>
                              ))
                            ) : (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
                                No validation errors found.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden lg:block overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-[#243244] table-fixed">
                  <thead className="bg-gray-50 dark:bg-[#0f151d]">
                    <tr>
                      <th className="w-12 px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={paginatedContacts.length > 0 && paginatedContacts.every((contact) => selectedContactIds.includes(contact.id))}
                          onChange={handleToggleSelectAllVisible}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </th>
                      <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Photo
                      </th>
                      <TableHeader column="name" label="Name" />
                      <TableHeader column="designation" label="Designation" />
                      <TableHeader column="department" label="Department" />
                      <TableHeader column="company" label="Company" />
                      <th className="w-64 px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#121a23]">
                    {paginatedContacts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-12 text-center">
                          <div className="text-gray-500 dark:text-gray-400">
                            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-lg font-medium">No contacts found</p>
                            <p className="text-sm">
                              {searchTerm ? 'Try adjusting your search or admin filter' : 'Get started by adding a new contact'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedContacts.map((contact) => (
                        <tr key={contact.id} className="border-b border-gray-200/80 align-top transition-colors hover:bg-gray-50/80 dark:border-[#243244] dark:hover:bg-[#17212c]">
                          <td className="px-3 py-4">
                            <input
                              type="checkbox"
                              checked={selectedContactIds.includes(contact.id)}
                              onChange={() => handleToggleSelectContact(contact.id)}
                              className="mt-3 h-4 w-4 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-3 py-4">
                            {contact.profile_picture ? (
                              <img
                                src={contact.profile_picture}
                                alt={contact.name}
                                className="w-11 h-11 rounded-full object-cover border-2 border-indigo-100 dark:border-[#29556e]"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-[#102431] dark:to-[#183446] flex items-center justify-center">
                                <User className="w-5 h-5 text-indigo-400 dark:text-[#7fdcff]" />
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-4">
                            <div className="max-w-[220px]">
                              <div className="text-[15px] font-semibold leading-tight text-gray-900 dark:text-white">{contact.name}</div>
                              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                                {contact.email || contact.mobile || 'No direct contact'}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="max-w-[310px] text-sm font-medium leading-snug text-gray-800 dark:text-gray-100">
                              {contact.designation || 'No designation'}
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{contact.department || 'No department'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{contact.extension ? `Ext ${contact.extension}` : 'No extension'}</div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{contact.company || 'No company'}</div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="max-w-[220px] space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleToggleERT(contact)}
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                    contact.is_ert
                                      ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
                                      : 'bg-gray-100 text-gray-500 dark:bg-[#1a2430] dark:text-gray-400'
                                  }`}
                                >
                                  {contact.is_ert ? <Shield className="mr-1 h-3 w-3" /> : <ShieldOff className="mr-1 h-3 w-3" />}
                                  ERT
                                </button>
                                <button
                                  onClick={() => handleToggleIFA(contact)}
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                    contact.is_ifa
                                      ? 'bg-blue-100 text-blue-800 dark:bg-sky-900/30 dark:text-sky-300'
                                      : 'bg-gray-100 text-gray-500 dark:bg-[#1a2430] dark:text-gray-400'
                                  }`}
                                >
                                  <Building className="mr-1 h-3 w-3" />
                                  IFA
                                </button>
                                <button
                                  onClick={() => handleToggleThirdParty(contact)}
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                    contact.is_third_party
                                      ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
                                      : 'bg-gray-100 text-gray-500 dark:bg-[#1a2430] dark:text-gray-400'
                                  }`}
                                >
                                  <Building2 className="mr-1 h-3 w-3" />
                                  3rd Party
                                </button>
                              </div>

                              <div>
                                <button
                                  onClick={() => handleToggleExpose(contact)}
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                    contact.expose
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                                  }`}
                                >
                                  {contact.expose ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                                  {contact.expose ? 'Visible' : 'Hidden'}
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditContact(contact)}
                                className="rounded-xl border border-gray-200 p-2 text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-[#2b3b4f] dark:text-[#7fdcff] dark:hover:bg-[#102431]"
                                title="Edit contact"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(contact)}
                                className="rounded-xl border border-gray-200 p-2 text-red-600 transition-colors hover:bg-red-50 dark:border-[#2b3b4f] dark:text-red-400 dark:hover:bg-red-900/20"
                                title="Delete contact"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:hidden space-y-4">
              {paginatedContacts.length === 0 ? (
                <div className="rounded-3xl border border-white/60 bg-white/90 p-12 text-center shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">No contacts found</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search or admin filter' : 'Get started by adding a new contact'}
                  </p>
                </div>
              ) : (
                paginatedContacts.map((contact) => (
                  <div key={contact.id} className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                    <div className="mb-4 flex items-start gap-4">
                      {contact.profile_picture ? (
                        <img
                          src={contact.profile_picture}
                          alt={contact.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 dark:border-[#29556e] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-[#102431] dark:to-[#183446] flex items-center justify-center flex-shrink-0">
                          <User className="w-8 h-8 text-indigo-400 dark:text-[#7fdcff]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
                        <p className="truncate text-sm text-gray-600 dark:text-gray-300">{contact.designation || 'No designation'}</p>
                        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                          {[contact.department, contact.company].filter(Boolean).join(' • ') || 'No department/company'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleToggleERT(contact)}
                        className={`badge ${contact.is_ert ? 'badge-warning' : 'bg-gray-100 dark:bg-[#1a2430] text-gray-700 dark:text-gray-200'}`}
                      >
                        {contact.is_ert ? <Shield className="w-3 h-3 mr-1" /> : <ShieldOff className="w-3 h-3 mr-1" />}
                        ERT
                      </button>
                      <button
                        onClick={() => handleToggleIFA(contact)}
                        className={`badge ${contact.is_ifa ? 'badge-primary' : 'bg-gray-100 dark:bg-[#1a2430] text-gray-700 dark:text-gray-200'}`}
                      >
                        <Building className="w-3 h-3 mr-1" />
                        IFA
                      </button>
                      <button
                        onClick={() => handleToggleExpose(contact)}
                        className={`badge ${contact.expose ? 'badge-success' : 'badge-error'}`}
                      >
                        {contact.expose ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {contact.expose ? 'Visible' : 'Hidden'}
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">Extension:</span> <span className="text-gray-900 dark:text-white">{contact.extension || 'Missing'}</span></div>
                      <div><span className="text-gray-500">Email:</span> <span className="text-gray-900 dark:text-white">{contact.email || 'Missing'}</span></div>
                      <div><span className="text-gray-500">Company:</span> <span className="text-gray-900 dark:text-white">{contact.company || 'Missing'}</span></div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-gray-200 pt-3 dark:border-[#243244]">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="flex-1 rounded-xl bg-indigo-50 px-4 py-2 font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-[#102431] dark:text-[#7fdcff] dark:hover:bg-[#173041]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(contact)}
                        className="flex-1 rounded-xl bg-red-50 px-4 py-2 font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {taxonomyCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.id} className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                    <div className="mb-4 rounded-2xl bg-indigo-50 p-3 w-fit dark:bg-[#102431]">
                      <Icon className="h-5 w-5 text-indigo-600 dark:text-[#7fdcff]" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.count}</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{card.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.86fr_1.14fr]">
              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Taxonomy Manager</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Review live directory values and jump straight into matching records.
                  </p>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {taxonomyCards.map((item) => {
                    const Icon = item.icon;
                    const isActive = selectedTaxonomy === item.id;
                    const coveredCount = taxonomyCoverage[item.id];
                    const coveragePercent = Math.round((coveredCount / taxonomyCoverage.total) * 100);
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedTaxonomy(item.id)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          isActive
                            ? 'border-sky-200 bg-sky-50 shadow-sm dark:border-[#2d5973] dark:bg-[#102431]'
                            : 'border-gray-200 bg-gray-50/80 hover:bg-gray-100 dark:border-[#253649] dark:bg-[#17212c] dark:hover:bg-[#1c2834]'
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                            isActive ? 'bg-white text-sky-600 dark:bg-[#132c3b] dark:text-[#7fdcff]' : 'bg-white/80 text-slate-600 dark:bg-[#1d2a37] dark:text-slate-300'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="badge badge-primary">{item.count}</span>
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">{item.label}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {coveredCount} contacts covered • {coveragePercent}%
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-[#253649] dark:bg-[#17212c]">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedTaxonomyMeta.label} coverage
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {taxonomyCoverage[selectedTaxonomy]}
                    <span className="ml-2 text-base font-medium text-gray-500 dark:text-gray-400">of {dashboardMetrics.total}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-[#223243]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
                      style={{ width: `${Math.round((taxonomyCoverage[selectedTaxonomy] / taxonomyCoverage.total) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTaxonomyMeta.label} Inventory</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Search live values, inspect usage, and manage taxonomy names from the backend.
                    </p>
                  </div>
                  <div className="relative w-full lg:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={settingsSearchTerm}
                      onChange={(e) => setSettingsSearchTerm(e.target.value)}
                      placeholder={`Search ${selectedTaxonomyMeta.label.toLowerCase()}...`}
                      className="input w-full pl-9"
                    />
                  </div>
                </div>

                <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-[#253649] dark:bg-[#17212c]">
                  <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Create {selectedTaxonomySingularLabel}</div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={newTaxonomyName}
                      onChange={(e) => setNewTaxonomyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateTaxonomy();
                        }
                      }}
                      placeholder={`Add a new ${selectedTaxonomySingularLabel.toLowerCase()}...`}
                      className="input flex-1"
                    />
                    <button
                      onClick={handleCreateTaxonomy}
                      disabled={createTaxonomyMutation.isPending || !newTaxonomyName.trim()}
                      className="btn-primary whitespace-nowrap disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </div>

                {selectedTaxonomyItem && (
                  <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-[#2d5973] dark:bg-[#102431]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Manage Selected Value</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedTaxonomyItem.count} {selectedTaxonomyItem.count === 1 ? 'contact uses this value' : 'contacts use this value'}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTaxonomyItem(null);
                          setRenameTaxonomyName('');
                          setReplacementTaxonomyName('');
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                          Rename Value
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={renameTaxonomyName}
                            onChange={(e) => setRenameTaxonomyName(e.target.value)}
                            className="input flex-1"
                          />
                          <button
                            onClick={handleRenameTaxonomy}
                            disabled={renameTaxonomyMutation.isPending || !renameTaxonomyName.trim()}
                            className="btn-secondary whitespace-nowrap disabled:opacity-50"
                          >
                            Rename
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                          Replacement On Delete
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={replacementTaxonomyName}
                            onChange={(e) => setReplacementTaxonomyName(e.target.value)}
                            placeholder={selectedTaxonomyItem.count > 0 ? 'Required if this value is in use' : 'Optional'}
                            className="input flex-1"
                          />
                          <button
                            onClick={handleDeleteTaxonomy}
                            disabled={deleteTaxonomyMutation.isPending}
                            className="btn-secondary whitespace-nowrap text-red-600 dark:text-red-400 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {isTaxonomyLoading && (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-8 text-center text-sm text-gray-500 dark:border-[#31465a] dark:bg-[#17212c] dark:text-gray-400">
                      Loading {selectedTaxonomyMeta.label.toLowerCase()}...
                    </div>
                  )}

                  {filteredTaxonomyItems.slice(0, 12).map((item) => (
                    <div
                      key={item.name}
                      className={`rounded-2xl border p-4 transition-colors ${
                        selectedTaxonomyItem?.name === item.name
                          ? 'border-sky-200 bg-sky-50/80 dark:border-[#2d5973] dark:bg-[#102431]'
                          : 'border-gray-200 bg-gray-50/80 dark:border-[#253649] dark:bg-[#17212c]'
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold text-gray-900 dark:text-white">{item.name}</div>
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Used by {item.count} {item.count === 1 ? 'contact' : 'contacts'}
                            {item.samples.length > 0 && ` • ${item.samples.join(', ')}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-primary">{item.count}</span>
                          <button
                            onClick={() => handleSelectTaxonomyItem(item)}
                            className="btn-secondary text-sm"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleOpenTaxonomyInContacts(selectedTaxonomy, item.name)}
                            className="btn-secondary text-sm"
                          >
                            View Contacts
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredTaxonomyItems.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-8 text-center text-sm text-gray-500 dark:border-[#31465a] dark:bg-[#17212c] dark:text-gray-400">
                      No {selectedTaxonomyMeta.label.toLowerCase()} matched your search.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Configuration</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Recommended admin areas to formalize next.</p>
                </div>
                <div className="space-y-3">
                  {[
                    'Taxonomy management for departments, companies, designations, tags, and languages',
                    'Import/export tools with CSV validation preview',
                    'Role and permission controls for admins and editors',
                    'Audit history for edits, deletions, and access activity',
                    'Archived/inactive contact workflow instead of permanent deletion only',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-700 dark:border-[#253649] dark:bg-[#17212c] dark:text-gray-200">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Directory Structure Snapshot</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current scale of the phonebook taxonomy.</p>
                </div>
                <div className="space-y-3">
                  {taxonomyCards.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-[#253649] dark:bg-[#17212c]">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-indigo-600 dark:text-[#7fdcff]" />
                        <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                      </div>
                      <span className="badge badge-primary">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg shadow-indigo-100/40 dark:border-[#243244] dark:bg-[#121a23] dark:shadow-black/20">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 dark:bg-[#102431]">
                  <Layers3 className="h-5 w-5 text-indigo-600 dark:text-[#7fdcff]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Roadmap</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">The panel is now structured for growth without changing routes.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { title: 'Overview', text: 'Dashboard metrics, data health, and operational shortcuts are now surfaced first.' },
                  { title: 'Contact Management', text: 'Admin filtering and contact actions remain the main workflow for day-to-day edits.' },
                  { title: 'Settings', text: 'Taxonomy and system admin capabilities now have a dedicated area ready for expansion.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-[#253649] dark:bg-[#17212c]">
                    <div className="font-semibold text-gray-900 dark:text-white">{item.title}</div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </main>
      </div>

      <AdminContactFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedContact(null);
        }}
        contact={selectedContact}
        onSubmit={handleFormSubmit}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setContactToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact"
        message={`Are you sure you want to delete "${contactToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
};

export default AdminDashboard;
