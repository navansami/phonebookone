import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '',
  // Use the fetch adapter so requests go through the service worker (enables offline caching).
  adapter: 'fetch',
});

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const requestUrl = error.config?.url || '';
      const isAuthLoginRequest = requestUrl.includes('/api/auth/login');

      switch (status) {
        case 401:
          // Do not hijack login failures; let the login page show the backend error.
          if (!isAuthLoginRequest) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden:', data.message || 'You do not have permission to access this resource');
          break;
        case 404:
          // Not found
          console.error('Resource not found:', data.message || 'The requested resource was not found');
          break;
        case 500:
          // Server error
          console.error('Server error:', data.message || 'An internal server error occurred');
          break;
        default:
          console.error('API Error:', data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error: No response received from server');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
