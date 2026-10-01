import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('collabspace_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('collabspace_token');
    setToken(null);
    setUser(null);
  }, []);

  // Listen for global 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  // Hydrate user profile on application mount or token change
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('collabspace_token');

      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await authService.getMe();
        if (isMounted && response.success) {
          setUser(response.data.user);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err?.response?.data?.message || err.message);
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  // Login handler
  const login = async ({ email, password }) => {
    const response = await authService.login({ email, password });
    if (response.success && response.data?.token) {
      localStorage.setItem('collabspace_token', response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data;
    }
    throw new Error(response.message || 'Login failed');
  };

  // Register handler
  const register = async ({ name, email, password }) => {
    const response = await authService.register({ name, email, password });
    if (response.success && response.data?.token) {
      localStorage.setItem('collabspace_token', response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data;
    }
    throw new Error(response.message || 'Registration failed');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};