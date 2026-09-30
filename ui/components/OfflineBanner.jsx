import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] animate-fadeIn"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 shadow-lg dark:border-amber-700/60 dark:bg-[#2a2416] dark:text-amber-300">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>You&apos;re offline &mdash; showing saved data</span>
      </div>
    </div>
  );
};

export default OfflineBanner;
