import React, { useState, useEffect } from 'react';
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
  const { login, retryLogin, loginError, clearLoginError, isPending } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [lastLoginData, setLastLoginData] = useState<LoginRequest | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<LoginRequest>({
    resolver: yupResolver(schema),
  });

  // 🔧 SIMPLIFIED: Clear errors when user starts typing (after 2 seconds)
  const watchedValues = watch();
  useEffect(() => {
    if (loginError && (watchedValues.username || watchedValues.password)) {
      const timer = setTimeout(() => {
        clearLoginError();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [watchedValues.username, watchedValues.password, loginError, clearLoginError]);

  const onSubmit = async (data: LoginRequest) => {
    try {
      setLastLoginData(data);
      await login(data);
      // Success handling is done in AuthContext
    } catch (error) {
      // Error handling is done in AuthContext
      console.error('Login failed:', error);
    }
  };

  const handleRetry = async () => {
    if (lastLoginData && !isPending) {
      await retryLogin(lastLoginData);
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
        
        {/* 🔧 SIMPLIFIED: Single error display */}
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
                      disabled={isPending}
                      className="inline-flex items-center px-3 py-1 text-sm bg-white rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${isPending ? 'animate-spin' : ''}`} />
                      Erneut versuchen
                    </button>
                  </div>
                )}
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearLoginError}
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
                onClick={(e) => e.preventDefault()}
              >
                Passwort vergessen?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Wird angemeldet...
              </div>
            ) : (
              'Anmelden'
            )}
          </button>

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