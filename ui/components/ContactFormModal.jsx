import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Plus,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Globe,
  Tag,
  MessageSquare,
  Languages,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SectionCard = ({ eyebrow, title, children }) => (
  <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#243244] dark:bg-[#151e29]">
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-gray-500">{eyebrow}</p>
      <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ icon: Icon, label, error, required = false, children, hint }) => (
  <div>
    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
      {Icon && <Icon className="h-4 w-4 text-indigo-500 dark:text-[#7fdcff]" />}
      <span>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const chipClasses =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium';

const FloatingInput = ({
  icon: Icon,
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
  <div>
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
        className="pointer-events-none absolute left-0 top-5 flex origin-left items-center gap-2 text-sm text-gray-500 transition-all duration-200 peer-focus:top-0 peer-focus:scale-90 peer-focus:text-indigo-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 dark:text-gray-400 dark:peer-focus:text-[#7fdcff]"
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>
    </div>
    {placeholder && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{placeholder}</p>}
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const ContactFormModal = ({ isOpen, onClose, contact, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    company: '',
    email: '',
    mobile: '',
    landline: '',
    extension: '',
    website: '',
    comments: '',
  });
  const [languages, setLanguages] = useState([]);
  const [tags, setTags] = useState([]);
  const [languageInput, setLanguageInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        designation: contact.designation || '',
        department: contact.department || '',
        company: contact.company || '',
        email: contact.email || '',
        mobile: contact.mobile || '',
        landline: contact.landline || '',
        extension: contact.extension || '',
        website: contact.website || '',
        comments: contact.comments || '',
      });
      setLanguages(contact.languages || []);
      setTags(contact.tags || []);
    } else {
      setFormData({
        name: '',
        designation: '',
        department: '',
        company: '',
        email: '',
        mobile: '',
        landline: '',
        extension: '',
        website: '',
        comments: '',
      });
      setLanguages([]);
      setTags([]);
    }
    setLanguageInput('');
    setTagInput('');
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddLanguage = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedLanguage = languageInput.trim();
      if (trimmedLanguage && !languages.includes(trimmedLanguage)) {
        setLanguages([...languages, trimmedLanguage]);
        setLanguageInput('');
      }
    }
  };

  const handleRemoveLanguage = (languageToRemove) => {
    setLanguages(languages.filter((lang) => lang !== languageToRemove));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedTag = tagInput.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
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
        languages,
        tags,
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Failed to save contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl dark:border-[#243244] dark:bg-[#121a23]">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-r from-[#3f6ee8] via-[#5b4fe7] to-[#8c3ae8] px-6 py-5 text-white shadow-lg shadow-indigo-900/15">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                {contact ? 'Directory Update' : 'New Directory Entry'}
              </p>
              <h2 className="text-3xl font-bold leading-none">{contact ? 'Edit Contact' : 'Add Contact'}</h2>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full p-2 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-6 px-6 py-6">
            <div className="rounded-3xl border border-indigo-100 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_32%),linear-gradient(135deg,#f8f8ff,#f3f6ff)] p-5 dark:border-[#2f4054] dark:bg-[radial-gradient(circle_at_top_left,_rgba(91,79,231,0.16),_transparent_30%),linear-gradient(135deg,#151e29,#17212d)]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[28px] border-4 border-white bg-gradient-to-br from-indigo-100 to-purple-100 shadow-lg dark:border-[#243244] dark:from-[#1e3042] dark:to-[#2d2a4d] sm:mx-0">
                  <User className="h-14 w-14 text-indigo-400 dark:text-indigo-300" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500 dark:text-[#7fdcff]">
                    Guest Submission
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {formData.name || 'New contact request'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Submit a polished contact record using the same structured format as the admin workspace.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-200 dark:bg-[#1b2734] dark:text-[#8edfff] dark:ring-[#35526b]">
                    <Plus className="h-4 w-4" />
                    Public Directory Form
                  </div>
                </div>
              </div>
            </div>

            <SectionCard eyebrow="Core Details" title="Identity">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FloatingInput
                    icon={User}
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    error={errors.name}
                    required
                    disabled={isLoading}
                  />
                </div>
                <FloatingInput icon={Briefcase} label="Designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="Manager" disabled={isLoading} />
                <FloatingInput icon={Building2} label="Department" name="department" value={formData.department} onChange={handleChange} placeholder="Sales" disabled={isLoading} />
                <FloatingInput icon={Building2} label="Company" name="company" value={formData.company} onChange={handleChange} placeholder="Fairmont The Palm" disabled={isLoading} />
                <FloatingInput icon={Phone} label="Extension" name="extension" value={formData.extension} onChange={handleChange} placeholder="3301" disabled={isLoading} />
              </div>
            </SectionCard>

            <SectionCard eyebrow="Reachability" title="Contact Channels">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FloatingInput
                    icon={Mail}
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@fairmont.com"
                    error={errors.email}
                    disabled={isLoading}
                  />
                </div>
                <FloatingInput icon={Phone} label="Mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} placeholder="+971 50 123 4567" error={errors.mobile} disabled={isLoading} />
                <FloatingInput icon={Phone} label="Landline" name="landline" type="tel" value={formData.landline} onChange={handleChange} placeholder="+971 4 123 4567" error={errors.landline} disabled={isLoading} />
                <div className="md:col-span-2">
                  <FloatingInput icon={Globe} label="Website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://example.com" disabled={isLoading} />
                </div>
              </div>
            </SectionCard>

            <SectionCard eyebrow="Classification" title="Languages, Tags, Notes">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field icon={Languages} label="Languages" hint="Press Enter to add each language">
                  <div className="relative">
                    <input
                      type="text"
                      id="languageInput"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyDown={handleAddLanguage}
                      placeholder=" "
                      className="peer w-full border-0 border-b-2 border-gray-300 bg-transparent px-0 pb-2 pt-6 text-gray-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-gray-600 dark:text-gray-100 dark:focus:border-[#7fdcff]"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="languageInput"
                      className="pointer-events-none absolute left-0 top-5 flex origin-left items-center gap-2 text-sm text-gray-500 transition-all duration-200 peer-focus:top-0 peer-focus:scale-90 peer-focus:text-indigo-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 dark:text-gray-400 dark:peer-focus:text-[#7fdcff]"
                    >
                      <Languages className="h-4 w-4" />
                      Type a language and press Enter
                    </label>
                  </div>
                  {languages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {languages.map((language, index) => (
                        <span
                          key={index}
                          className={`${chipClasses} bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300`}
                        >
                          {language}
                          <button
                            type="button"
                            onClick={() => handleRemoveLanguage(language)}
                            className="rounded-full p-0.5 transition-colors hover:bg-indigo-200 dark:hover:bg-indigo-800"
                            disabled={isLoading}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </Field>

                <Field icon={Tag} label="Tags" hint="Press Enter to add each tag">
                  <div className="relative">
                    <input
                      type="text"
                      id="tagInput"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder=" "
                      className="peer w-full border-0 border-b-2 border-gray-300 bg-transparent px-0 pb-2 pt-6 text-gray-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-gray-600 dark:text-gray-100 dark:focus:border-[#7fdcff]"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="tagInput"
                      className="pointer-events-none absolute left-0 top-5 flex origin-left items-center gap-2 text-sm text-gray-500 transition-all duration-200 peer-focus:top-0 peer-focus:scale-90 peer-focus:text-indigo-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 dark:text-gray-400 dark:peer-focus:text-[#7fdcff]"
                    >
                      <Tag className="h-4 w-4" />
                      Type a tag and press Enter
                    </label>
                  </div>
                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`${chipClasses} bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300`}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="rounded-full p-0.5 transition-colors hover:bg-purple-200 dark:hover:bg-purple-800"
                            disabled={isLoading}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </Field>
              </div>

              <div className="mt-5">
                <Field icon={MessageSquare} label="Comments">
                  <textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Any additional information..."
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-[#7fdcff]"
                    disabled={isLoading}
                  />
                </Field>
              </div>
            </SectionCard>
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-[#243244] dark:bg-[#121a23]/95 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#34485e] dark:text-gray-200 dark:hover:bg-[#1f2b38] sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3f6ee8] via-[#5b4fe7] to-[#8c3ae8] px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-900/20 transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              {isLoading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactFormModal;
