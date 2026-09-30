import api from './api.js';

/**
 * Get all contacts with optional query parameters
 * @param {Object} params - Query parameters (search, tag, language, isErt, page, limit, etc.)
 * @returns {Promise} Axios response promise
 */
export const getContacts = (params = {}) => {
  return api.get('/api/contacts', { params });
};

/**
 * Get a single contact by ID
 * @param {string} id - Contact ID
 * @returns {Promise} Axios response promise
 */
export const getContact = (id) => {
  return api.get(`/api/contacts/${id}`);
};

/**
 * Create a new contact (public endpoint)
 * @param {Object} data - Contact data
 * @returns {Promise} Axios response promise
 */
export const createContact = (data) => {
  return api.post('/api/contacts', data);
};

/**
 * Create a new contact (admin only)
 * @param {Object} data - Contact data
 * @returns {Promise} Axios response promise
 */
export const createContactAdmin = (data) => {
  return api.post('/api/admin/contacts', data);
};

/**
 * Update an existing contact (public endpoint)
 * @param {string} id - Contact ID
 * @param {Object} data - Updated contact data
 * @returns {Promise} Axios response promise
 */
export const updateContact = (id, data) => {
  return api.put(`/api/contacts/${id}`, data);
};

/**
 * Update an existing contact (admin only)
 * @param {string} id - Contact ID
 * @param {Object} data - Updated contact data
 * @returns {Promise} Axios response promise
 */
export const updateContactAdmin = (id, data) => {
  return api.put(`/api/admin/contacts/${id}`, data);
};

/**
 * Delete a contact (admin only)
 * @param {string} id - Contact ID
 * @returns {Promise} Axios response promise
 */
export const deleteContact = (id) => {
  return api.delete(`/api/admin/contacts/${id}`);
};

export const bulkUpdateContacts = (contactIds, updates) => {
  return api.patch('/api/admin/contacts/bulk', {
    contact_ids: contactIds,
    updates,
  });
};

export const exportContactsCsv = (params = {}) => {
  return api.get('/api/admin/contacts/export', {
    params,
    responseType: 'blob',
  });
};

export const importContactsCsv = (file, applyChanges = false) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/api/admin/contacts/import?apply_changes=${applyChanges}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Toggle ERT status for a contact (admin only)
 * @param {string} id - Contact ID
 * @param {boolean} isErt - ERT status
 * @returns {Promise} Axios response promise
 */
export const toggleERT = (id, isErt) => {
  return api.patch(`/api/admin/contacts/${id}/ert?is_ert=${isErt}`);
};

/**
 * Toggle IFA status for a contact (admin only)
 * @param {string} id - Contact ID
 * @param {boolean} isIfa - IFA status
 * @returns {Promise} Axios response promise
 */
export const toggleIFA = (id, isIfa) => {
  return api.patch(`/api/admin/contacts/${id}/ifa?is_ifa=${isIfa}`);
};

/**
 * Toggle expose status for a contact (admin only)
 * @param {string} id - Contact ID
 * @param {boolean} expose - Expose status
 * @returns {Promise} Axios response promise
 */
export const toggleExpose = (id, expose) => {
  return api.patch(`/api/admin/contacts/${id}/expose?expose=${expose}`);
};

/**
 * Toggle third party status for a contact (admin only)
 * @param {string} id - Contact ID
 * @param {boolean} isThirdParty - Third party status
 * @returns {Promise} Axios response promise
 */
export const toggleThirdParty = (id, isThirdParty) => {
  return api.patch(`/api/admin/contacts/${id}/third-party?is_third_party=${isThirdParty}`);
};

/**
 * Get all available tags
 * @returns {Promise} Axios response promise
 */
export const getTags = () => {
  return api.get('/api/tags');
};

/**
 * Get all available languages
 * @returns {Promise} Axios response promise
 */
export const getLanguages = () => {
  return api.get('/api/languages');
};

/**
 * Upload a profile picture to the local Next.js server (admin only)
 * @param {string} contactId - Contact ID
 * @param {File|Blob} file - Image file to upload
 * @returns {Promise} Axios response promise
 */
export const uploadProfilePicture = (contactId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(`/api/upload/profile-picture?contact_id=${contactId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getAdminTaxonomy = (taxonomyType) => {
  return api.get(`/api/admin/taxonomy/${taxonomyType}`);
};

export const createAdminTaxonomy = (taxonomyType, name) => {
  return api.post(`/api/admin/taxonomy/${taxonomyType}`, { name });
};

export const renameAdminTaxonomy = (taxonomyType, currentName, newName) => {
  return api.patch(`/api/admin/taxonomy/${taxonomyType}`, {
    current_name: currentName,
    new_name: newName,
  });
};

export const deleteAdminTaxonomy = (taxonomyType, name, replacementName = null) => {
  return api.delete(`/api/admin/taxonomy/${taxonomyType}`, {
    data: {
      name,
      replacement_name: replacementName,
    },
  });
};
