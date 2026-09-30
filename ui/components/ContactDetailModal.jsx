import { useEffect, useState } from 'react';
import {
  X,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MessageSquare,
  Star,
  Tag,
  Shield,
  Edit2,
  Globe,
  User,
  MapPin,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const InputField = ({ icon: Icon, label, value }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-purple-700 dark:text-[#69d6ff]">
      <Icon className="h-4 w-4" />
      {label}
    </label>
    <div className="rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3 dark:border-[#29556e] dark:bg-[#102431]">
      <p className="break-words font-medium text-gray-900 dark:text-gray-100">{value || '-'}</p>
    </div>
  </div>
);

const SectionCard = ({ title, description, children, icon: Icon }) => (
  <section className="rounded-2xl border border-purple-200/80 bg-white/90 p-5 shadow-sm shadow-purple-100/40 dark:border-[#24465c] dark:bg-[#141b23] dark:shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
    <div className="mb-4 flex items-start gap-3 border-b border-purple-100 pb-3 dark:border-[#223242]">
      {Icon && (
        <div className="rounded-xl bg-purple-100 p-2.5 dark:bg-[#102431]">
          <Icon className="h-5 w-5 text-purple-600 dark:text-[#69d6ff]" />
        </div>
      )}
      <div>
        <h3 className="text-base font-bold text-purple-900 dark:text-white">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
    </div>
    {children}
  </section>
);

const IconActionButton = ({ as: Component = 'button', icon: Icon, label, ...props }) => (
  <Component
    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-200 bg-white/92 text-slate-700 shadow-sm transition-colors hover:bg-purple-50 dark:border-[#29556e] dark:bg-[#13222d] dark:text-slate-100 dark:hover:bg-[#183040]"
    aria-label={label}
    title={label}
    {...props}
  >
    <Icon className="h-4.5 w-4.5 text-purple-500 dark:text-[#69d6ff]" />
  </Component>
);

const UtilityField = ({ icon: Icon, label, value, href, onCopy, external = false }) => (
  <div className="rounded-2xl border border-purple-100 bg-white/90 p-4 dark:border-[#29556e] dark:bg-[#102431]">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          <Icon className="h-4 w-4 text-purple-500 dark:text-[#69d6ff]" />
          {label}
        </p>
        <p className="mt-2 break-words text-sm font-semibold text-gray-900 dark:text-white">{value || '-'}</p>
      </div>
      {value && (
        <div className="flex items-center gap-2">
          {href && (
            <a
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-purple-50 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-[#183040] dark:hover:text-[#69d6ff]"
              aria-label={`Open ${label}`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-purple-50 hover:text-purple-600 dark:text-slate-400 dark:hover:bg-[#183040] dark:hover:text-[#69d6ff]"
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  </div>
);

const ContactDetailModal = ({ contact, isOpen, onClose, onEdit }) => {
  const { favorites, toggleFavorite } = useFavorites();
  const [isClosing, setIsClosing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact || {});
  const [profileImage, setProfileImage] = useState(contact?.profile_picture || null);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (isOpen && contact) {
      setEditedContact(contact);
      setProfileImage(contact.profile_picture || null);
      setIsImagePreviewOpen(false);
    }
  }, [isOpen, contact?.id]);

  useEffect(() => {
    if (!isOpen || !contact) {
      setQrCodeUrl('');
      return;
    }

    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${contact.name || ''}`,
      contact.designation ? `TITLE:${contact.designation}` : '',
      contact.company ? `ORG:${contact.company}` : '',
      contact.mobile ? `TEL;TYPE=CELL:${contact.mobile}` : '',
      contact.landline ? `TEL;TYPE=WORK,VOICE:${contact.landline}` : '',
      contact.extension ? `NOTE:Extension ${contact.extension}` : '',
      contact.email ? `EMAIL;TYPE=INTERNET:${contact.email}` : '',
      contact.website ? `URL:${contact.website}` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\n');

    QRCode.toDataURL(vCard, {
      width: 240,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(''));
  }, [isOpen, contact]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isImagePreviewOpen) {
          setIsImagePreviewOpen(false);
          return;
        }
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isImagePreviewOpen]);

  if (!isOpen || !contact) return null;

  const isFavorite = favorites.includes(contact.id);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsImagePreviewOpen(false);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const copyToClipboard = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const downloadQrCode = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${(editedContact.name || 'contact').replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    link.click();
  };

  const previewPhone = editedContact.mobile || editedContact.landline || 'No contact number listed';
  const previewEmail = editedContact.email || 'No email address listed';
  const previewExtension = editedContact.extension || 'No extension listed';

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleBackdropClick}
      />

      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full translate-x-0 flex-col bg-white shadow-2xl transition-all duration-300 ease-out dark:bg-[#0f141b] md:w-[52rem] ${
          isClosing ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-purple-50/30 blur-3xl dark:bg-[#0d2c3b]/30" />
        <div className="absolute bottom-0 left-0 -z-10 h-48 w-48 rounded-full bg-violet-50/20 blur-3xl dark:bg-[#0d2230]/30" />

        <div className="sticky top-0 z-10 flex-shrink-0 border-b bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 px-6 py-5 shadow-lg dark:border-[#24465c] dark:from-[#131b23] dark:via-[#18222d] dark:to-[#131b23]">
          <div className="w-full">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-white" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65">User Directory</p>
                  <h2 className="text-xl font-bold text-white">Contact Details</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(contact.id)}
                  className="rounded-full p-2 transition-all duration-200 hover:scale-110 hover:bg-white/20 active:scale-95"
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={`h-5 w-5 transition-all ${
                      isFavorite ? 'fill-amber-300 text-amber-300' : 'text-white/70 hover:text-white'
                    }`}
                  />
                </button>
                <button
                  onClick={() => onEdit?.(contact)}
                  className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/30"
                  aria-label="Edit contact"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleClose}
                  className="rounded-full p-2 transition-all duration-200 hover:scale-110 hover:bg-white/20 active:scale-95"
                  aria-label="Close"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {contact.is_ert && (
                <div className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                  <Shield className="h-3 w-3" />
                  Emergency Response Team
                </div>
              )}
              {contact.extension && (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                  <Phone className="h-3 w-3" />
                  Ext. {contact.extension}
                </div>
              )}
              {contact.department && (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                  <MapPin className="h-3 w-3" />
                  {contact.department}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50 via-white to-violet-50 p-4 shadow-lg shadow-purple-100/50 dark:border-[#24465c] dark:bg-[linear-gradient(135deg,rgba(22,30,39,0.98),rgba(15,20,27,0.98))] dark:shadow-[0_22px_40px_rgba(2,6,23,0.35)] sm:p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => profileImage && setIsImagePreviewOpen(true)}
                      className={`h-32 w-32 rounded-[1.7rem] bg-gradient-to-br from-purple-400 via-violet-400 to-fuchsia-400 p-1 shadow-xl transition-transform dark:from-[#23b7f2] dark:via-[#1598df] dark:to-[#0d6fb0] sm:h-44 sm:w-44 ${
                        profileImage ? 'cursor-zoom-in hover:scale-[1.02]' : 'cursor-default'
                      }`}
                      aria-label={profileImage ? 'Open expanded profile image' : 'Profile image'}
                    >
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[1.45rem] bg-white dark:bg-[#0e141b]">
                        {profileImage ? (
                          <img src={profileImage} alt={editedContact.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-violet-100 dark:from-[#163243] dark:to-[#1a2230]">
                            <User className="h-16 w-16 text-purple-400 dark:text-[#7eddff] sm:h-24 sm:w-24" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  <div className="min-w-0 w-full flex-1 text-center sm:text-left">
                    <>
                      <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                        {contact.name}
                      </h3>
                      <p className="mt-3 text-base font-semibold text-purple-600 dark:text-slate-200 sm:text-lg">
                        {contact.designation || 'No designation assigned'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {contact.company || 'No company listed'}
                      </p>
                    </>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      {contact.department && (
                        <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm dark:border-[#29556e] dark:bg-[#13222d] dark:text-slate-200 sm:max-w-[16rem]">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-500 dark:text-[#69d6ff]" />
                          <span className="truncate">{contact.department}</span>
                        </span>
                      )}
                      {contact.email && (
                        <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm dark:border-[#29556e] dark:bg-[#13222d] dark:text-slate-200 sm:max-w-[19rem] md:max-w-[21rem]">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-purple-500 dark:text-[#69d6ff]" />
                          <span className="min-w-0 truncate">{contact.email}</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                      {(contact.mobile || contact.landline) && (
                        <IconActionButton
                          as="a"
                          href={`tel:${contact.mobile || contact.landline}`}
                          icon={Phone}
                          label={contact.mobile ? 'Call mobile' : 'Call landline'}
                        />
                      )}
                      {contact.email && (
                        <IconActionButton
                          as="a"
                          href={`mailto:${contact.email}`}
                          icon={Mail}
                          label="Send email"
                        />
                      )}
                      {contact.extension && (
                        <IconActionButton
                          icon={Copy}
                          label="Copy extension"
                          onClick={() => copyToClipboard(contact.extension, 'Extension')}
                        />
                      )}
                      {contact.website && (
                        <IconActionButton
                          as="a"
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          icon={ExternalLink}
                          label="Open website"
                        />
                      )}
                      <IconActionButton
                        icon={Edit2}
                        label="Edit contact"
                        onClick={() => onEdit?.(contact)}
                      />
                      {(contact.mobile || contact.landline) && (
                        <p className="basis-full text-xs text-slate-500 dark:text-slate-400 sm:basis-auto sm:pl-1">
                          Quick actions
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <SectionCard title="Professional Details" description="Role, department, and company information." icon={Briefcase}>
                  <div className="space-y-4">
                    <InputField
                      icon={Briefcase}
                      label="Designation"
                      value={editedContact.designation}
                    />
                    <InputField
                      icon={Building2}
                      label="Department"
                      value={editedContact.department}
                    />
                    <InputField
                      icon={Building2}
                      label="Company"
                      value={editedContact.company}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Contact Channels" description="Primary ways to reach this contact." icon={Phone}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <UtilityField
                          icon={Mail}
                          label="Email"
                          value={editedContact.email}
                          href={editedContact.email ? `mailto:${editedContact.email}` : null}
                          onCopy={() => copyToClipboard(editedContact.email, 'Email')}
                        />
                      </div>
                      <UtilityField
                        icon={Phone}
                        label="Mobile"
                        value={editedContact.mobile}
                        href={editedContact.mobile ? `tel:${editedContact.mobile}` : null}
                        onCopy={() => copyToClipboard(editedContact.mobile, 'Mobile')}
                      />
                      <UtilityField
                        icon={Phone}
                        label="Landline"
                        value={editedContact.landline}
                        href={editedContact.landline ? `tel:${editedContact.landline}` : null}
                        onCopy={() => copyToClipboard(editedContact.landline, 'Landline')}
                      />
                      <UtilityField
                        icon={Phone}
                        label="Extension"
                        value={editedContact.extension}
                        onCopy={() => copyToClipboard(editedContact.extension, 'Extension')}
                      />
                      <div className="md:col-span-2">
                        <UtilityField
                          icon={Globe}
                          label="Website"
                          value={editedContact.website}
                          href={editedContact.website}
                          external
                          onCopy={() => copyToClipboard(editedContact.website, 'Website')}
                        />
                      </div>
                    </div>
                </SectionCard>

                <SectionCard title="Languages" description="Spoken or supported languages." icon={Globe}>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {editedContact.languages && editedContact.languages.length > 0 ? (
                          editedContact.languages.map((lang, index) => (
                            <span
                              key={index}
                              className="rounded-full border border-purple-200 bg-gradient-to-r from-purple-100 to-violet-100 px-3 py-1.5 text-sm font-bold text-purple-700 dark:border-[#29556e] dark:bg-[linear-gradient(90deg,rgba(16,36,49,0.95),rgba(15,30,42,0.95))] dark:text-[#7eddff]"
                            >
                              {lang}
                            </span>
                          ))
                        ) : (
                          <p className="rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-slate-500 dark:border-[#29556e] dark:bg-[#102431] dark:text-slate-400">
                            No languages specified
                          </p>
                        )}
                      </div>
                  </div>
                </SectionCard>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-1">
              <SectionCard title="Tags" description="Keywords used to group and filter contacts." icon={Tag}>
                <div className="flex flex-wrap gap-2">
                    {editedContact.tags && editedContact.tags.length > 0 ? (
                      editedContact.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:border-[#334252] dark:bg-[#253240] dark:text-slate-100 dark:hover:bg-[#314252]"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm italic text-gray-400">No tags</p>
                    )}
                  </div>
              </SectionCard>

              <SectionCard title="Comments" description="Operational notes and additional context." icon={MessageSquare}>
                <div className="min-h-[180px] rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 p-4 dark:border-[#29556e] dark:bg-[linear-gradient(135deg,rgba(31,44,57,0.95),rgba(42,54,71,0.95))]">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-100">
                    {editedContact.comments || <span className="italic text-gray-400">No comments</span>}
                  </p>
                </div>
              </SectionCard>

              {qrCodeUrl && (
                <SectionCard title="QR Contact Share" description="Scan to save this contact on another device." icon={Globe}>
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white p-3 dark:border-[#29556e] dark:bg-[#102431]">
                      <img
                        src={qrCodeUrl}
                        alt={`QR code for ${editedContact.name}`}
                        className="mx-auto h-48 w-48 rounded-xl bg-white object-contain p-2"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={downloadQrCode}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white/90 px-4 py-3 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50 dark:border-[#29556e] dark:bg-[#13222d] dark:text-[#7eddff] dark:hover:bg-[#183040]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Download QR
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(editedContact.email || editedContact.mobile || editedContact.extension, 'Contact detail')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white/90 px-4 py-3 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50 dark:border-[#29556e] dark:bg-[#13222d] dark:text-[#7eddff] dark:hover:bg-[#183040]"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Key Detail
                      </button>
                    </div>
                  </div>
                </SectionCard>
              )}
            </div>
          </div>
        </div>
      </div>

      {isImagePreviewOpen && profileImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-6 py-8 backdrop-blur-md"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl dark:bg-[#10171f]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsImagePreviewOpen(false)}
              className="absolute right-5 top-5 z-10 rounded-full bg-black/35 p-2 text-white transition-colors hover:bg-black/55"
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-[1.35fr_0.9fr]">
              <div className="bg-slate-100 dark:bg-[#091018]">
                <img src={profileImage} alt={editedContact.name} className="h-full max-h-[78vh] w-full object-cover" />
              </div>

              <div className="flex flex-col justify-between bg-gradient-to-br from-white to-purple-50 p-6 dark:from-[#131b23] dark:to-[#101923]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-500 dark:text-[#69d6ff]">
                    Expanded View
                  </p>
                  <h3 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {editedContact.name}
                  </h3>
                  {editedContact.designation && (
                    <p className="mt-2 text-base font-semibold text-purple-600 dark:text-slate-200">
                      {editedContact.designation}
                    </p>
                  )}
                  {editedContact.company && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{editedContact.company}</p>
                  )}
                </div>

                <div className="mt-8 space-y-4">
                  <div className="rounded-2xl border border-purple-100 bg-white/90 p-4 dark:border-[#294152] dark:bg-[#17212c]">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-5 w-5 text-purple-500 dark:text-[#69d6ff]" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Contact Number</p>
                        <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white break-words">{previewPhone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-100 bg-white/90 p-4 dark:border-[#294152] dark:bg-[#17212c]">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-5 w-5 text-purple-500 dark:text-[#69d6ff]" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Extension</p>
                        <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white break-words">{previewExtension}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-100 bg-white/90 p-4 dark:border-[#294152] dark:bg-[#17212c]">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-5 w-5 text-purple-500 dark:text-[#69d6ff]" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Email Address</p>
                        <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white break-words">{previewEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactDetailModal;
