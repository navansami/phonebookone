import { useEffect } from 'react';
import { X, Phone, Printer, MapPin, Globe, Mail, ExternalLink } from 'lucide-react';

const hotelInfo = {
  name: 'Fairmont The Palm',
  tel: '+971 4 457 3388',
  fax: '+971 4 457 3399',
  poBox: 'P.O. Box 72413, Palm Jumeirah, Dubai, UAE',
  website: 'https://www.fairmont.com/palm-dubai/',
  email: 'palmdubai@fairmont.com',
  mapsUrl: 'https://maps.google.com/?q=Fairmont+The+Palm+Dubai'
};

const LocationModal = ({ isOpen, onClose }) => {
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Hotel Contact Information</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Telephone */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-50 rounded-full">
              <Phone className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">Telephone</p>
              <a
                href={`tel:${hotelInfo.tel.replace(/\s/g, '')}`}
                className="text-lg text-yellow-600 hover:text-yellow-700 hover:underline font-medium"
              >
                {hotelInfo.tel}
              </a>
            </div>
          </div>

          {/* Fax */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full">
              <Printer className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">Fax</p>
              <p className="text-lg text-gray-800 dark:text-white font-medium">{hotelInfo.fax}</p>
            </div>
          </div>

          {/* PO Box */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full">
              <MapPin className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">Postal Address</p>
              <p className="text-lg text-gray-800 dark:text-white font-medium">{hotelInfo.poBox}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-50 rounded-full">
              <Mail className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
              <a
                href={`mailto:${hotelInfo.email}`}
                className="text-lg text-yellow-600 hover:text-yellow-700 hover:underline font-medium break-all"
              >
                {hotelInfo.email}
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

          {/* Website */}
          <a
            href={hotelInfo.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-yellow-500 dark:hover:border-yellow-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-full">
                <Globe className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Website</p>
                <p className="text-lg text-yellow-600 group-hover:text-yellow-700 font-medium">
                  Visit Our Website
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-yellow-600" />
          </a>

          {/* Google Maps */}
          <a
            href={hotelInfo.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-yellow-500 dark:hover:border-yellow-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-full">
                <MapPin className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-lg text-yellow-600 group-hover:text-yellow-700 font-medium">
                  View on Google Maps
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-yellow-600" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
