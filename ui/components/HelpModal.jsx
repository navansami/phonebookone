import { useEffect } from 'react';
import { X, Search, Star, Filter, Keyboard, Info, Heart, Zap } from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-6 h-6 text-accent dark:text-[#23b7f2]" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              Help & Instructions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-6 space-y-6">
          {/* Keyboard Shortcuts */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Keyboard className="w-5 h-5 text-accent dark:text-[#23b7f2]" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Keyboard Shortcuts
              </h3>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Focus Search</span>
                <kbd className="px-3 py-1.5 text-sm font-semibold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                  Tab
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Close Modal</span>
                <kbd className="px-3 py-1.5 text-sm font-semibold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                  Esc
                </kbd>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-accent dark:text-[#23b7f2]" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Features
              </h3>
            </div>
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-full bg-accent/10 dark:bg-[#23b7f2]/10">
                    <Search className="w-5 h-5 text-accent dark:text-[#23b7f2]" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    Smart Search
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Search contacts by name, designation, department, or extension.
                    Press Tab to quickly focus the search bar from anywhere.
                  </p>
                </div>
              </div>

              {/* Favorites */}
              <div className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-full bg-accent/10 dark:bg-[#23b7f2]/10">
                    <Star className="w-5 h-5 text-accent dark:text-[#23b7f2]" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    Favorites
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click the star icon on any contact card to add them to your favorites.
                    Access your favorites quickly from the sidebar filter.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-full bg-accent/10 dark:bg-[#23b7f2]/10">
                    <Filter className="w-5 h-5 text-accent dark:text-[#23b7f2]" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    Advanced Filters
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Filter contacts by department or view only Emergency Response Team (ERT) members.
                    Combine filters with search for precise results.
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-full bg-accent/10 dark:bg-[#23b7f2]/10">
                    <Heart className="w-5 h-5 text-accent dark:text-[#23b7f2]" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                    Quick Actions
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hover over contact cards to reveal quick action buttons for email,
                    Teams chat, and phone calls. Click anywhere on the card to view full details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-accent/10 dark:bg-[#23b7f2]/10 border border-accent/20 dark:border-[#23b7f2]/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              Pro Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                <span>Your favorites are saved locally and persist across sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                <span>Use the theme toggle to switch between light and dark modes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                <span>ERT members are marked with a red badge for quick identification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                <span>Contact the admin to update or add new contacts to the directory</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
