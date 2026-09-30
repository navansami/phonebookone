const TagCloud = ({ tags, selectedTag, onSelectTag }) => {
  if (!tags || tags.length === 0) return null;

  const handleTagClick = (tag) => {
    // Toggle: if clicking the same tag, clear selection
    if (selectedTag === tag) {
      onSelectTag(null);
    } else {
      onSelectTag(tag);
    }
  };

  return (
    <div className="w-full">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filter by Tag</h3>
          {selectedTag && (
            <button
              onClick={() => onSelectTag(null)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isActive = selectedTag === tag;

            return (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-sm'
                  }
                `}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TagCloud;
