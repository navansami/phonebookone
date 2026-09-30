import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Search,
  MapPin,
  Phone,
  ChevronDown,
  RotateCcw,
  Stethoscope,
  ClipboardList,
  Activity,
  Pill,
  Hospital,
  Network,
} from 'lucide-react';
import { FMC_NETWORK_PROVIDERS } from '../data/fmcNetworkData';

const PAGE_SIZE = 60;

const EMIRATES = ['ABU DHABI', 'AJMAN', 'DUBAI', 'FUJAIRAH', 'RAS AL KHAIMAH', 'SHARJAH', 'UMM AL QUWAIN'];

const TYPE_STYLES = {
  Hospital: 'badge-error',
  'Government Hospital': 'badge-error',
  'Day Care Center': 'badge-warning',
  Clinic: 'badge-primary',
  'Dental Clinic': 'badge-purple',
  'Diagnostic Center': 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
  'Home Healthcare': 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  Pharmacy: 'badge-success',
};

const TYPE_ICONS = {
  Hospital: Hospital,
  'Government Hospital': Hospital,
  'Day Care Center': Activity,
  Clinic: Stethoscope,
  'Dental Clinic': Stethoscope,
  'Diagnostic Center': ClipboardList,
  'Home Healthcare': Activity,
  Pharmacy: Pill,
};

const formatCount = (n) => n.toLocaleString('en-US');

const FmcNetworkModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [emirate, setEmirate] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [area, setArea] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Close on Escape + lock body scroll (same pattern as other modals)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset state each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setEmirate('');
      setSelectedType('');
      setArea('');
      setVisibleCount(PAGE_SIZE);
    }
  }, [isOpen]);

  const typeCounts = useMemo(() => {
    const counts = {};
    FMC_NETWORK_PROVIDERS.forEach((provider) => {
      counts[provider.type] = (counts[provider.type] || 0) + 1;
    });
    return counts;
  }, []);

  const areaOptions = useMemo(() => {
    if (!emirate) return [];
    return [
      ...new Set(
        FMC_NETWORK_PROVIDERS.filter((provider) => provider.emirate === emirate && provider.area).map(
          (provider) => provider.area
        )
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [emirate]);

  const filteredProviders = useMemo(() => {
    const rawQuery = query.trim().toLowerCase();
    const normalizedQuery = rawQuery.replace(/[^a-z0-9]/g, '');

    return FMC_NETWORK_PROVIDERS.filter((provider) => {
      if (emirate && provider.emirate !== emirate) return false;
      if (selectedType && provider.type !== selectedType) return false;
      if (area && provider.area !== area) return false;
      if (!rawQuery) return true;

      const searchableFields = [provider.name, provider.location, provider.area, provider.emirate, provider.specialties, provider.haRegNo, provider.poBox]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (searchableFields.includes(rawQuery)) return true;

      // Allow phone searches with or without dashes/spaces
      const normalizedPhone = (provider.phone || '').replace(/[^0-9+]/g, '');
      return normalizedQuery.length >= 3 && normalizedPhone.includes(normalizedQuery);
    });
  }, [query, emirate, selectedType, area]);

  const visibleProviders = filteredProviders.slice(0, visibleCount);
  const hasActiveFilters = Boolean(query.trim() || emirate || selectedType || area);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleEmirateChange = (e) => {
    setEmirate(e.target.value);
    setArea('');
    setVisibleCount(PAGE_SIZE);
  };

  const handleAreaChange = (e) => {
    setArea(e.target.value);
    setVisibleCount(PAGE_SIZE);
  };

  const toggleType = (type) => {
    setSelectedType((current) => (current === type ? '' : type));
    setVisibleCount(PAGE_SIZE);
  };

  const handleReset = () => {
    setQuery('');
    setEmirate('');
    setSelectedType('');
    setArea('');
    setVisibleCount(PAGE_SIZE);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-black/50 backdrop-blur-sm animate-fadeIn sm:justify-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="flex h-full w-full flex-col bg-white shadow-xl dark:bg-[#171d24] sm:h-[90vh] sm:max-h-[90vh] sm:max-w-6xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-[#24303c] dark:bg-[#171d24]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-[#112433]">
              <Network className="h-5 w-5 text-indigo-600 dark:text-[#69d6ff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">FMC Network</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                UAE Standard Network List &middot; September 2025
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Filters */}
        <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-[#24303c] dark:bg-[#171d24]">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search provider, specialty, location, HA Reg No..."
              className="input w-full pl-10"
              aria-label="Search FMC Network"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="relative">
              <label className="sr-only" htmlFor="fmc-emirate">Emirate</label>
              <select id="fmc-emirate" value={emirate} onChange={handleEmirateChange} className="input w-full appearance-none pr-8">
                <option value="">All Emirates</option>
                {EMIRATES.map((emirateOption) => (
                  <option key={emirateOption} value={emirateOption}>{emirateOption}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="relative">
              <label className="sr-only" htmlFor="fmc-area">Area</label>
              <select id="fmc-area" value={area} onChange={handleAreaChange} className="input w-full appearance-none pr-8" disabled={!emirate}>
                <option value="">{emirate ? 'All Areas' : 'Select Emirate First'}</option>
                {areaOptions.map((areaOption) => (
                  <option key={areaOption} value={areaOption}>{areaOption}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <button
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className="btn-secondary col-span-2 flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </button>
          </div>

          {/* Type chips */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {Object.keys(TYPE_STYLES).map((type) => {
              const TypeIcon = TYPE_ICONS[type];
              const isActive = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-600 text-white dark:border-[#23b7f2] dark:bg-[#23b7f2] dark:text-[#051018]'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#2d3a47] dark:bg-[#1c232c] dark:text-slate-200 dark:hover:bg-[#24303c]'
                  }`}
                >
                  <TypeIcon className="h-3.5 w-3.5" />
                  {type}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/25' : 'bg-gray-100 dark:bg-[#2a3440]'}`}>
                    {formatCount(typeCounts[type] || 0)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <p className="mb-4 text-sm text-gray-600 dark:text-slate-300">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{formatCount(visibleProviders.length)}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{formatCount(filteredProviders.length)}</span>{' '}
            providers
            {hasActiveFilters && (
              <button onClick={handleReset} className="ml-2 text-xs font-semibold text-indigo-600 hover:underline dark:text-[#69d6ff]">
                Clear all filters
              </button>
            )}
          </p>

          {filteredProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 rounded-full bg-gray-100 p-4 dark:bg-[#24303c]">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No providers found</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-slate-400">
                Try adjusting your search or clearing the active filters.
              </p>
              <button onClick={handleReset} className="btn-primary mt-5 text-sm">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleProviders.map((provider) => {
                  const TypeIcon = TYPE_ICONS[provider.type];
                  return (
                    <div
                      key={provider.id}
                      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors dark:border-[#24303c] dark:bg-[#1c232c]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`badge ${TYPE_STYLES[provider.type] || 'badge-primary'}`}>
                          {provider.type}
                        </span>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{provider.emirate}</p>
                          {provider.area && (
                            <p className="text-xs text-gray-500 dark:text-slate-400">{provider.area}</p>
                          )}
                        </div>
                      </div>

                      <h3 className="mt-3 text-base font-semibold leading-snug text-gray-900 dark:text-white">
                        {provider.name}
                      </h3>

                      {provider.specialties && (
                        <p className="mt-1.5 line-clamp-2 text-xs font-medium text-indigo-600 dark:text-[#69d6ff]">
                          {provider.specialties}
                        </p>
                      )}

                      {provider.location && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-2" title={provider.location}>{provider.location}</span>
                        </p>
                      )}

                      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-[#2a3440]">
                        <div className="flex items-end justify-between gap-2">
                          <div className="min-w-0 space-y-0.5">
                            {provider.poBox && (
                              <p className="truncate text-[11px] text-gray-400 dark:text-slate-500">P.O. Box {provider.poBox}</p>
                            )}
                            {provider.haRegNo && (
                              <p className="truncate text-[11px] text-gray-400 dark:text-slate-500">HA Reg: {provider.haRegNo}</p>
                            )}
                          </div>
                          <a
                            href={`tel:${provider.phone.replace(/[^0-9+]/g, '')}`}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-[#112433] dark:text-[#69d6ff] dark:hover:bg-[#143044]"
                            title={`Call ${provider.name}`}
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {provider.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {visibleProviders.length < filteredProviders.length && (
                <div className="mt-6 flex justify-center pb-4">
                  <button
                    onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                    className="btn-secondary"
                  >
                    Show {formatCount(Math.min(PAGE_SIZE, filteredProviders.length - visibleProviders.length))} more
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer note */}
        <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6 dark:border-[#24303c] dark:bg-[#131820]">
          <p className="text-center text-[11px] leading-relaxed text-gray-500 dark:text-slate-500">
            We request that provider participation be confirmed prior to availing services. FMC Network UAE reserves the
            right to add, suspend, or terminate any providers from the panel without prior notice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FmcNetworkModal;
