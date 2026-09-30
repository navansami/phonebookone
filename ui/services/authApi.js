import api from './api.js';

/**
 * Login with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise} Axios response promise with token and user data
 */
export const login = (username, password) => {
  return api.post('/api/auth/login', { username, password });
};

/**
 * Get current authenticated user information
 * @returns {Promise} Axios response promise with user data
 */
export const getMe = () => {
  return api.get('/api/auth/me');
};
