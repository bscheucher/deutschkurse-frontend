// src/components/forms/TeilnehmerForm.tsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale';
import { Teilnehmer } from '../../types/teilnehmer.types';
import LoadingSpinner from '../common/LoadingSpinner';

interface TeilnehmerFormProps {
  initialData: Teilnehmer | null;
  onSubmit: (data: Partial<Teilnehmer>) => void;
  onCancel: () => void;
  isPending?: boolean;
}

// Form data interface to match Teilnehmer types
interface TeilnehmerFormData {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  geburtsdatum: string;
  geschlecht: 'm' | 'w' | 'd' | '';
  staatsangehoerigkeit: string;
  muttersprache: string;
  aktiv: boolean;
}

// Helper function to convert Teilnehmer to form data
const teilnehmerToFormData = (teilnehmer: Teilnehmer | null): TeilnehmerFormData => {
  if (!teilnehmer) {
    return {
      vorname: '',
      nachname: '',
      email: '',
      telefon: '',
      geburtsdatum: '',
      geschlecht: '',
      staatsangehoerigkeit: '',
      muttersprache: '',
      aktiv: true,
    };
  }

  return {
    vorname: teilnehmer.vorname || '',
    nachname: teilnehmer.nachname || '',
    email: teilnehmer.email || '',
    telefon: teilnehmer.telefon || '',
    geburtsdatum: teilnehmer.geburtsdatum || '',
    geschlecht: teilnehmer.geschlecht || '',
    staatsangehoerigkeit: teilnehmer.staatsangehoerigkeit || '',
    muttersprache: teilnehmer.muttersprache || '',
    aktiv: teilnehmer.aktiv ?? true,
  };
};

const TeilnehmerForm: React.FC<TeilnehmerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isPending = false
}) => {
  const [formData, setFormData] = useState<TeilnehmerFormData>(() => teilnehmerToFormData(initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes
  useEffect(() => {
    console.log('TeilnehmerForm initialData changed:', initialData);
    setFormData(teilnehmerToFormData(initialData));
    setErrors({}); // Clear errors when form is reset
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vorname?.trim()) {
      newErrors.vorname = 'Vorname ist erforderlich';
    }

    if (!formData.nachname?.trim()) {
      newErrors.nachname = 'Nachname ist erforderlich';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    if (formData.telefon && !/^[\d\s\-\+\(\)]+$/.test(formData.telefon)) {
      newErrors.telefon = 'Ungültige Telefonnummer';
    }

    if (formData.geburtsdatum) {
      const birthDate = new Date(formData.geburtsdatum);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (isNaN(birthDate.getTime())) {
        newErrors.geburtsdatum = 'Ungültiges Datum';
      } else if (age < 14 || age > 100) {
        newErrors.geburtsdatum = 'Geburtsdatum liegt außerhalb des gültigen Bereichs';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('TeilnehmerForm submission data:', formData);
    
    if (validate()) {
      // Convert form data to Teilnehmer format
      const teilnehmerData: Partial<Teilnehmer> = {
        ...formData,
        geschlecht: formData.geschlecht || undefined, // Convert empty string to undefined
        telefon: formData.telefon || undefined,
        geburtsdatum: formData.geburtsdatum || undefined,
        staatsangehoerigkeit: formData.staatsangehoerigkeit || undefined,
        muttersprache: formData.muttersprache || undefined,
      };
      onSubmit(teilnehmerData);
    } else {
      console.log('Validation errors:', errors);
    }
  };

  const handleChange = (field: keyof TeilnehmerFormData, value: any) => {
    console.log(`Changing ${field} to:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Common countries for dropdown
  const countries = [
    'Deutschland', 'Afghanistan', 'Albanien', 'Algerien', 'Armenien', 'Aserbaidschan',
    'Bangladesch', 'Bosnien und Herzegowina', 'Bulgarien', 'Eritrea', 'Ghana',
    'Irak', 'Iran', 'Italien', 'Kosovo', 'Kroatien', 'Marokko', 'Nordmazedonien',
    'Nigeria', 'Pakistan', 'Polen', 'Rumänien', 'Russland', 'Serbien', 'Somalia',
    'Syrien', 'Türkei', 'Ukraine', 'Ungarn'
  ].sort();

  // Common languages for dropdown
  const languages = [
    'Arabisch', 'Albanisch', 'Armenisch', 'Aserbaidschanisch', 'Bengalisch',
    'Bosnisch', 'Bulgarisch', 'Dari', 'Deutsch', 'Englisch', 'Farsi/Persisch',
    'Französisch', 'Griechisch', 'Hausa', 'Italienisch', 'Kroatisch', 'Kurdisch',
    'Mazedonisch', 'Paschtu', 'Polnisch', 'Portugiesisch', 'Rumänisch',
    'Russisch', 'Serbisch', 'Somali', 'Spanisch', 'Tigrinya', 'Türkisch',
    'Ukrainisch', 'Ungarisch', 'Urdu'
  ].sort();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vorname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vorname *
          </label>
          <input
            type="text"
            value={formData.vorname}
            onChange={(e) => handleChange('vorname', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.vorname ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="z.B. Ahmad"
          />
          {errors.vorname && (
            <p className="mt-1 text-sm text-red-600">{errors.vorname}</p>
          )}
        </div>

        {/* Nachname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nachname *
          </label>
          <input
            type="text"
            value={formData.nachname}
            onChange={(e) => handleChange('nachname', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.nachname ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="z.B. Hassan"
          />
          {errors.nachname && (
            <p className="mt-1 text-sm text-red-600">{errors.nachname}</p>
          )}
        </div>

        {/* E-Mail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="z.B. ahmad.hassan@email.de"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon
          </label>
          <input
            type="tel"
            value={formData.telefon}
            onChange={(e) => handleChange('telefon', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.telefon ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="z.B. +49 30 12345678"
          />
          {errors.telefon && (
            <p className="mt-1 text-sm text-red-600">{errors.telefon}</p>
          )}
        </div>

        {/* Geburtsdatum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Geburtsdatum
          </label>
          <DatePicker
            selected={formData.geburtsdatum ? new Date(formData.geburtsdatum) : null}
            onChange={(date) => handleChange('geburtsdatum', date?.toISOString().split('T')[0] || '')}
            dateFormat="dd.MM.yyyy"
            locale={de}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.geburtsdatum ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholderText="Datum wählen"
            maxDate={new Date()}
            showYearDropdown
            yearDropdownItemNumber={50}
            scrollableYearDropdown
          />
          {errors.geburtsdatum && (
            <p className="mt-1 text-sm text-red-600">{errors.geburtsdatum}</p>
          )}
        </div>

        {/* Geschlecht */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Geschlecht
          </label>
          <select
            value={formData.geschlecht}
            onChange={(e) => handleChange('geschlecht', e.target.value as 'm' | 'w' | 'd' | '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Bitte wählen...</option>
            <option value="m">Männlich</option>
            <option value="w">Weiblich</option>
            <option value="d">Divers</option>
          </select>
        </div>

        {/* Staatsangehörigkeit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Staatsangehörigkeit
          </label>
          <select
            value={formData.staatsangehoerigkeit}
            onChange={(e) => handleChange('staatsangehoerigkeit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Bitte wählen...</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {/* Muttersprache */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Muttersprache
          </label>
          <select
            value={formData.muttersprache}
            onChange={(e) => handleChange('muttersprache', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Bitte wählen...</option>
            {languages.map(language => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
        </div>

        {/* Aktiv Status */}
        <div className="md:col-span-2">
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.aktiv}
                onChange={(e) => handleChange('aktiv', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Aktiv</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isPending ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Wird gespeichert...</span>
            </>
          ) : (
            initialData ? 'Aktualisieren' : 'Erstellen'
          )}
        </button>
      </div>
    </div>
  );
};

export default TeilnehmerForm;