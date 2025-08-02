// src/components/forms/KursForm.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale';
import { Kurs } from '../../types/kurs.types';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';

interface KursFormProps {
  initialData: Kurs | null;
  onSubmit: (data: Partial<Kurs>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const KursForm: React.FC<KursFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<Partial<Kurs>>({
    kursName: '',
    kurstypId: 1,
    kursraumId: 1,
    trainerId: 1,
    startdatum: new Date().toISOString().split('T')[0],
    enddatum: '',
    maxTeilnehmer: 12,
    status: 'geplant',
    beschreibung: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available trainers
  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: trainerService.getAllTrainer
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.kursName?.trim()) {
      newErrors.kursName = 'Kursname ist erforderlich';
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
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof Kurs, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Mock data for course types and rooms
  const kurstypen = [
    { id: 1, name: 'Deutsch A1' },
    { id: 2, name: 'Deutsch A2' },
    { id: 3, name: 'Deutsch B1' },
    { id: 4, name: 'Deutsch B2' },
    { id: 5, name: 'Deutsch C1' },
  ];

  const kursraeume = [
    { id: 1, name: 'Raum A101' },
    { id: 2, name: 'Raum A102' },
    { id: 3, name: 'Raum B201' },
    { id: 4, name: 'Raum B202' },
  ];

  return (
    <div className="space-y-6">
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
            onChange={(e) => handleChange('kurstypId', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {kurstypen.map(typ => (
              <option key={typ.id} value={typ.id}>{typ.name}</option>
            ))}
          </select>
        </div>

        {/* Kursraum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kursraum *
          </label>
          <select
            value={formData.kursraumId}
            onChange={(e) => handleChange('kursraumId', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {kursraeume.map(raum => (
              <option key={raum.id} value={raum.id}>{raum.name}</option>
            ))}
          </select>
        </div>

        {/* Trainer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trainer *
          </label>
          <select
            value={formData.trainerId}
            onChange={(e) => handleChange('trainerId', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {trainers?.map((trainer: any) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.vorname} {trainer.nachname}
              </option>
            ))}
          </select>
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
            minDate={new Date()}
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