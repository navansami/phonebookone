import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Building2, ChevronDown, ChevronLeft, ChevronRight, Copy, Hospital, MapPin, Network, Phone, Pill, RotateCcw, Search, SlidersHorizontal, Stethoscope, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PAGE_SIZE = 24;
const EMPTY_PROVIDERS = [];
const EMIRATES = [
  ['ABU DHABI', 'Abu Dhabi'], ['AJMAN', 'Ajman'], ['DUBAI', 'Dubai'], ['FUJAIRAH', 'Fujairah'],
  ['RAS AL KHAIMAH', 'Ras Al Khaimah'], ['SHARJAH', 'Sharjah'], ['UMM AL QUWAIN', 'Umm Al Quwain'],
];
const TYPES = ['Hospital', 'Government Hospital', 'Day Care Center', 'Clinic', 'Dental Clinic', 'Diagnostic Center', 'Home Healthcare', 'Pharmacy'];
const TYPE_ICONS = {
  Hospital, 'Government Hospital': Hospital, 'Day Care Center': Activity, Clinic: Stethoscope,
  'Dental Clinic': Stethoscope, 'Diagnostic Center': Activity, 'Home Healthcare': Building2, Pharmacy: Pill,
};
const formatCount = number => number.toLocaleString('en-US');

function matchesSearch(provider, query) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  const details = [provider.name, provider.location, provider.area, provider.emirate, provider.type, provider.specialties, provider.haRegNo, provider.poBox]
    .filter(Boolean).join(' ').toLowerCase();
  const phoneSearch = text.replace(/[^0-9+]/g, '');
  return details.includes(text) || (phoneSearch.length >= 3 && provider.phone.replace(/[^0-9+]/g, '').includes(phoneSearch));
}

function FilterChip({ label, count, selected, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${selected
        ? 'border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-200 dark:from-[#23b7f2] dark:to-[#139fe3] dark:text-[#051018] dark:shadow-none'
        : 'border-purple-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm dark:border-[#29556e] dark:bg-[#171d24] dark:text-slate-200 dark:hover:border-[#3cc9ff] dark:hover:bg-[#183040]'}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span>{label}</span>
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${selected ? 'bg-white/20 dark:bg-[#051018]/15' : 'bg-purple-50 text-purple-700 dark:bg-[#102431] dark:text-[#69d6ff]'}`}>{formatCount(count)}</span>
    </button>
  );
}

function ProviderCard({ provider, expanded, onToggle, onCopy }) {
  const Icon = TYPE_ICONS[provider.type] || Network;
  const phoneHref = `tel:${provider.phone.replace(/[^0-9+]/g, '')}`;
  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-200/50 dark:bg-[#171d24] dark:hover:shadow-[0_16px_32px_rgba(0,0,0,0.35)] motion-reduce:transform-none motion-reduce:transition-none ${expanded
      ? 'border-purple-500 shadow-lg shadow-purple-100/70 dark:border-[#53d1ff] dark:shadow-[0_12px_28px_rgba(0,0,0,0.3)]'
      : 'border-purple-200/70 hover:border-purple-400 dark:border-[#24465c] dark:hover:border-[#3cc9ff]'}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 transition-opacity dark:from-[#23b7f2] dark:via-[#53d1ff] dark:to-[#139fe3] ${expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
      <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={`fmc-details-${provider.id}`} className="w-full flex-1 px-4 pb-3 pt-5 text-left sm:px-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100 dark:bg-[#102431] dark:text-[#69d6ff] dark:group-hover:bg-[#163243]">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="badge badge-primary max-w-full truncate">{provider.type}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{provider.emirate}</span>
            </div>
            <h3 className="mt-2 text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-purple-700 dark:text-white dark:group-hover:text-[#a4eaff]">{provider.name}</h3>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-gray-600 dark:text-slate-300">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-500 dark:text-[#69d6ff]" />
          <span className="line-clamp-2">{provider.location}</span>
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-[#69d6ff]">
          {expanded ? 'Hide details' : 'View details'}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <div id={`fmc-details-${provider.id}`} aria-hidden={!expanded} className={`grid transition-all duration-300 motion-reduce:transition-none ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="mx-4 space-y-2 rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-xs text-gray-600 dark:border-[#29556e] dark:bg-[#102431] dark:text-slate-300 sm:mx-5">
            <p><span className="font-semibold text-gray-800 dark:text-white">Full address:</span> {provider.location}</p>
            {provider.specialties && <p><span className="font-semibold text-gray-800 dark:text-white">Specialties:</span> {provider.specialties}</p>}
            {provider.haRegNo && <p><span className="font-semibold text-gray-800 dark:text-white">HA Reg:</span> {provider.haRegNo}</p>}
            {provider.poBox && <p><span className="font-semibold text-gray-800 dark:text-white">P.O. Box:</span> {provider.poBox}</p>}
          </div>
        </div>
      </div>

      <div className="mx-4 mt-3 flex items-center justify-between gap-2 border-t border-purple-100 py-3 dark:border-[#28303a] sm:mx-5">
        <span className="min-w-0 truncate text-xs font-medium text-gray-600 dark:text-slate-300">{provider.area}</span>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onCopy} className="rounded-xl border border-purple-200 p-2 text-purple-600 transition-all hover:-translate-y-0.5 hover:bg-purple-50 active:scale-95 dark:border-[#29556e] dark:text-[#7eddff] dark:hover:bg-[#163243]" aria-label={`Copy phone number for ${provider.name}`} title="Copy phone number"><Copy className="h-4 w-4" /></button>
          <a href={phoneHref} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:from-[#23b7f2] dark:to-[#139fe3] dark:text-[#051018]" aria-label={`Call ${provider.name} at ${provider.phone}`}>
            <Phone className="h-4 w-4" />{provider.phone}
          </a>
        </div>
      </div>
    </article>
  );
}

const FmcNetworkModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [emirate, setEmirate] = useState('');
  const [area, setArea] = useState('');
  const [type, setType] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [areaQuery, setAreaQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const areaPickerRef = useRef(null);
  const emirateScrollRef = useRef(null);
  const typeScrollRef = useRef(null);
  const { data: providers = EMPTY_PROVIDERS, isLoading, isError, refetch } = useQuery({
    queryKey: ['fmc-network'],
    queryFn: async () => (await api.get('/api/fmc-network')).data.providers,
    enabled: isOpen,
    staleTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const onEscape = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (areaOpen) setAreaOpen(false);
      else onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onEscape, true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose, areaOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(''); setEmirate(''); setArea(''); setType('');
    setFiltersOpen(false); setAreaOpen(false); setAreaQuery('');
    setExpandedId(null); setVisibleCount(PAGE_SIZE);
  }, [isOpen]);

  useEffect(() => {
    if (!areaOpen) return undefined;
    const closeOutside = event => { if (!areaPickerRef.current?.contains(event.target)) setAreaOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [areaOpen]);

  const searchedProviders = useMemo(() => providers.filter(provider => matchesSearch(provider, query)), [providers, query]);
  const emirateCounts = useMemo(() => searchedProviders.reduce((counts, provider) => {
    if (!type || provider.type === type) counts[provider.emirate] = (counts[provider.emirate] || 0) + 1;
    return counts;
  }, {}), [searchedProviders, type]);
  const typeCounts = useMemo(() => searchedProviders.reduce((counts, provider) => {
    if ((!emirate || provider.emirate === emirate) && (!area || provider.area === area)) counts[provider.type] = (counts[provider.type] || 0) + 1;
    return counts;
  }, {}), [searchedProviders, emirate, area]);
  const areaCounts = useMemo(() => searchedProviders.reduce((counts, provider) => {
    if (provider.emirate === emirate && (!type || provider.type === type) && provider.area) counts[provider.area] = (counts[provider.area] || 0) + 1;
    return counts;
  }, {}), [searchedProviders, emirate, type]);
  const areaOptions = useMemo(() => Object.entries(areaCounts).filter(([name]) => name.toLowerCase().includes(areaQuery.trim().toLowerCase())).sort(([left], [right]) => left.localeCompare(right)).slice(0, 60), [areaCounts, areaQuery]);
  const filteredProviders = useMemo(() => searchedProviders.filter(provider =>
    (!emirate || provider.emirate === emirate) && (!area || provider.area === area) && (!type || provider.type === type)
  ), [searchedProviders, emirate, area, type]);

  const hasFilters = Boolean(query.trim() || emirate || area || type);
  const locationFilterCount = Number(Boolean(emirate)) + Number(Boolean(area)) + Number(Boolean(type));
  const visibleProviders = filteredProviders.slice(0, visibleCount);
  const remaining = filteredProviders.length - visibleProviders.length;

  const updateFilter = (setter, value) => { setter(value); setVisibleCount(PAGE_SIZE); setExpandedId(null); };
  const selectEmirate = value => { updateFilter(setEmirate, value === emirate ? '' : value); setArea(''); setAreaOpen(false); setAreaQuery(''); };
  const selectType = value => updateFilter(setType, value === type ? '' : value);
  const selectArea = value => { updateFilter(setArea, value); setAreaOpen(false); setAreaQuery(''); };
  const resetFilters = () => {
    setQuery(''); setEmirate(''); setArea(''); setType('');
    setFiltersOpen(false); setAreaOpen(false); setAreaQuery('');
    setExpandedId(null); setVisibleCount(PAGE_SIZE);
  };
  const copyPhone = async phone => {
    try { await navigator.clipboard.writeText(phone); toast.success('Phone number copied'); }
    catch { toast.error('Could not copy phone number'); }
  };
  const scrollChips = (ref, direction) => ref.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4 lg:p-8" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="fmc-network-title" className="flex h-full max-h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-[#171a20] sm:h-auto sm:max-h-[min(88vh,850px)] sm:max-w-5xl sm:rounded-2xl sm:border sm:border-purple-200/70 dark:sm:border-[#24465c]">
        <header className="flex shrink-0 items-center gap-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 via-white to-white px-4 py-4 dark:border-[#24465c] dark:from-[#162332] dark:via-[#171a20] dark:to-[#171a20] sm:px-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-sm dark:from-[#23b7f2] dark:to-[#1296e2]"><Network className="h-5 w-5 text-white dark:text-[#051018]" /></span>
          <div className="min-w-0 flex-1"><h2 id="fmc-network-title" className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">FMC Network</h2><p className="text-xs text-gray-500 dark:text-slate-400">{isLoading ? 'Loading providers…' : `${formatCount(providers.length)} medical providers across the UAE`}</p></div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 transition-colors hover:bg-purple-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-[#24303c] dark:hover:text-white" aria-label="Close FMC Network"><X className="h-5 w-5" /></button>
        </header>

        <div className="shrink-0 space-y-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-[#28303a] dark:bg-[#171a20] sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-500 dark:text-[#69d6ff]" />
            <input type="search" value={query} onChange={event => updateFilter(setQuery, event.target.value)} placeholder="Search providers or locations" aria-label="Search provider, specialty, location or phone" className="input w-full pl-11 pr-10 text-sm" />
            {query && <button type="button" onClick={() => updateFilter(setQuery, '')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#24303c] dark:hover:text-white" aria-label="Clear search"><X className="h-4 w-4" /></button>}
          </div>
          <button type="button" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} aria-controls="fmc-filters" className="btn-secondary flex w-full items-center justify-between px-3 py-2 text-sm sm:hidden">
            <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Filters{locationFilterCount > 0 && <span className="badge badge-primary px-2 py-0.5">{locationFilterCount}</span>}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          <div id="fmc-filters" className={`${filtersOpen ? 'block' : 'hidden'} max-h-[45vh] space-y-3 overflow-y-auto sm:block sm:max-h-none sm:overflow-visible`}>
            <div>
              <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Emirate</p><div className="flex items-center gap-1">{emirate && <button type="button" onClick={() => selectEmirate('')} className="mr-2 text-xs font-semibold text-purple-700 hover:underline dark:text-[#69d6ff]">Clear</button>}<button type="button" onClick={() => scrollChips(emirateScrollRef, -1)} className="rounded-lg p-1 text-gray-500 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-400 dark:hover:bg-[#183040] dark:hover:text-[#69d6ff]" aria-label="Scroll emirates left"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => scrollChips(emirateScrollRef, 1)} className="rounded-lg p-1 text-gray-500 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-400 dark:hover:bg-[#183040] dark:hover:text-[#69d6ff]" aria-label="Scroll emirates right"><ChevronRight className="h-4 w-4" /></button></div></div>
              <div ref={emirateScrollRef} className="flex gap-2 overflow-x-auto pb-1">
                <FilterChip label="All" count={searchedProviders.filter(provider => !type || provider.type === type).length} selected={!emirate} onClick={() => selectEmirate('')} />
                {EMIRATES.map(([value, label]) => <FilterChip key={value} label={label} count={emirateCounts[value] || 0} selected={emirate === value} onClick={() => selectEmirate(value)} />)}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Provider type</p><div className="flex items-center gap-1">{type && <button type="button" onClick={() => selectType('')} className="mr-2 text-xs font-semibold text-purple-700 hover:underline dark:text-[#69d6ff]">Clear</button>}<button type="button" onClick={() => scrollChips(typeScrollRef, -1)} className="rounded-lg p-1 text-gray-500 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-400 dark:hover:bg-[#183040] dark:hover:text-[#69d6ff]" aria-label="Scroll provider types left"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => scrollChips(typeScrollRef, 1)} className="rounded-lg p-1 text-gray-500 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-400 dark:hover:bg-[#183040] dark:hover:text-[#69d6ff]" aria-label="Scroll provider types right"><ChevronRight className="h-4 w-4" /></button></div></div>
              <div ref={typeScrollRef} className="flex gap-2 overflow-x-auto pb-1">
                <FilterChip label="All types" count={searchedProviders.filter(provider => (!emirate || provider.emirate === emirate) && (!area || provider.area === area)).length} selected={!type} onClick={() => selectType('')} />
                {TYPES.map(value => <FilterChip key={value} label={value} count={typeCounts[value] || 0} selected={type === value} onClick={() => selectType(value)} icon={TYPE_ICONS[value]} />)}
              </div>
            </div>
            <div ref={areaPickerRef}>
              <button type="button" disabled={!emirate} onClick={() => setAreaOpen(open => !open)} aria-expanded={areaOpen} aria-controls="fmc-area-options" className="flex w-full items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50/50 px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:border-purple-400 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#29556e] dark:bg-[#102431] dark:text-slate-200 dark:hover:border-[#3cc9ff] dark:hover:bg-[#163243] sm:max-w-sm">
                <span className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-purple-500 dark:text-[#69d6ff]" /><span className="truncate">{area || (emirate ? 'All areas · choose an area' : 'Choose an emirate to browse areas')}</span></span><ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${areaOpen ? 'rotate-180' : ''}`} />
              </button>
              {areaOpen && <div id="fmc-area-options" className="mt-2 max-w-sm rounded-xl border border-purple-200 bg-white p-2 shadow-lg dark:border-[#29556e] dark:bg-[#171d24]">
                <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input autoFocus type="search" value={areaQuery} onChange={event => setAreaQuery(event.target.value)} placeholder="Find an area" aria-label="Find an area" className="input w-full py-2 pl-8 text-sm" /></div>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  <button type="button" onClick={() => selectArea('')} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-purple-50 dark:text-slate-200 dark:hover:bg-[#183040]">All areas<span className="text-xs text-gray-500 dark:text-slate-400">{formatCount(Object.values(areaCounts).reduce((sum, count) => sum + count, 0))}</span></button>
                  {areaOptions.map(([name, count]) => <button type="button" key={name} onClick={() => selectArea(name)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-purple-50 dark:hover:bg-[#183040] ${area === name ? 'font-semibold text-purple-700 dark:text-[#69d6ff]' : 'text-gray-700 dark:text-slate-200'}`}><span className="truncate">{name}</span><span className="shrink-0 text-xs text-gray-500 dark:text-slate-400">{formatCount(count)}</span></button>)}
                  {areaOptions.length === 0 && <p className="px-3 py-2 text-sm text-gray-500 dark:text-slate-400">No matching areas</p>}
                </div>
                {!areaQuery && Object.keys(areaCounts).length > 60 && <p className="px-3 pt-2 text-xs text-gray-500 dark:text-slate-400">Search to see more areas</p>}
              </div>}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/70 px-4 py-4 dark:bg-[#10151b] sm:px-6 sm:py-5">
          {!isLoading && !isError && <div className="mb-4 flex min-h-8 items-center justify-between gap-3" aria-live="polite"><p className="text-sm text-gray-600 dark:text-slate-300"><span className="font-semibold text-gray-900 dark:text-white">{formatCount(filteredProviders.length)}</span> {filteredProviders.length === 1 ? 'provider' : 'providers'}{hasFilters && <span className="text-gray-400 dark:text-slate-500"> of {formatCount(providers.length)}</span>}</p>{hasFilters && <button type="button" onClick={resetFilters} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:underline dark:text-[#69d6ff]"><RotateCcw className="h-3.5 w-3.5" />Clear filters</button>}</div>}
          {isLoading ? <div className="grid gap-3 sm:grid-cols-2" aria-label="Loading FMC providers">{[1, 2, 3, 4].map(number => <div key={number} className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-[#24465c] dark:bg-[#171d24]" />)}</div>
            : isError ? <div className="card mx-auto max-w-md p-8 text-center"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Could not load providers</h3><p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Check your connection and try again.</p><button type="button" onClick={() => refetch()} className="btn-primary mt-5 text-sm">Try again</button></div>
              : filteredProviders.length === 0 ? <div className="card mx-auto max-w-md p-8 text-center"><Search className="mx-auto h-8 w-8 text-purple-400 dark:text-[#69d6ff]" /><h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">No providers found</h3><p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Try another search or remove a filter.</p>{hasFilters && <button type="button" onClick={resetFilters} className="btn-secondary mt-5 text-sm">Clear filters</button>}</div>
                : <><div className="grid gap-3 sm:grid-cols-2">{visibleProviders.map(provider => <ProviderCard key={provider.id} provider={provider} expanded={expandedId === provider.id} onToggle={() => setExpandedId(current => current === provider.id ? null : provider.id)} onCopy={() => copyPhone(provider.phone)} />)}</div>{remaining > 0 && <div className="flex justify-center py-6"><button type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)} className="btn-secondary text-sm">Show {formatCount(Math.min(PAGE_SIZE, remaining))} more</button></div>}</>}
        </div>
        <footer className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-500 dark:border-[#28303a] dark:bg-[#171a20] dark:text-slate-400 sm:px-6">Confirm provider participation before visiting. Network details may change without notice.</footer>
      </section>
    </div>
  );
};

export default FmcNetworkModal;
