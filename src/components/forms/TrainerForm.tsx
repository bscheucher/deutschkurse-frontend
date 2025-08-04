// src/components/forms/TrainerForm.tsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale';
import { Trainer } from '../../types/trainer.types';
import LoadingSpinner from '../common/LoadingSpinner';

interface TrainerFormProps {
  initialData: Trainer | null;
  onSubmit: (data: Partial<Trainer>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TrainerForm: React.FC<TrainerFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<Partial<Trainer>>({
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
    abteilungId: 1,
    status: 'verfuegbar',
    qualifikationen: '',
    einstellungsdatum: new Date().toISOString().split('T')[0],
    aktiv: true,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.abteilungId || formData.abteilungId < 1) {
      newErrors.abteilungId = 'Abteilung ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof Trainer, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Mock data for departments - in a real app, this would come from an API
  const abteilungen = [
    { id: 1, name: 'Sprachkurse Deutsch' },
    { id: 2, name: 'Integrationskurse' },
    { id: 3, name: 'Berufssprachkurse' },
    { id: 4, name: 'Alphabetisierung' },
    { id: 5, name: 'Prüfungsvorbereitung' },
  ];

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
            placeholder="z.B. Maria"
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
            placeholder="z.B. Müller"
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
            placeholder="z.B. maria.mueller@deutschkurse.de"
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

        {/* Abteilung */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Abteilung *
          </label>
          <select
            value={formData.abteilungId}
            onChange={(e) => handleChange('abteilungId', Number(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.abteilungId ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {abteilungen.map(abteilung => (
              <option key={abteilung.id} value={abteilung.id}>{abteilung.name}</option>
            ))}
          </select>
          {errors.abteilungId && (
            <p className="mt-1 text-sm text-red-600">{errors.abteilungId}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="verfuegbar">Verfügbar</option>
            <option value="im_einsatz">Im Einsatz</option>
            <option value="abwesend">Abwesend</option>
          </select>
        </div>

        {/* Einstellungsdatum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Einstellungsdatum
          </label>
          <DatePicker
            selected={formData.einstellungsdatum ? new Date(formData.einstellungsdatum) : null}
            onChange={(date) => handleChange('einstellungsdatum', date?.toISOString().split('T')[0] || '')}
            dateFormat="dd.MM.yyyy"
            locale={de}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholderText="Datum wählen"
            maxDate={new Date()}
          />
        </div>

        {/* Aktiv Status */}
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

        {/* Qualifikationen */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Qualifikationen
          </label>
          <textarea
            value={formData.qualifikationen}
            onChange={(e) => handleChange('qualifikationen', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="z.B. DaF-Zertifikat, BAMF-Zulassung, Prüferlizenz telc B1-B2..."
          />
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
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isLoading ? (
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

export default TrainerForm;