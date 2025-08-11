// src/components/forms/KursForm.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale';
import { Kurs } from '../../types/kurs.types';
import trainerService from '../../services/trainerService';
import kurstypService from '../../services/kurstypService'
import LoadingSpinner from '../common/LoadingSpinner';

interface KursFormProps {
  initialData: Kurs | null;
  onSubmit: (data: Partial<Kurs>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Helper function to convert Kurs to form data
const kursToFormData = (kurs: Kurs | null) => {
  if (!kurs) {
    return {
      kursName: '',
      kurstypId: '',
      kursraumId: '',
      trainerId: '',
      startdatum: new Date().toISOString().split('T')[0],
      enddatum: '',
      maxTeilnehmer: 12,
      status: 'geplant' as const,
      beschreibung: '',
    };
  }

  return {
    kursName: kurs.kursName || '',
    kurstypId: kurs.kurstypId || '',
    kursraumId: kurs.kursraumId || '',
    trainerId: kurs.trainerId || '',
    startdatum: kurs.startdatum ? kurs.startdatum.split('T')[0] : new Date().toISOString().split('T')[0],
    enddatum: kurs.enddatum ? kurs.enddatum.split('T')[0] : '',
    maxTeilnehmer: kurs.maxTeilnehmer || 12,
    status: kurs.status || 'geplant' as const,
    beschreibung: kurs.beschreibung || '',
  };
};

const KursForm: React.FC<KursFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState(() => kursToFormData(initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes
  useEffect(() => {
    console.log('Form initialData changed:', initialData);
    setFormData(kursToFormData(initialData));
    setErrors({}); // Clear errors when form is reset
  }, [initialData]);

  // Fetch available trainers
  const { data: trainers, isLoading: trainersLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: trainerService.getAllTrainer
  });

  // Fetch course types - try API first, fall back to extraction from kurse
  const { data: kurstypen, isLoading: kurstypenLoading } = useQuery({
    queryKey: ['kurstypen'],
    queryFn: kurstypService.getKurstypenFromKurse
  });

  // Fetch course rooms - try API first, fall back to extraction from kurse
  const { data: kursraeume, isLoading: kursrauemeLoading } = useQuery({
    queryKey: ['kursraeume'],
    queryFn: kurstypService.getKursrauemeFromKurse
  });

  // Extract unique course types and rooms from existing data
  const getUniqueKurstypen = () => {
    return kurstypen || [];
  };

  const getUniqueKursraeume = () => {
    return kursraeume || [];
  };

  const kurstypenOptions = getUniqueKurstypen();
  const kursrauemeOptions = getUniqueKursraeume();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.kursName?.trim()) {
      newErrors.kursName = 'Kursname ist erforderlich';
    }

    if (!formData.kurstypId) {
      newErrors.kurstypId = 'Kurstyp ist erforderlich';
    }

    if (!formData.kursraumId) {
      newErrors.kursraumId = 'Kursraum ist erforderlich';
    }

    if (!formData.trainerId) {
      newErrors.trainerId = 'Trainer ist erforderlich';
    }

    if (!formData.startdatum) {
      newErrors.startdatum = 'Startdatum ist erforderlich';
    }

    if (!formData.enddatum) {
      newErrors.enddatum = 'Enddatum ist erforderlich';
    } else if (formData.startdatum && formData.enddatum < formData.startdatum) {
      newErrors.enddatum = 'Enddatum muss nach dem Startdatum liegen';
    }

    if (!formData.maxTeilnehmer || formData.maxTeilnehmer < 1) {
      newErrors.maxTeilnehmer = 'Maximale Teilnehmerzahl muss mindestens 1 sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission data:', formData);
    
    if (validate()) {
      // Convert string IDs back to numbers for submission
      const submitData = {
        ...formData,
        kurstypId: Number(formData.kurstypId),
        kursraumId: Number(formData.kursraumId),
        trainerId: Number(formData.trainerId),
      };
      console.log('Submitting data:', submitData);
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

  if (trainersLoading || kurstypenLoading || kursrauemeLoading) {
    return <LoadingSpinner text="Lade Formulardaten..." />;
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-gray-50 p-3 rounded text-xs">
        <strong>Debug:</strong> Editing: {initialData ? `ID ${initialData.id}` : 'New'} | 
        Form kurstypId: {formData.kurstypId} | 
        Form trainerId: {formData.trainerId} |
        Available Kurstypen: {kurstypenOptions.length} |
        Available Kursraeume: {kursrauemeOptions.length} |
        Available Trainers: {trainers?.length || 0}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kursname */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kursname *
          </label>
          <input
            type="text"
            value={formData.kursName}
            onChange={(e) => handleChange('kursName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.kursName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="z.B. Deutsch A1 - Anfänger Morgens"
          />
          {errors.kursName && (
            <p className="mt-1 text-sm text-red-600">{errors.kursName}</p>
          )}
        </div>

        {/* Kurstyp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kurstyp *
          </label>
          <select
            value={formData.kurstypId}
            onChange={(e) => handleChange('kurstypId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.kurstypId ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Bitte wählen...</option>
            {kurstypenOptions.map(typ => (
              <option key={typ.id} value={typ.id}>{typ.name}</option>
            ))}
          </select>
          {errors.kurstypId && (
            <p className="mt-1 text-sm text-red-600">{errors.kurstypId}</p>
          )}
        </div>

        {/* Kursraum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kursraum *
          </label>
          <select
            value={formData.kursraumId}
            onChange={(e) => handleChange('kursraumId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.kursraumId ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Bitte wählen...</option>
            {kursrauemeOptions.map(raum => (
              <option key={raum.id} value={raum.id}>{raum.name}</option>
            ))}
          </select>
          {errors.kursraumId && (
            <p className="mt-1 text-sm text-red-600">{errors.kursraumId}</p>
          )}
        </div>

        {/* Trainer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trainer *
          </label>
          <select
            value={formData.trainerId}
            onChange={(e) => handleChange('trainerId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.trainerId ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Bitte wählen...</option>
            {trainers?.map((trainer: any) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.vorname} {trainer.nachname}
              </option>
            ))}
          </select>
          {errors.trainerId && (
            <p className="mt-1 text-sm text-red-600">{errors.trainerId}</p>
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
            <option value="geplant">Geplant</option>
            <option value="laufend">Laufend</option>
            <option value="abgeschlossen">Abgeschlossen</option>
            <option value="abgebrochen">Abgebrochen</option>
          </select>
        </div>

        {/* Startdatum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Startdatum *
          </label>
          <DatePicker
            selected={formData.startdatum ? new Date(formData.startdatum) : null}
            onChange={(date) => handleChange('startdatum', date?.toISOString().split('T')[0] || '')}
            dateFormat="dd.MM.yyyy"
            locale={de}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.startdatum ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholderText="Datum wählen"
            minDate={initialData ? undefined : new Date()} // Don't restrict past dates when editing
          />
          {errors.startdatum && (
            <p className="mt-1 text-sm text-red-600">{errors.startdatum}</p>
          )}
        </div>

        {/* Enddatum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enddatum *
          </label>
          <DatePicker
            selected={formData.enddatum ? new Date(formData.enddatum) : null}
            onChange={(date) => handleChange('enddatum', date?.toISOString().split('T')[0] || '')}
            dateFormat="dd.MM.yyyy"
            locale={de}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.enddatum ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholderText="Datum wählen"
            minDate={formData.startdatum ? new Date(formData.startdatum) : new Date()}
          />
          {errors.enddatum && (
            <p className="mt-1 text-sm text-red-600">{errors.enddatum}</p>
          )}
        </div>

        {/* Max Teilnehmer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max. Teilnehmer *
          </label>
          <input
            type="number"
            value={formData.maxTeilnehmer}
            onChange={(e) => handleChange('maxTeilnehmer', Number(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              errors.maxTeilnehmer ? 'border-red-300' : 'border-gray-300'
            }`}
            min="1"
            max="50"
          />
          {errors.maxTeilnehmer && (
            <p className="mt-1 text-sm text-red-600">{errors.maxTeilnehmer}</p>
          )}
        </div>

        {/* Beschreibung */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beschreibung
          </label>
          <textarea
            value={formData.beschreibung}
            onChange={(e) => handleChange('beschreibung', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optionale Kursbeschreibung..."
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

export default KursForm;