import { MessageCircle } from 'lucide-react';

const WhatsAppButton = ({ contacts }) => {
  // Only show if there are ERT contacts
  if (!contacts || contacts.length === 0) {
    return null;
  }

  const handleWhatsAppClick = () => {
    // Get all phone numbers from ERT contacts
    const phoneNumbers = contacts
      .filter(contact => contact.phone_mobile)
      .map(contact => contact.phone_mobile)
      .join(',');

    // Create emergency message
    const message = encodeURIComponent(
      'Emergency Alert: This is an urgent notification for all ERT members. Please respond immediately.'
    );

    // WhatsApp multi-contact is not directly supported, so we'll use the web API with just the message
    // Users will need to select contacts manually, but the message will be pre-filled
    const whatsappUrl = `https://wa.me/?text=${message}`;

    // Open WhatsApp in new window
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-accent hover:bg-accent-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
      aria-label="Send WhatsApp to ERT"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline font-semibold">Alert ERT via WhatsApp</span>
      <span className="sm:hidden font-semibold">WhatsApp</span>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
    </button>
  );
};

export default WhatsAppButton;
