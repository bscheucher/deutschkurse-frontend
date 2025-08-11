// src/pages/auth/LoginPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { LoginRequest } from '../../types/auth.types';
import { 
  Eye, EyeOff, AlertCircle, RefreshCw, 
  Lock, User, AlertTriangle, XCircle 
} from 'lucide-react';

const schema = yup.object({
  username: yup.string().required('Benutzername ist erforderlich'),
  password: yup.string().required('Passwort ist erforderlich'),
});

const LoginPage: React.FC = () => {
  const { login, retryLogin, loginError, clearLoginError, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [lastLoginData, setLastLoginData] = useState<LoginRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch
  } = useForm<LoginRequest>({
    resolver: yupResolver(schema),
  });

  // Watch form values but be much less aggressive about clearing errors
  const watchedValues = watch();
  const [hasUserTyped, setHasUserTyped] = useState(false);
  
  useEffect(() => {
    // Only clear error if user has started typing AND error is older than 10 seconds
    if (loginError && hasUserTyped) {
      const errorAge = Date.now() - loginError.timestamp;
      if (errorAge > 10000) { // 10 seconds delay before auto-clearing
        console.log('🧹 Auto-clearing old error after user input (10s delay)');
        clearLoginError();
      }
    }
    // Don't immediately set hasUserTyped - wait a bit
    const timer = setTimeout(() => setHasUserTyped(true), 1000);
    return () => clearTimeout(timer);
  }, [watchedValues.username, watchedValues.password]);

  // Set field-specific errors from API response
  useEffect(() => {
    if (loginError?.fieldErrors) {
      console.log('🔴 Setting field errors:', loginError.fieldErrors);
      Object.entries(loginError.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof LoginRequest, {
          type: 'server',
          message: message
        });
      });
    }
  }, [loginError, setError]);

  // Debug logging for login error changes
  useEffect(() => {
    if (loginError) {
      console.log('🔴 LoginPage received error:', {
        message: loginError.message,
        timestamp: new Date(loginError.timestamp).toISOString(),
        age: Date.now() - loginError.timestamp + 'ms'
      });
    }
  }, [loginError]);

  const onSubmit = async (data: LoginRequest) => {
    console.log('📝 Form submitted with data:', { username: data.username, password: '***' });
    
    try {
      setIsSubmitting(true);
      clearErrors();
      setLastLoginData(data);
      
      // Clear any existing timeout
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      
      console.log('🚀 Calling login function');
      await login(data);
      
      console.log('✅ Login completed successfully');
      
    } catch (error) {
      console.log('🔴 Login failed in component:', error);
      // Error is already handled in AuthContext, just log it here
    } finally {
      // Add a small delay before allowing another submit
      submitTimeoutRef.current = setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const handleRetry = async () => {
    if (lastLoginData && !isSubmitting) {
      console.log('🔄 Retry button clicked');
      setIsSubmitting(true);
      try {
        await retryLogin(lastLoginData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getErrorIcon = () => {
    if (!loginError) return null;
    
    switch (loginError.icon) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getErrorBgColor = () => {
    if (!loginError) return '';
    
    switch (loginError.icon) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  // Don't auto-dismiss errors on component unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Deutschkurse Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Melden Sie sich an, um fortzufahren
          </p>
        </div>
        
        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-2 rounded text-xs">
            <strong>Debug Info:</strong><br />
            Has Error: {loginError ? 'Yes' : 'No'}<br />
            Is Loading: {isLoading ? 'Yes' : 'No'}<br />
            Is Submitting: {isSubmitting ? 'Yes' : 'No'}<br />
            {loginError && (
              <>
                Error Age: {Math.round((Date.now() - loginError.timestamp) / 1000)}s<br />
                Message: {loginError.message}
              </>
            )}
          </div>
        )}
        
        {/* Error Display */}
        {loginError && (
          <div className={`rounded-md border p-4 ${getErrorBgColor()}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {getErrorIcon()}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {loginError.message}
                </p>
                {loginError.shouldShowRetry && lastLoginData && (
                  <div className="mt-3">
                    <button
                      onClick={handleRetry}
                      disabled={isSubmitting || isLoading}
                      className="inline-flex items-center px-3 py-1 text-sm bg-white rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${isSubmitting ? 'animate-spin' : ''}`} />
                      Erneut versuchen
                    </button>
                  </div>
                )}
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => {
                    console.log('❌ Manual error clear clicked');
                    clearLoginError();
                  }}
                  className="inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Benutzername
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  className={`pl-10 input-field ${
                    errors.username ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Benutzername eingeben"
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <div className="mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                  <p className="text-sm text-red-600">{errors.username.message}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`pl-10 pr-10 input-field ${
                    errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Passwort eingeben"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Angemeldet bleiben
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={(e) => {
                  e.preventDefault();
                  // You can implement forgot password functionality here
                }}
              >
                Passwort vergessen?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading ? (
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Wird angemeldet...
              </div>
            ) : (
              'Anmelden'
            )}
          </button>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Probleme beim Anmelden? Wenden Sie sich an Ihren Administrator.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;