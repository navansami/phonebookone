import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      // Set default authorization header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      // You could also decode the JWT here to get user info if needed
    }
    setIsLoading(false); // Done loading
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
      });

      const { access_token: authToken } = response.data;

      // Save token to localStorage
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser({ username }); // Set basic user info
      setIsAuthenticated(true);

      // Set default authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Throw error so Login component can catch it
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
