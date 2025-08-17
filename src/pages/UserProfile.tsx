// src/pages/UserProfile.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  User as UserIcon, Settings, Shield, Clock, 
  Edit, Save, X 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UpdateProfileRequest } from '../services/authService';
import UserProfileForm from '../components/forms/UserProfileForm';
import LoadingSpinner from '../components/common/LoadingSpinner';

const UserProfile: React.FC = () => {
  const { user, checkAuth, updateProfile } = useAuth(); // Add updateProfile from context
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Update profile mutation - NOW uses AuthContext updateProfile function
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data), // Use AuthContext function
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      // The logout logic is now handled in AuthContext updateProfile
      setIsEditing(false);
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      // Error handling is already done in AuthContext updateProfile
    }
  });

  const handleProfileUpdate = (data: UpdateProfileRequest) => {
    console.log('UserProfile: Calling AuthContext updateProfile with data:', data);
    updateProfileMutation.mutate(data);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'TRAINER':
        return 'bg-purple-100 text-purple-800';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800';
      case 'USER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

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

  if (!user) {
    return <LoadingSpinner text="Lade Benutzerdaten..." />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              Mein Profil
            </h1>
            <p className="text-gray-600 mt-1">
              Verwalten Sie Ihre persönlichen Informationen und Einstellungen
            </p>
          </div>
          
          {!isEditing && (
            <button
              onClick={handleEditToggle}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Edit className="w-4 h-4 mr-2" />
              Bearbeiten
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                {isEditing ? 'Profil bearbeiten' : 'Profil-Informationen'}
              </h2>
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <UserProfileForm
                  initialData={user}
                  onSubmit={handleProfileUpdate}
                  onCancel={handleCancel}
                  isLoading={updateProfileMutation.isPending}
                />
              ) : (
                <div className="space-y-6">
                  {/* Basic Info Display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Benutzername
                      </label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {user.username}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        E-Mail
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.email}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Vorname
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.firstName || 'Nicht angegeben'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Nachname
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.lastName || 'Nicht angegeben'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Vollständiger Name
                      </label>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {user.fullName}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Rolle
                      </label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          <span className="mr-1">{getRoleIcon(user.role)}</span>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Konto-Status
                    </h3>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.enabled ? 'Aktiv' : 'Deaktiviert'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Account Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Konto-Details
            </h3>
            
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Benutzer-ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Erstellt am</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(user.createdAt), 'dd. MMM yyyy, HH:mm', { locale: de })}
                </dd>
              </div>
              
              {user.lastLogin && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Letzter Login</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(user.lastLogin), 'dd. MMM yyyy, HH:mm', { locale: de })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Security Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Sicherheit
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Passwort:</strong> Zuletzt aktualisiert
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Ihr Passwort entspricht den Sicherheitsrichtlinien
                </p>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="mb-2"><strong>Sicherheitshinweise:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Verwenden Sie ein starkes, eindeutiges Passwort</li>
                  <li>Teilen Sie Ihre Anmeldedaten niemals mit anderen</li>
                  <li>Melden Sie sich nach der Nutzung ab</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {!isEditing && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Schnell-Aktionen
              </h3>
              
              <div className="space-y-3">
                <button 
                  onClick={handleEditToggle}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Profil bearbeiten
                </button>
                
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  <Shield className="w-4 h-4 mr-2" />
                  Sicherheitseinstellungen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;