import { Search, X, ArrowUpRight } from 'lucide-react';

const SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: 'All Fields' },
  { value: 'name', label: 'Name' },
  { value: 'extension', label: 'Extension' },
  { value: 'department', label: 'Department' },
  { value: 'company', label: 'Company' },
];

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  searchScope,
  setSearchScope,
  suggestions = [],
  onSearch,
  onClear,
  onSelectSuggestion,
}) => {
  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    if (onClear) {
      onClear();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="md:hidden w-full px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="space-y-2">
        <div className="ml-12 flex flex-wrap gap-2">
          {SEARCH_SCOPE_OPTIONS.map((option) => {
            const isActive = searchScope === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSearchScope(option.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white dark:bg-[#23b7f2] dark:text-[#051018]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#1b2430] dark:text-gray-300 dark:hover:bg-[#24303c]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              searchScope === 'all'
                ? 'Search contacts, extensions, departments...'
                : `Search by ${searchScope}...`
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-amber-500 dark:bg-amber-600 text-white rounded-lg hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors font-medium"
        >
          Search
        </button>

        {/* Clear button - only show if there's a search query */}
        {searchQuery && (
          <button
            onClick={handleClear}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Clear search"
          >
            <X size={20} />
          </button>
        )}
      </div>

        {searchQuery && suggestions.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#171d24]">
            {suggestions.map((suggestion) => (
              <button
                key={`${suggestion.id}-${suggestion.label}`}
                onClick={() => onSelectSuggestion?.(suggestion)}
                className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-[#1f252d]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{suggestion.name}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {suggestion.label}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
