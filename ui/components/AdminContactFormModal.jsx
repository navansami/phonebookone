import { useState, useEffect } from 'react';
import { X, Loader2, User, Upload, ImageIcon, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageCropModal from './ImageCropModal';
import { uploadProfilePicture } from '../services/contactsApi';

const FloatingInput = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required = false,
  disabled = false,
}) => (
  <div className="relative">
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder=" "
      disabled={disabled}
      className={`peer w-full border-0 border-b-2 bg-transparent px-0 pb-2 pt-6 text-gray-900 transition-all focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-gray-100 ${
        error ? 'border-red-500' : 'border-gray-300 focus:border-indigo-500 dark:border-gray-600 dark:focus:border-[#7fdcff]'
      }`}
    />
    <label
      htmlFor={name}
      className="pointer-events-none absolute left-0 top-5 origin-left text-sm text-gray-500 transition-all duration-200 peer-focus:top-0 peer-focus:scale-90 peer-focus:text-indigo-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 dark:text-gray-400 dark:peer-focus:text-[#7fdcff]"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {placeholder && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{placeholder}</p>}
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const AdminContactFormModal = ({ isOpen, onClose, contact, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    company: '',
    extension: '',
    email: '',
    mobile: '',
    landline: '',
    website: '',
    languages: '',
    tags: '',
    comments: '',
    expose: true,
    is_ert: false,
    is_ifa: false,
    is_third_party: false,
    profile_picture: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        designation: contact.designation || '',
        department: contact.department || '',
        company: contact.company || '',
        extension: contact.extension || '',
        email: contact.email || '',
        mobile: contact.mobile || '',
        landline: contact.landline || '',
        website: contact.website || '',
        languages: contact.languages ? contact.languages.join(', ') : '',
        tags: contact.tags ? contact.tags.join(', ') : '',
        comments: contact.comments || '',
        expose: contact.expose !== undefined ? contact.expose : true,
        is_ert: contact.is_ert || false,
        is_ifa: contact.is_ifa || false,
        is_third_party: contact.is_third_party || false,
        profile_picture: contact.profile_picture || ''
      });
    } else {
      setFormData({
        name: '',
        designation: '',
        department: '',
        company: '',
        extension: '',
        email: '',
        mobile: '',
        landline: '',
        website: '',
        languages: '',
        tags: '',
        comments: '',
        expose: true,
        is_ert: false,
        is_ifa: false,
        is_third_party: false,
        profile_picture: ''
      });
    }
    setErrors({});
  }, [contact, isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.mobile && !/^[\d\s\-+()]+$/.test(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile number format';
    }

    if (formData.landline && !/^[\d\s\-+()]+$/.test(formData.landline)) {
      newErrors.landline = 'Invalid landline number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCropComplete = async (croppedImageBlob) => {
    // Show loading toast
    const loadingToast = toast.loading('Uploading profile picture...');

    try {
      // Generate a temporary contact ID if creating a new contact
      const contactId = contact?.id || `temp_${Date.now()}`;

      // Upload to the local server
      const response = await uploadProfilePicture(contactId, croppedImageBlob);

      // Set the returned local URL in form data
      setFormData(prev => ({ ...prev, profile_picture: response.data.url }));

      toast.success('Profile picture uploaded successfully', { id: loadingToast });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error.response?.data?.detail || 'Failed to upload profile picture',
        { id: loadingToast }
      );
    }
  };

  const handleRemoveProfilePicture = () => {
    setFormData(prev => ({ ...prev, profile_picture: '' }));
    toast.success('Profile picture removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        languages: formData.languages
          ? formData.languages.split(',').map(lang => lang.trim()).filter(Boolean)
          : [],
        tags: formData.tags
          ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : []
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Failed to save contact');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="h-full w-full max-w-3xl overflow-hidden border-l border-gray-200 bg-white shadow-2xl dark:border-[#243244] dark:bg-[#121a23] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-r from-[#3f6ee8] via-[#5b4fe7] to-[#8c3ae8] px-6 py-5 text-white shadow-lg shadow-indigo-900/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                  {contact ? 'Directory Update' : 'New Directory Entry'}
                </p>
                <h2 className="text-3xl font-bold leading-none">
                  {contact ? 'Edit Contact' : 'Add Contact'}
                </h2>
              </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6">
              {/* Profile Picture Section */}
              <div className="rounded-3xl border border-indigo-100 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_32%),linear-gradient(135deg,#f8f8ff,#f3f6ff)] p-5 dark:border-[#2f4054] dark:bg-[radial-gradient(circle_at_top_left,_rgba(91,79,231,0.16),_transparent_30%),linear-gradient(135deg,#151e29,#17212d)]">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative mx-auto sm:mx-0">
                    {formData.profile_picture ? (
                      <div className="relative group">
                        <img
                          src={formData.profile_picture}
                          alt="Profile"
                          className="h-28 w-28 rounded-[28px] object-cover border-4 border-white dark:border-[#243244] shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveProfilePicture}
                          className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
                          title="Remove picture"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border-4 border-white bg-gradient-to-br from-indigo-100 to-purple-100 shadow-lg dark:border-[#243244] dark:from-[#1e3042] dark:to-[#2d2a4d]">
                        <User className="h-14 w-14 text-indigo-400 dark:text-indigo-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500 dark:text-[#7fdcff]">
                      Profile Media
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {formData.name || 'Contact profile'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Add a photo to make records easier to scan in the admin table and contact drawer.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCropModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-200 transition-colors hover:bg-indigo-50 dark:bg-[#1b2734] dark:text-[#8edfff] dark:ring-[#35526b] dark:hover:bg-[#223142]"
                      >
                        {formData.profile_picture ? (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            Change Picture
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload Picture
                          </>
                        )}
                      </button>
                      {formData.profile_picture && (
                        <button
                          type="button"
                          onClick={handleRemoveProfilePicture}
                          className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 font-medium text-red-600 shadow-sm ring-1 ring-red-200 transition-colors hover:bg-red-50 dark:bg-[#1b2734] dark:text-red-300 dark:ring-red-900/40 dark:hover:bg-red-900/20"
                        >
                          <XCircle className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#243244] dark:bg-[#151e29]">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-gray-500">
                    Core Details
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Identity</h3>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FloatingInput label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" error={errors.name} required disabled={isLoading} />
                </div>

                <div>
                  <FloatingInput label="Designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="Manager" disabled={isLoading} />
                </div>

                <div>
                  <FloatingInput label="Department" name="department" value={formData.department} onChange={handleChange} placeholder="Sales" disabled={isLoading} />
                </div>

                <div>
                  <FloatingInput label="Company" name="company" value={formData.company} onChange={handleChange} placeholder="Fairmont The Palm" disabled={isLoading} />
                </div>

                <div>
                  <FloatingInput label="Extension" name="extension" value={formData.extension} onChange={handleChange} placeholder="3301" disabled={isLoading} />
                </div>
              </div>
              </div>

              {/* Contact Information */}
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#243244] dark:bg-[#151e29]">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-gray-500">
                    Reachability
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Contact Channels</h3>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FloatingInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" error={errors.email} disabled={isLoading} />
                </div>

                <div>
                  <FloatingInput label="Mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} placeholder="+971 50 123 4567" error={errors.mobile} disabled={isLoading} />
                </div>

                <div>
                  <FloatingInput label="Landline" name="landline" type="tel" value={formData.landline} onChange={handleChange} placeholder="+971 4 123 4567" error={errors.landline} disabled={isLoading} />
                </div>

                <div>
                  <FloatingInput label="Website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://example.com" disabled={isLoading} />
                </div>
              </div>
              </div>

              {/* Additional Information */}
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#243244] dark:bg-[#151e29]">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-gray-500">
                    Classification
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Languages, Tags, Notes</h3>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FloatingInput label="Languages" name="languages" value={formData.languages} onChange={handleChange} placeholder="English, Arabic, Hindi" disabled={isLoading} />
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Separate with commas</p>
                </div>

                <div>
                  <FloatingInput label="Tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="VIP, Management, IT" disabled={isLoading} />
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Separate with commas</p>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Comments
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                  disabled={isLoading}
                  placeholder="Additional notes or information..."
                />
              </div>
              </div>

              {/* Status Toggles */}
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#243244] dark:bg-[#151e29]">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-gray-500">
                    Publishing Rules
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Status & Permissions</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 cursor-pointer transition-colors hover:bg-gray-100 dark:border-[#243244] dark:bg-[#1b2430] dark:hover:bg-[#202b38]">
                    <input
                      type="checkbox"
                      name="expose"
                      checked={formData.expose}
                      onChange={handleChange}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                      disabled={isLoading}
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-200">Publicly Visible</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 cursor-pointer transition-colors hover:bg-gray-100 dark:border-[#243244] dark:bg-[#1b2430] dark:hover:bg-[#202b38]">
                    <input
                      type="checkbox"
                      name="is_ert"
                      checked={formData.is_ert}
                      onChange={handleChange}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                      disabled={isLoading}
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-200">Emergency Response Team</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 cursor-pointer transition-colors hover:bg-gray-100 dark:border-[#243244] dark:bg-[#1b2430] dark:hover:bg-[#202b38]">
                    <input
                      type="checkbox"
                      name="is_ifa"
                      checked={formData.is_ifa}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-200">IFA Contact</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 cursor-pointer transition-colors hover:bg-gray-100 dark:border-[#243244] dark:bg-[#1b2430] dark:hover:bg-[#202b38]">
                    <input
                      type="checkbox"
                      name="is_third_party"
                      checked={formData.is_third_party}
                      onChange={handleChange}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      disabled={isLoading}
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-200">Third Party</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-[#243244] dark:bg-[#121a23]/95 flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#34485e] dark:text-gray-200 dark:hover:bg-[#1f2b38]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 rounded-xl bg-gradient-to-r from-[#3f6ee8] via-[#5b4fe7] to-[#8c3ae8] px-6 py-3 text-white transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-indigo-900/20"
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isLoading ? 'Saving...' : (contact ? 'Update Contact' : 'Create Contact')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        initialImage={formData.profile_picture}
      />
    </>
  );
};

export default AdminContactFormModal;
