import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { CreateKursDto, KursStatus } from '../../types/kurs.types';
import { X } from 'lucide-react';

interface KursFormProps {
  onSubmit: (data: CreateKursDto) => Promise<void>;
  onClose: () => void;
  initialData?: Partial<CreateKursDto>;
  isEdit?: boolean;
}

const schema = yup.object({
  kursName: yup.string().required('Kursname ist erforderlich').max(200),
  kurstypId: yup.number().required('Kurstyp ist erforderlich').positive(),
  kursraumId: yup.number().required('Kursraum ist erforderlich').positive(),
  trainerId: yup.number().required('Trainer ist erforderlich').positive(),
  startdatum: yup.date().required('Startdatum ist erforderlich')
    .min(new Date(), 'Startdatum muss in der Zukunft liegen'),
  enddatum: yup.date().required('Enddatum ist erforderlich')
    .when('startdatum', (startdatum, schema) => {
      return schema.min(startdatum, 'Enddatum muss nach dem Startdatum liegen');
    }),
  maxTeilnehmer: yup.number().required('Max. Teilnehmer ist erforderlich')
    .positive().max(50, 'Maximal 50 Teilnehmer erlaubt'),
  status: yup.string().oneOf(['geplant', 'laufend', 'abgeschlossen', 'abgebrochen']).required(),
  beschreibung: yup.string().max(1000, 'Beschreibung darf maximal 1000 Zeichen lang sein'),
});

const KursForm: React.FC<KursFormProps> = ({ onSubmit, onClose, initialData, isEdit }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CreateKursDto>({
    resolver: yupResolver(schema),
    defaultValues: {
      status: 'geplant',
      maxTeilnehmer: 12,
      ...initialData,
    },
  });

  const startdatum = watch('startdatum');

  const handleFormSubmit = async (data: CreateKursDto) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Kurs bearbeiten' : 'Neuer Kurs'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Kursname
              </label>
              <input
                {...register('kursName')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.kursName && (
                <p className="mt-1 text-sm text-red-600">{errors.kursName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kurstyp
              </label>
              <select
                {...register('kurstypId')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Bitte wählen</option>
                <option value="1">Deutsch A1</option>
                <option value="2">Deutsch A2</option>
                <option value="3">Deutsch B1</option>
                <option value="4">Deutsch B2</option>
              </select>
              {errors.kurstypId && (
                <p className="mt-1 text-sm text-red-600">{errors.kurstypId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kursraum
              </label>
              <select
                {...register('kursraumId')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Bitte wählen</option>
                <option value="1">Raum A101</option>
                <option value="2">Raum A102</option>
                <option value="3">Raum B201</option>
              </select>
              {errors.kursraumId && (
                <p className="mt-1 text-sm text-red-600">{errors.kursraumId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Trainer
              </label>
              <select
                {...register('trainerId')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Bitte wählen</option>
                <option value="1">Maria Schmidt</option>
                <option value="2">Thomas Weber</option>
                <option value="3">Anna Müller</option>
              </select>
              {errors.trainerId && (
                <p className="mt-1 text-sm text-red-600">{errors.trainerId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Startdatum
              </label>
              <Controller
                control={control}
                name="startdatum"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value ? new Date(field.value) : null}
                    onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                    minDate={new Date()}
                    dateFormat="dd.MM.yyyy"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholderText="Datum wählen"
                  />
                )}
              />
              {errors.startdatum && (
                <p className="mt-1 text-sm text-red-600">{errors.startdatum.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enddatum
              </label>
              <Controller
                control={control}
                name="enddatum"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value ? new Date(field.value) : null}
                    onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                    minDate={startdatum ? new Date(startdatum) : new Date()}
                    dateFormat="dd.MM.yyyy"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholderText="Datum wählen"
                  />
                )}
              />
              {errors.enddatum && (
                <p className="mt-1 text-sm text-red-600">{errors.enddatum.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max. Teilnehmer
              </label>
              <input
                {...register('maxTeilnehmer', { valueAsNumber: true })}
                type="number"
                min="1"
                max="50"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.maxTeilnehmer && (
                <p className="mt-1 text-sm text-red-600">{errors.maxTeilnehmer.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                {...register('status')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="geplant">Geplant</option>
                <option value="laufend">Laufend</option>
                <option value="abgeschlossen">Abgeschlossen</option>
                <option value="abgebrochen">Abgebrochen</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Beschreibung
              </label>
              <textarea
                {...register('beschreibung')}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optionale Kursbeschreibung..."
              />
              {errors.beschreibung && (
                <p className="mt-1 text-sm text-red-600">{errors.beschreibung.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Wird gespeichert...' : (isEdit ? 'Aktualisieren' : 'Erstellen')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KursForm;