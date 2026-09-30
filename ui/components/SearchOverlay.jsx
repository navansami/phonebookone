import { useEffect } from 'react';
import { ArrowUpRight, Search, X } from 'lucide-react';

const SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: 'All Fields' },
  { value: 'name', label: 'Name' },
  { value: 'extension', label: 'Extension' },
  { value: 'department', label: 'Department' },
  { value: 'company', label: 'Company' },
];

const SearchOverlay = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  searchScope,
  setSearchScope,
  suggestions = [],
  onSelectSuggestion,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        // Keep search active, just close overlay
        onClose();
      } else if (e.key === 'Escape') {
        // Clear search and close
        setSearchQuery('');
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, setSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 hidden md:flex items-start justify-center overflow-y-auto">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Ghost watermark in background */}
      {searchQuery && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="text-[20rem] font-bold text-white/5 select-none whitespace-nowrap">
            {searchQuery}
          </div>
        </div>
      )}

      {/* Search input container */}
      <div className="relative z-10 w-full max-w-4xl px-8 pb-16 pt-24">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/60 backdrop-blur-md">
            <Search className="h-3.5 w-3.5" />
            Search Scope
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-md">
              {SEARCH_SCOPE_OPTIONS.map((option) => {
                const isActive = searchScope === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSearchScope(option.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-white/70 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchScope === 'all'
                  ? 'Search contacts, extensions, departments...'
                  : `Search by ${searchScope}...`
              }
              autoFocus
              className="w-full rounded-[1.75rem] border border-gray-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] px-8 py-5 pr-24 text-4xl font-light text-gray-900 shadow-[0_30px_80px_rgba(0,0,0,0.20)] backdrop-blur-xl placeholder:text-gray-400 focus:border-[#23b7f2] focus:outline-none dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.88))] dark:text-black dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)] dark:placeholder:text-gray-500"
            />

            <button
              onClick={onClose}
              className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={28} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-white/55">
            <p>
              Press <kbd className="rounded-md bg-white/10 px-2 py-1 text-white/80">Enter</kbd> to search
            </p>
            <p>
              Press <kbd className="rounded-md bg-white/10 px-2 py-1 text-white/80">Esc</kbd> to clear and close
            </p>
          </div>

          <div className="mt-6 min-h-[22rem]">
            {searchQuery && suggestions.length > 0 ? (
              <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                <div className="max-h-[26rem] overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.id}-${suggestion.label}`}
                      onClick={() => onSelectSuggestion?.(suggestion)}
                      className="flex w-full items-center justify-between gap-4 border-b border-white/10 px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-white/8"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-white">{suggestion.name}</p>
                        <p className="truncate text-sm text-white/60">{suggestion.label}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-white/60" />
                    </button>
                  ))}
                </div>
              </div>
            ) : searchQuery ? (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 px-6 py-8 text-center text-white/55 backdrop-blur-xl">
                No quick matches found. Press Enter to keep the current search active.
              </div>
            ) : (
              <div className="px-2 py-6 text-center text-white/35">
                Start typing to search by {searchScope === 'all' ? 'any field' : searchScope}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
