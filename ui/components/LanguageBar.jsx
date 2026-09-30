const LanguageBar = ({ languages, selectedLanguage, onSelectLanguage }) => {
  if (!languages || languages.length === 0) return null;

  const handleLanguageClick = (language) => {
    // Toggle: if clicking the same language, clear selection
    if (selectedLanguage === language) {
      onSelectLanguage(null);
    } else {
      onSelectLanguage(language);
    }
  };

  return (
    <div className="w-full">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filter by Language</h3>
          {selectedLanguage && (
            <button
              onClick={() => onSelectLanguage(null)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {languages.map((language) => {
            const isActive = selectedLanguage === language;

            return (
              <button
                key={language}
                onClick={() => handleLanguageClick(language)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-sm'
                  }
                `}
              >
                {language}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LanguageBar;
