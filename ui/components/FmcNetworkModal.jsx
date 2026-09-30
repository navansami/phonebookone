import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import './FmcNetworkModal.css';

const PAGE_SIZE = 40;
const TYPES = ['Hospital', 'Government Hospital', 'Clinic', 'Dental Clinic', 'Pharmacy', 'Diagnostic Center', 'Day Care Center', 'Home Healthcare'];
const META = {
  Hospital: ['#FB7185', '#FFE1E6', '#B33A50', '🏥'],
  'Government Hospital': ['#FB7185', '#FFE1E6', '#B33A50', '🏥'],
  Clinic: ['#4F46E5', '#E4E2FB', '#3730A3', '🩺'],
  'Dental Clinic': ['#0D9488', '#CCFBF1', '#0b7268', '🦷'],
  Pharmacy: ['#F59E0B', '#FEF0D5', '#B5730A', '💊'],
  'Diagnostic Center': ['#3B82F6', '#DBEAFE', '#1D4ED8', '🔬'],
  'Day Care Center': ['#A855F7', '#F1E4FE', '#7E22CE', '🛏️'],
  'Home Healthcare': ['#F97316', '#FFE7D3', '#C2410C', '🏠'],
};
const FALLBACK_META = META.Clinic;
const formatCount = value => value.toLocaleString('en-US');
const titleCase = value => (value || '').toLowerCase().replace(/\b[a-z]/g, letter => letter.toUpperCase());

function ProviderCard({ provider }) {
  const [expanded, setExpanded] = useState(false);
  const [color, light, dark, icon] = META[provider.type] || FALLBACK_META;
  const name = titleCase(provider.name);
  const address = titleCase(provider.location);
  const phone = (provider.phone || '').replace(/[^0-9+]/g, '');
  const mapQuery = encodeURIComponent(`${name}, ${address || titleCase(provider.area)}, ${titleCase(provider.emirate)}`);
  const detailId = `fmc-provider-${provider.id}`;
  return <article className={`card${expanded ? ' open' : ''}`} style={{ '--provider-color': color }}>
    <button type="button" className="card-top" aria-expanded={expanded} aria-controls={detailId} onClick={() => setExpanded(open => !open)}>
      <span className="avatar" style={{ background: light, color: dark }} aria-hidden="true">{icon}</span>
      <span className="card-text"><span className="pname">{name}</span><span className="ploc">{[titleCase(provider.area), titleCase(provider.emirate)].filter(Boolean).join(', ')}</span><span className="type-tag" style={{ background: light, color: dark }}>{provider.type}</span></span>
      <span className="expand-icon" aria-hidden="true">⌄</span>
    </button>
    {expanded && <div id={detailId} className="card-detail">
      <div className="detail-row"><b>Address:</b> {address || '—'}</div>
      {provider.specialties && <div className="detail-row"><b>Services:</b> {titleCase(provider.specialties)}</div>}
      <div className="detail-row"><b>Contact:</b> {provider.phone || '—'}</div>
      <div className="actions">{phone ? <a className="call-btn" href={`tel:${phone}`}>📞 Call</a> : <span className="call-btn unavailable">📞 No number</span>}<a className="map-btn" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer">📍 Directions</a></div>
    </div>}
  </article>;
}

export default function FmcNetworkModal({ isOpen, onClose }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [query, setQuery] = useState('');
  const [emirate, setEmirate] = useState('DUBAI');
  const [type, setType] = useState('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: providers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['fmc-network'], queryFn: async () => (await api.get('/api/fmc-network')).data.providers,
    enabled: isOpen, staleTime: 30 * 60 * 1000,
  });
  useEffect(() => {
    if (!isOpen) return undefined;
    setQuery(''); setEmirate('DUBAI'); setType('All'); setVisibleCount(PAGE_SIZE);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEscape = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); onCloseRef.current();
    };
    document.addEventListener('keydown', onEscape, true);
    return () => { document.removeEventListener('keydown', onEscape, true); document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  const emirates = useMemo(() => [...new Set(providers.map(provider => provider.emirate).filter(Boolean))].sort((a, b) => a === 'DUBAI' ? -1 : b === 'DUBAI' ? 1 : a.localeCompare(b)), [providers]);
  const types = useMemo(() => [...new Set(providers.map(provider => provider.type).filter(Boolean))].sort((a, b) => (TYPES.indexOf(a) < 0 ? 999 : TYPES.indexOf(a)) - (TYPES.indexOf(b) < 0 ? 999 : TYPES.indexOf(b))), [providers]);
  const typeCounts = useMemo(() => providers.reduce((counts, provider) => { counts[provider.type] = (counts[provider.type] || 0) + 1; return counts; }, {}), [providers]);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return providers.filter(provider => (emirate === 'All' || provider.emirate === emirate) && (type === 'All' || provider.type === type) && (!search || [provider.name, provider.area, provider.location, provider.specialties, provider.phone].filter(Boolean).join(' ').toLowerCase().includes(search)));
  }, [providers, query, emirate, type]);
  const update = (setter, value) => { setter(value); setVisibleCount(PAGE_SIZE); };
  if (!isOpen) return null;

  return <div className="fmc-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="fmc-finder" role="dialog" aria-modal="true" aria-labelledby="fmc-network-title">
      <header>
        <button type="button" className="fmc-close" onClick={onClose} aria-label="Close FMC Network">×</button>
        <div className="top-row"><div className="brand"><span className="shield" aria-hidden="true">🛡️</span><p className="eyebrow">Fairmont The Palm · Employee Insurance</p></div></div>
        <h1 id="fmc-network-title">FMC Network <span>Finder</span></h1>
        <p className="sub">Search clinics, hospitals, pharmacies and diagnostic centres covered under your FMC insurance network across the UAE.</p>
        <div className="stats-row" aria-label="Network provider totals"><span className="stat-pill"><b>{formatCount(providers.length)}</b>Total Providers</span>{types.map(value => <span className="stat-pill" key={value}><b>{formatCount(typeCounts[value])}</b>{value}{typeCounts[value] !== 1 && !value.endsWith('s') ? 's' : ''}</span>)}</div>
      </header>
      <div className="controls">
        <div className="search-wrap"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.6" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input id="fmc-search" type="text" value={query} onChange={event => update(setQuery, event.target.value)} placeholder="Search by name or area…" autoComplete="off" aria-label="Search FMC providers by name or area" />{query && <button id="fmc-clear" type="button" onClick={() => update(setQuery, '')} aria-label="Clear search">✕</button>}</div>
        <p className="section-label">Emirate</p><div className="filter-scroll" aria-label="Filter by emirate">{['All', ...emirates].map(value => <button key={value} type="button" className={`chip${emirate === value ? ' active' : ''}`} aria-pressed={emirate === value} onClick={() => update(setEmirate, value)}>{value === 'All' ? value : titleCase(value)}</button>)}</div>
        <p className="section-label">Provider type</p><div className="type-scroll" aria-label="Filter by provider type">{['All', ...types].map(value => { const [color, light, dark, icon] = META[value] || FALLBACK_META; const active = type === value; return <button key={value} type="button" className={`tchip${active ? ' active' : ''}`} aria-pressed={active} style={active ? { background: value === 'All' ? 'linear-gradient(135deg, #4F46E5, #1E1B4B)' : color } : undefined} onClick={() => update(setType, value)}><span className="ticon" style={{ background: active ? 'rgba(255,255,255,0.25)' : value === 'All' ? '#EEECFB' : light, color: active ? '#fff' : dark }} aria-hidden="true">{value === 'All' ? '✨' : icon}</span>{value}</button>; })}</div>
      </div>
      <div className="results-meta" aria-live="polite"><span>{isLoading ? 'Loading…' : `${formatCount(filtered.length)} result${filtered.length === 1 ? '' : 's'}`}</span><span>{[emirate !== 'All' && titleCase(emirate), type !== 'All' && type].filter(Boolean).join(' · ')}</span></div>
      <div id="fmc-list">{isLoading ? <div className="empty-state"><div className="glyph">⌛</div><p><b>Loading providers…</b></p></div> : isError ? <div className="empty-state"><div className="glyph">⚠️</div><p><b>Could not load providers</b></p><p>Check your connection and try again.</p><button type="button" className="fmc-retry" onClick={() => refetch()}>Try again</button></div> : filtered.length === 0 ? <div className="empty-state"><div className="glyph">🔍</div><p><b>No providers found</b></p><p>Try a different spelling or clear filters.</p></div> : filtered.slice(0, visibleCount).map(provider => <ProviderCard key={provider.id} provider={provider} />)}</div>
      {filtered.length > visibleCount && <div id="fmc-load-more"><button type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>Show more results</button></div>}
      <footer>FMC Standard Network List · Sept 2025 edition<br />Always confirm provider participation before availing services.</footer>
    </section>
  </div>;
}
