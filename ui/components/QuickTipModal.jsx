import { useEffect } from 'react';
import { X, Search } from 'lucide-react';

const QuickTipModal = ({ isOpen, onClose }) => {
  // Add custom styles for animations
  const pulseAnimation = `
    @keyframes pulse-ring {
      0% {
        transform: scale(0.8);
        opacity: 1;
      }
      100% {
        transform: scale(1.4);
        opacity: 0;
      }
    }
    @keyframes bounce-gentle {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }
    .pulse-ring {
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    .pulse-ring-delay-1 {
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      animation-delay: 0.5s;
    }
    .pulse-ring-delay-2 {
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      animation-delay: 1s;
    }
    .bounce-gentle {
      animation: bounce-gentle 2s ease-in-out infinite;
    }
  `;

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
    <>
      <style>{pulseAnimation}</style>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-violet-600 rounded-3xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Search Icon with Pulse Animation */}
          <div className="flex items-center justify-center mb-4 relative">
            {/* Pulse rings */}
            <div className="absolute w-20 h-20 rounded-full bg-purple-300/40 pulse-ring"></div>
            <div className="absolute w-20 h-20 rounded-full bg-purple-300/40 pulse-ring-delay-1"></div>
            <div className="absolute w-20 h-20 rounded-full bg-purple-300/40 pulse-ring-delay-2"></div>

            {/* Main icon container */}
            <div className="relative w-20 h-20 rounded-full bg-purple-400/30 backdrop-blur-sm flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-purple-300/40 backdrop-blur-sm flex items-center justify-center">
                <Search className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white mb-4">
            Quick Tip!
          </h2>

          {/* Message */}
          <p className="text-lg text-white/95 font-medium mb-6 leading-relaxed">
            Press the <span className="font-bold">TAB</span> key anytime to quickly<br />
            search for contacts
          </p>

          {/* Visual Demonstration */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* TAB Key with Bounce Animation */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 shadow-lg bounce-gentle">
              <span className="text-2xl font-bold text-purple-600">TAB</span>
            </div>

            {/* Arrow */}
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>

            {/* Search Box */}
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border-2 border-purple-400/50 flex items-center gap-2 min-w-[140px]">
              <Search className="w-4 h-4 text-white/70" />
              <span className="text-white/70 font-medium text-sm">Search...</span>
            </div>
          </div>

          {/* Footer instruction */}
          <p className="text-white/80 text-xs font-medium">
            Click anywhere or press <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/20 text-white font-semibold text-xs mx-1">ESC</span> to continue
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default QuickTipModal;
