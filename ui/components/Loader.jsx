import { Loader2 } from 'lucide-react';

const Loader = ({ text = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg">
      <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
      {text && (
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;
