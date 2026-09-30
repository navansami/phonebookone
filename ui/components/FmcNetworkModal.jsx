import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, MapPin, Network, Phone, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../services/api';

const PAGE_SIZE = 24;
const EMPTY_PROVIDERS = [];
const EMIRATES = ['ABU DHABI', 'AJMAN', 'DUBAI', 'FUJAIRAH', 'RAS AL KHAIMAH', 'SHARJAH', 'UMM AL QUWAIN'];
const TYPES = ['Hospital', 'Government Hospital', 'Day Care Center', 'Clinic', 'Dental Clinic', 'Diagnostic Center', 'Home Healthcare', 'Pharmacy'];
const formatCount = number => number.toLocaleString('en-US');

const FmcNetworkModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [emirate, setEmirate] = useState('');
  const [area, setArea] = useState('');
  const [type, setType] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: providers = EMPTY_PROVIDERS, isLoading, isError, refetch } = useQuery({
    queryKey: ['fmc-network'],
    queryFn: async () => (await api.get('/api/fmc-network')).data.providers,
    enabled: isOpen,
    staleTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const onEscape = event => { if (event.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setEmirate('');
    setArea('');
    setType('');
    setFiltersOpen(false);
    setVisibleCount(PAGE_SIZE);
  }, [isOpen]);

  const areaOptions = useMemo(() => {
    if (!emirate) return [];
    return [...new Set(providers.filter(provider => provider.emirate === emirate).map(provider => provider.area).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
  }, [providers, emirate]);

  const typeCounts = useMemo(() => providers.reduce((counts, provider) => {
    counts[provider.type] = (counts[provider.type] || 0) + 1;
    return counts;
  }, {}), [providers]);

  const filteredProviders = useMemo(() => {
    const text = query.trim().toLowerCase();
    const phoneSearch = text.replace(/[^0-9+]/g, '');
    return providers.filter(provider => {
      if (emirate && provider.emirate !== emirate) return false;
      if (area && provider.area !== area) return false;
      if (type && provider.type !== type) return false;
      if (!text) return true;
      const details = [provider.name, provider.location, provider.area, provider.emirate, provider.specialties, provider.haRegNo, provider.poBox]
        .filter(Boolean).join(' ').toLowerCase();
      return details.includes(text) || (phoneSearch.length >= 3 && provider.phone.replace(/[^0-9+]/g, '').includes(phoneSearch));
    });
  }, [providers, query, emirate, area, type]);

  const hasFilters = Boolean(query.trim() || emirate || area || type);
  const locationFilterCount = Number(Boolean(emirate)) + Number(Boolean(area)) + Number(Boolean(type));
  const visibleProviders = filteredProviders.slice(0, visibleCount);
  const remaining = filteredProviders.length - visibleProviders.length;

  const resetFilters = () => {
    setQuery('');
    setEmirate('');
    setArea('');
    setType('');
    setFiltersOpen(false);
    setVisibleCount(PAGE_SIZE);
  };
  const updateFilter = (setter, value) => {
    setter(value);
    setVisibleCount(PAGE_SIZE);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4 lg:p-8"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="fmc-network-title"
        className="flex h-full max-h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-[#171a20] sm:h-auto sm:max-h-[min(88vh,850px)] sm:max-w-5xl sm:rounded-2xl sm:border sm:border-purple-200/70 dark:sm:border-[#24465c]"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 via-white to-white px-4 py-4 dark:border-[#24465c] dark:from-[#162332] dark:via-[#171a20] dark:to-[#171a20] sm:px-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-sm dark:from-[#23b7f2] dark:to-[#1296e2]">
            <Network className="h-5 w-5 text-white dark:text-[#051018]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="fmc-network-title" className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">FMC Network</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {isLoading ? 'Loading providers…' : `${formatCount(providers.length)} medical providers across the UAE`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 transition-colors hover:bg-purple-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-[#24303c] dark:hover:text-white" aria-label="Close FMC Network">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="shrink-0 space-y-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-[#28303a] dark:bg-[#171a20] sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-500 dark:text-[#69d6ff]" />
            <input
              type="search"
              value={query}
              onChange={event => updateFilter(setQuery, event.target.value)}
              placeholder="Search providers or locations"
              aria-label="Search provider, specialty, location or phone"
              className="input w-full pl-11 pr-10 text-sm"
            />
            {query && <button type="button" onClick={() => updateFilter(setQuery, '')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#24303c] dark:hover:text-white" aria-label="Clear search"><X className="h-4 w-4" /></button>}
          </div>

          <button type="button" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} aria-controls="fmc-filters" className="btn-secondary flex w-full items-center justify-between px-3 py-2 text-sm sm:hidden">
            <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Filters{locationFilterCount > 0 && <span className="badge badge-primary px-2 py-0.5">{locationFilterCount}</span>}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          <div id="fmc-filters" className={`${filtersOpen ? 'grid' : 'hidden'} grid-cols-2 gap-2 sm:grid sm:grid-cols-3`}>
            <div className="relative">
              <label htmlFor="fmc-emirate" className="sr-only">Emirate</label>
              <select id="fmc-emirate" value={emirate} onChange={event => { updateFilter(setEmirate, event.target.value); setArea(''); }} className="input w-full cursor-pointer appearance-none pr-8 text-sm">
                <option value="">All emirates</option>
                {EMIRATES.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative">
              <label htmlFor="fmc-type" className="sr-only">Provider type</label>
              <select id="fmc-type" value={type} onChange={event => updateFilter(setType, event.target.value)} className="input w-full cursor-pointer appearance-none pr-8 text-sm">
                <option value="">All provider types</option>
                {TYPES.map(option => <option key={option} value={option}>{option} ({formatCount(typeCounts[option] || 0)})</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative col-span-2 sm:col-span-1">
              <label htmlFor="fmc-area" className="sr-only">Area</label>
              <select id="fmc-area" value={area} onChange={event => updateFilter(setArea, event.target.value)} disabled={!emirate} className="input w-full cursor-pointer appearance-none pr-8 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                <option value="">{emirate ? 'All areas' : 'Choose an emirate for areas'}</option>
                {areaOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/70 px-4 py-4 dark:bg-[#10151b] sm:px-6 sm:py-5">
          {!isLoading && !isError && (
            <div className="mb-4 flex min-h-8 items-center justify-between gap-3" aria-live="polite">
              <p className="text-sm text-gray-600 dark:text-slate-300">
                <span className="font-semibold text-gray-900 dark:text-white">{formatCount(filteredProviders.length)}</span> {filteredProviders.length === 1 ? 'provider' : 'providers'}
                {hasFilters && <span className="text-gray-400 dark:text-slate-500"> of {formatCount(providers.length)}</span>}
              </p>
              {hasFilters && <button type="button" onClick={resetFilters} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:underline dark:text-[#69d6ff]"><RotateCcw className="h-3.5 w-3.5" />Clear filters</button>}
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2" aria-label="Loading FMC providers">
              {[1, 2, 3, 4].map(number => <div key={number} className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-[#24465c] dark:bg-[#171d24]" />)}
            </div>
          ) : isError ? (
            <div className="card mx-auto max-w-md p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Could not load providers</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Check your connection and try again.</p>
              <button type="button" onClick={() => refetch()} className="btn-primary mt-5 text-sm">Try again</button>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="card mx-auto max-w-md p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-purple-400 dark:text-[#69d6ff]" />
              <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">No providers found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Try another search or remove a filter.</p>
              {hasFilters && <button type="button" onClick={resetFilters} className="btn-secondary mt-5 text-sm">Clear filters</button>}
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleProviders.map(provider => (
                  <article key={provider.id} className="flex flex-col rounded-2xl border border-purple-200/70 bg-white p-4 shadow-sm transition-colors hover:border-purple-400 dark:border-[#24465c] dark:bg-[#171d24] dark:hover:border-[#3cc9ff] sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="badge badge-primary max-w-[70%] truncate">{provider.type}</span>
                      <span className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{provider.emirate}</span>
                    </div>
                    <h3 className="mt-3 text-base font-bold leading-snug text-gray-900 dark:text-white">{provider.name}</h3>
                    {provider.specialties && <p className="mt-1.5 text-xs font-medium text-purple-700 dark:text-[#7eddff]">{provider.specialties}</p>}
                    <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-gray-600 dark:text-slate-300">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-500 dark:text-[#69d6ff]" />
                      <span className="line-clamp-2" title={provider.location}>{provider.location}</span>
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-purple-100 pt-3 dark:border-[#28303a]">
                      <div className="min-w-0 text-xs text-gray-500 dark:text-slate-400">
                        <p className="truncate font-medium text-gray-700 dark:text-slate-300">{provider.area}</p>
                        {provider.haRegNo && <p className="mt-0.5 truncate">HA Reg: {provider.haRegNo}</p>}
                        {provider.poBox && <p className="mt-0.5 truncate">P.O. Box {provider.poBox}</p>}
                      </div>
                      <a href={`tel:${provider.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700 transition-colors hover:border-purple-400 hover:bg-purple-100 dark:border-[#29556e] dark:bg-[#102431] dark:text-[#7eddff] dark:hover:border-[#3cc9ff] dark:hover:bg-[#163243]" aria-label={`Call ${provider.name} at ${provider.phone}`}>
                        <Phone className="h-4 w-4" />{provider.phone}
                      </a>
                    </div>
                  </article>
                ))}
              </div>
              {remaining > 0 && <div className="flex justify-center py-6"><button type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)} className="btn-secondary text-sm">Show {formatCount(Math.min(PAGE_SIZE, remaining))} more</button></div>}
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-500 dark:border-[#28303a] dark:bg-[#171a20] dark:text-slate-400 sm:px-6">
          Confirm provider participation before visiting. Network details may change without notice.
        </footer>
      </section>
    </div>
  );
};

export default FmcNetworkModal;
