// src/components/forms/StundenplanForm.tsx
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Stundenplan, CreateStundenplanDto } from '../../types/stundenplan.types';
import LoadingSpinner from '../common/LoadingSpinner';

interface StundenplanFormProps {
  initialData: Stundenplan | null;
  kursId: number;
  kursName: string;
  onSubmit: (data: CreateStundenplanDto) => void;
  onCancel: () => void;
  isPending?: boolean;
}

// Helper function to convert time from HH:MM:SS to HH:MM
const formatTimeForInput = (time: string): string => {
  if (!time) return '';
  // If already in HH:MM format, return as is
  if (time.match(/^\d{2}:\d{2}$/)) return time;
  // If in HH:MM:SS format, remove seconds
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time.substring(0, 5);
  return time;
};

// Helper function to convert time from HH:MM to HH:MM:SS
const formatTimeForBackend = (time: string): string => {
  if (!time) return '';
  // If already in HH:MM:SS format, return as is
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time;
  // If in HH:MM format, add seconds
  if (time.match(/^\d{2}:\d{2}$/)) return `${time}:00`;
  return time;
};

const stundenplanToFormData = (stundenplan: Stundenplan | null, kursId: number) => {
  if (!stundenplan) {
    return {
      kursId,
      wochentag: 'Montag' as const,
      startzeit: '09:00',
      endzeit: '12:00',
      bemerkungen: '',
      aktiv: true,
    };
  }

  return {
    kursId: stundenplan.kursId,
    wochentag: stundenplan.wochentag,
    startzeit: formatTimeForInput(stundenplan.startzeit),
    endzeit: formatTimeForInput(stundenplan.endzeit),
    bemerkungen: stundenplan.bemerkungen || '',
    aktiv: stundenplan.aktiv,
  };
};

const StundenplanForm: React.FC<StundenplanFormProps> = ({
  initialData,
  kursId,
  kursName,
  onSubmit,
  onCancel,
  isPending = false
}) => {
  const [formData, setFormData] = useState(() => stundenplanToFormData(initialData, kursId));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(stundenplanToFormData(initialData, kursId));
    setErrors({});
  }, [initialData, kursId]);

  const weekdays = [
    { value: 'Montag', label: 'Montag' },
    { value: 'Dienstag', label: 'Dienstag' },
    { value: 'Mittwoch', label: 'Mittwoch' },
    { value: 'Donnerstag', label: 'Donnerstag' },
    { value: 'Freitag', label: 'Freitag' },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.wochentag) {
      newErrors.wochentag = 'Wochentag ist erforderlich';
    }

    if (!formData.startzeit) {
      newErrors.startzeit = 'Startzeit ist erforderlich';
    }

    if (!formData.endzeit) {
      newErrors.endzeit = 'Endzeit ist erforderlich';
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (formData.startzeit && !timeRegex.test(formData.startzeit)) {
      newErrors.startzeit = 'Ungültiges Zeitformat (HH:MM)';
    }

    if (formData.endzeit && !timeRegex.test(formData.endzeit)) {
      newErrors.endzeit = 'Ungültiges Zeitformat (HH:MM)';
    }

    // Validate time range
    if (formData.startzeit && formData.endzeit && formData.startzeit >= formData.endzeit) {
      newErrors.endzeit = 'Endzeit muss nach der Startzeit liegen';
    }

    // Validate time range is reasonable (between 6:00 and 22:00)
    if (formData.startzeit) {
      const [hours] = formData.startzeit.split(':').map(Number);
      if (hours < 6 || hours > 22) {
        newErrors.startzeit = 'Startzeit sollte zwischen 06:00 und 22:00 liegen';
      }
    }

    if (formData.endzeit) {
      const [hours] = formData.endzeit.split(':').map(Number);
      if (hours < 6 || hours > 22) {
        newErrors.endzeit = 'Endzeit sollte zwischen 06:00 und 22:00 liegen';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Stundenplan form submission:', formData);

    if (validate()) {
      const submitData: CreateStundenplanDto = {
        kursId: formData.kursId,
        wochentag: formData.wochentag,
        startzeit: formatTimeForBackend(formData.startzeit),
        endzeit: formatTimeForBackend(formData.endzeit),
        bemerkungen: formData.bemerkungen || undefined,
        aktiv: formData.aktiv,
      };

      console.log('Submitting stundenplan data:', submitData);
      onSubmit(submitData);
    } else {
      console.log('Validation errors:', errors);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    console.log(`Changing ${field} to:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-1">
          {initialData ? 'Stundenplan bearbeiten' : 'Neuer Stundenplan'}
        </h3>
        <p className="text-sm text-blue-700">
          <strong>Kurs:</strong> {kursName}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wochentag */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wochentag *
          </label>
          <select
            value={formData.wochentag}
            onChange={(e) => handleChange('wochentag', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.wochentag ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {weekdays.map(day => (
              <option key={day.value} value={day.value}>{day.label}</option>
            ))}
          </select>
          {errors.wochentag && (
            <p className="mt-1 text-sm text-red-600">{errors.wochentag}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
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

        {/* Startzeit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Startzeit *
          </label>
          <div className="relative">
            <input
              type="time"
              value={formData.startzeit}
              onChange={(e) => handleChange('startzeit', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.startzeit ? 'border-red-300' : 'border-gray-300'
              }`}
              min="06:00"
              max="22:00"
              step="300" // 5-minute intervals
            />
            <Clock className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          {errors.startzeit && (
            <p className="mt-1 text-sm text-red-600">{errors.startzeit}</p>
          )}
        </div>

        {/* Endzeit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Endzeit *
          </label>
          <div className="relative">
            <input
              type="time"
              value={formData.endzeit}
              onChange={(e) => handleChange('endzeit', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.endzeit ? 'border-red-300' : 'border-gray-300'
              }`}
              min="06:00"
              max="22:00"
              step="300" // 5-minute intervals
            />
            <Clock className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          {errors.endzeit && (
            <p className="mt-1 text-sm text-red-600">{errors.endzeit}</p>
          )}
        </div>

        {/* Bemerkungen */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bemerkungen
          </label>
          <textarea
            value={formData.bemerkungen}
            onChange={(e) => handleChange('bemerkungen', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optionale Bemerkungen zum Stundenplan..."
          />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Vorschau</h4>
        <div className="text-sm text-gray-700">
          <span className="font-medium">{formData.wochentag}</span>: {formData.startzeit} - {formData.endzeit}
          {formData.bemerkungen && (
            <span className="text-gray-500 ml-2">({formData.bemerkungen})</span>
          )}
          {!formData.aktiv && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Inaktiv
            </span>
          )}
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

export default StundenplanForm;