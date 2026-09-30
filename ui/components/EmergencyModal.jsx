import { useEffect } from 'react';
import { X, Phone, Ambulance, Shield, Waves, Zap, Droplet } from 'lucide-react';

const emergencyServices = [
  { name: 'Police', number: '999', icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { name: 'Ambulance', number: '998', icon: Ambulance, color: 'text-red-600', bgColor: 'bg-red-50' },
  { name: 'Civil Defence', number: '997', icon: Shield, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { name: 'Coast Guard', number: '996', icon: Waves, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { name: 'Electricity', number: '991', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { name: 'Water', number: '992', icon: Droplet, color: 'text-blue-500', bgColor: 'bg-blue-50' }
];

const EmergencyModal = ({ isOpen, onClose }) => {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Emergency Numbers</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-600 dark:text-gray-300 mb-6">UAE Emergency Contact Numbers</p>
          <div className="space-y-4">
            {emergencyServices.map((service) => {
              const Icon = service.icon;
              return (
                <a
                  key={service.number}
                  href={`tel:${service.number}`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-yellow-500 dark:hover:border-yellow-500 hover:shadow-md transition-all group"
                >
                  <div className={`p-3 rounded-full ${service.bgColor}`}>
                    <Icon className={`w-6 h-6 ${service.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{service.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Tap to call</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{service.number}</span>
                    <Phone className="w-5 h-5 text-yellow-600 group-hover:text-yellow-700" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-100 dark:border-yellow-800/40">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <span className="font-semibold">Note:</span> These numbers are for emergency situations only.
            Please use them responsibly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
