// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { User, LoginRequest, RegisterRequest } from '../types/auth.types';
import { getLoginErrorMessage, shouldShowRetry, getErrorIcon } from '../utils/errorMessages';
import toast from 'react-hot-toast';

interface LoginError {
  message: string;
  shouldShowRetry: boolean;
  icon: 'warning' | 'error' | 'info';
  fieldErrors?: Record<string, string>;
  timestamp: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginError: LoginError | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearLoginError: () => void;
  retryLogin: (data: LoginRequest) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    if (loginError) {
      console.log('🔴 Login Error Set:', {
        message: loginError.message,
        timestamp: new Date(loginError.timestamp).toISOString(),
        fieldErrors: loginError.fieldErrors
      });
    } else {
      console.log('✅ Login Error Cleared');
    }
  }, [loginError]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('token');
        console.log('Token validation failed:', error);
      }
    }
    setIsLoading(false);
  };

  const clearLoginError = () => {
    console.log('🧹 Manually clearing login error');
    setLoginError(null);
  };

  const createLoginError = (error: any): LoginError => {
    const message = getLoginErrorMessage(error);
    const shouldRetry = shouldShowRetry(error);
    const icon = getErrorIcon(error);
    
    // Extract field-specific errors if available
    let fieldErrors: Record<string, string> | undefined;
    if (error?.response?.data?.fieldErrors) {
      fieldErrors = error.response.data.fieldErrors;
    } else if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      // Convert validation errors to field errors if possible
      fieldErrors = {};
      error.response.data.errors.forEach((err: any) => {
        if (err.field) {
          fieldErrors![err.field] = err.message;
        }
      });
    }

    return {
      message,
      shouldShowRetry: shouldRetry,
      icon,
      fieldErrors,
      timestamp: Date.now()
    };
  };

  const login = async (data: LoginRequest) => {
    console.log('🔵 Login attempt started');
    
    try {
      // Clear any existing errors
      setLoginError(null);
      setIsLoading(true);
      
      console.log('📡 Calling authService.login');
      const response = await authService.login(data);
      
      console.log('📡 Calling authService.getCurrentUser');
      const userData = await authService.getCurrentUser();
      
      console.log('✅ Login successful');
      setUser(userData);
      toast.success(`Willkommen zurück, ${userData.fullName}!`);
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('🔴 Login error caught:', error);
      console.error('🔴 Error response:', error?.response?.data);
      console.error('🔴 Error status:', error?.response?.status);
      
      const loginErrorData = createLoginError(error);
      console.log('🔴 Created login error:', loginErrorData);
      
      // Set the error state BEFORE showing toast
      setLoginError(loginErrorData);
      
      // Show toast with appropriate styling based on error type
      const toastMessage = loginErrorData.message;
      console.log('🍞 Showing toast:', toastMessage);
      
      if (loginErrorData.icon === 'error') {
        toast.error(toastMessage, {
          duration: 8000,
          icon: '🚨',
          id: 'login-error', // Prevent duplicate toasts
        });
      } else if (loginErrorData.icon === 'warning') {
        toast.error(toastMessage, {
          duration: 6000,
          icon: '⚠️',
          id: 'login-error',
        });
      } else {
        toast.error(toastMessage, {
          duration: 5000,
          id: 'login-error',
        });
      }
      
      // DON'T throw the error here - let the component handle it
      console.log('🔴 Login function completed with error');
      
    } finally {
      setIsLoading(false);
    }
  };

  const retryLogin = async (data: LoginRequest) => {
    console.log('🔄 Retry login attempt');
    // Clear previous error and retry
    setLoginError(null);
    await login(data);
  };

  const register = async (data: RegisterRequest) => {
    try {
      setLoginError(null);
      setIsLoading(true);
      
      const response = await authService.register(data);
      const userData = await authService.getCurrentUser();
      
      setUser(userData);
      toast.success(`Willkommen ${userData.fullName}! Registrierung erfolgreich.`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      const registrationError = createLoginError(error);
      setLoginError(registrationError);
      
      toast.error(registrationError.message, {
        duration: 5000,
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      authService.logout();
      setUser(null);
      setLoginError(null); // Clear any login errors
      toast.success('Erfolgreich abgemeldet');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.removeItem('token');
      setUser(null);
      setLoginError(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      loginError,
      login, 
      register, 
      logout, 
      checkAuth,
      clearLoginError,
      retryLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};