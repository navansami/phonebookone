import { useState, useEffect, useRef } from 'react';
import { Shield, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const AccessCodeModal = ({ isOpen, onVerified }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (sessionStorage.getItem('hotel_access_verified') !== 'true') return;
    if (!navigator.onLine) { onVerified(); return; }
    fetch('/api/access/me').then(response => {
      if (response.ok) onVerified();
      else sessionStorage.removeItem('hotel_access_verified');
    }).catch(() => sessionStorage.removeItem('hotel_access_verified'));
  }, [onVerified]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/access/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      if (!response.ok) throw new Error('Invalid hotel code');
      // Store verification in sessionStorage (valid for browser session)
      sessionStorage.setItem('hotel_access_verified', 'true');
      setError('');

      // Only show toast once for manual entry
      if (!hasShownToast) {
        toast.success('Access granted! Welcome to the phonebook.', {
          duration: 3000,
          id: 'access-granted', // Prevent duplicate toasts
        });
        setHasShownToast(true);
      }

      onVerified();
    } catch {
      setError('Invalid hotel code. Please try again.');
      setCode('');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    setCode(value);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-violet-900/95 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Hotel Staff Access
          </h2>
          <p className="text-indigo-100 text-sm">
            Enter the Accor Hotel Code to access the phonebook
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hotel Code Hint */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-1">
                    Hotel Code Format
                  </p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    H-****
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                    Please contact your supervisor if you don't have the code
                  </p>
                </div>
              </div>
            </div>

            {/* Input Field */}
            <div>
              <label htmlFor="hotel-code" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Enter Hotel Code
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="hotel-code"
                  type={showCode ? 'text' : 'password'}
                  value={code}
                  onChange={handleChange}
                  placeholder="H-****"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg font-mono uppercase ${
                    error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  maxLength={6}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showCode ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-2 flex items-start gap-2 text-red-600 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={code.length < 4}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              Access Phonebook
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs">
                This phonebook is for authorized hotel staff only. Your access will remain active during this browser session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessCodeModal;
