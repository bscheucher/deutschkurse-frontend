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
      }
    }
    setIsLoading(false);
  };

  const clearLoginError = () => {
    setLoginError(null);
  };

  const createLoginError = (error: any): LoginError => {
    const message = getLoginErrorMessage(error);
    const shouldRetry = shouldShowRetry(error);
    const icon = getErrorIcon(error);
    
    let fieldErrors: Record<string, string> | undefined;
    if (error?.response?.data?.fieldErrors) {
      fieldErrors = error.response.data.fieldErrors;
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
    try {
      setLoginError(null);
      setIsLoading(true);
      
      const response = await authService.login(data);
      const userData = await authService.getCurrentUser();
      
      setUser(userData);
      
      // 🔧 IMPROVED: Only show success toast, no error toast here
      toast.success(`Willkommen zurück, ${userData.fullName}!`, {
        duration: 3000,
      });
      
      navigate('/dashboard');
      
    } catch (error: any) {
      const loginErrorData = createLoginError(error);
      setLoginError(loginErrorData);
      
      // 🔧 REMOVED: No toast here, only inline error display
      throw error; // Re-throw to let calling component handle if needed
      
    } finally {
      setIsLoading(false);
    }
  };

  const retryLogin = async (data: LoginRequest) => {
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
      const registrationError = createLoginError(error);
      setLoginError(registrationError);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      authService.logout();
      setUser(null);
      setLoginError(null);
      toast.success('Erfolgreich abgemeldet');
      navigate('/login');
    } catch (error) {
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