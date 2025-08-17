// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import authService, { UpdateProfileRequest } from '../services/authService';
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
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
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
      
      toast.success(`Willkommen zurück, ${userData.fullName}!`, {
        duration: 3000,
      });
      
      navigate('/dashboard');
      
    } catch (error: any) {
      const loginErrorData = createLoginError(error);
      setLoginError(loginErrorData);
      throw error;
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

  // NEW: Profile update function
  const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
    try {
      console.log('Updating profile with data:', data);
      const updatedUser = await authService.updateCurrentUserProfile(data);
      setUser(updatedUser);
      
      // Check if password was updated
      const hasPasswordChange = data.password && data.password.length > 0;
      console.log('Password change detected:', hasPasswordChange);
      
      if (hasPasswordChange) {
        toast.success('Profil und Passwort erfolgreich aktualisiert. Sie werden in 3 Sekunden abgemeldet.', {
          duration: 8000
        });
        
        console.log('Setting timeout for logout in 3 seconds...');
        
        // Show countdown
        let countdown = 3;
        const countdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            toast(`Abmeldung in ${countdown} Sekunden...`, {
              icon: '⏱️',
              duration: 1000,
            });
          }
        }, 1000);
        
        // Auto-logout after password change
        const logoutTimeout = setTimeout(() => {
          clearInterval(countdownInterval);
          console.log('Executing logout due to password change...');
          
          try {
            logout();
            toast('Sie wurden aufgrund der Passwort-Änderung abgemeldet. Bitte melden Sie sich mit Ihrem neuen Passwort an.', {
              icon: 'ℹ️',
              duration: 6000,
              style: {
                background: '#EBF8FF',
                color: '#2B6CB0',
                border: '1px solid #BEE3F8',
              }
            });
          } catch (logoutError) {
            console.error('Error during logout:', logoutError);
            // Force logout by clearing token and redirecting
            localStorage.removeItem('token');
            setUser(null);
            setLoginError(null);
            navigate('/login');
          }
        }, 3000);
        
        // Store timeout ID for potential cancellation
        (window as any).__passwordChangeLogoutTimeout = logoutTimeout;
        
      } else {
        console.log('No password change, showing regular success message');
        toast.success('Profil erfolgreich aktualisiert.');
      }
      
      return updatedUser;
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Fehler beim Aktualisieren des Profils');
      throw error;
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
      retryLogin,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};