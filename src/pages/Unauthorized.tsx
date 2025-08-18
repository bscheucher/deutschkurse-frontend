// src/pages/Unauthorized.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Home, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Try to get the attempted path from state or location
  const attemptedPath = location.state?.from || location.pathname;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'TRAINER':
        return 'Trainer';
      case 'STAFF':
        return 'Mitarbeiter';
      case 'USER':
        return 'Benutzer';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'text-red-600 bg-red-100';
      case 'TRAINER':
        return 'text-purple-600 bg-purple-100';
      case 'STAFF':
        return 'text-blue-600 bg-blue-100';
      case 'USER':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRequiredRoleHint = (path: string): string[] => {
    // Map paths to required roles based on your routing configuration
    if (path?.includes('/users')) return ['ADMIN'];
    if (path?.includes('/trainer')) return ['ADMIN', 'STAFF'];
    if (path?.includes('/anwesenheit')) return ['ADMIN', 'TRAINER'];
    if (path?.includes('/kurse')) return ['ADMIN', 'TRAINER', 'STAFF'];
    if (path?.includes('/teilnehmer')) return ['ADMIN', 'TRAINER', 'STAFF'];
    if (path?.includes('/stundenplan')) return ['ADMIN', 'TRAINER', 'STAFF'];
    return [];
  };

  const requiredRoles = getRequiredRoleHint(attemptedPath);

  const handleGoBack = () => {
    // Go back to previous page if possible, otherwise to dashboard
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleContactAdmin = () => {
    // You could implement a contact form or mailto link here
    window.location.href = 'mailto:bernhard.scheucher@gmail.com?subject=Zugriffsanfrage';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Icon and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
            <ShieldOff className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zugriff verweigert
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sie haben keine Berechtigung, diese Seite zu besuchen.
          </p>
        </div>

        {/* Error Details Card */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          {/* Warning Message */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Diese Seite erfordert erweiterte Berechtigungen, die Ihrem Konto nicht zugewiesen sind.
                </p>
              </div>
            </div>
          </div>

          {/* Role Information */}
          {user && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Ihre aktuelle Rolle:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </span>
              </div>

              {requiredRoles.length > 0 && (
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-gray-500">Erforderliche Rolle(n):</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {requiredRoles.map((role) => (
                      <span
                        key={role}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                      >
                        {getRoleDisplayName(role)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {attemptedPath && attemptedPath !== '/unauthorized' && (
                <div className="pt-3 border-t">
                  <div className="flex items-center text-sm text-gray-500">
                    <Lock className="h-4 w-4 mr-2" />
                    <span className="truncate">Versuchter Zugriff: {attemptedPath}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Helpful Information */}
          <div className="bg-blue-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Was können Sie tun?</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Kehren Sie zur vorherigen Seite zurück</li>
              <li>Navigieren Sie zum Dashboard</li>
              <li>Kontaktieren Sie einen Administrator für erweiterte Berechtigungen</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="group relative w-full flex justify-center items-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur vorherigen Seite
          </button>

          <button
            onClick={handleGoHome}
            className="group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="w-4 h-4 mr-2" />
            Zum Dashboard
          </button>

          <button
            onClick={handleContactAdmin}
            className="group relative w-full flex justify-center items-center py-2 px-4 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Administrator kontaktieren
          </button>
        </div>

        {/* Footer Information */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Fehlercode: 403 • {new Date().toLocaleString('de-DE')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;