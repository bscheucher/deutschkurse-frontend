// src/pages/KursEdit.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import kursService from '../services/kursService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import KursForm from '../components/forms/KursForm';
import { Kurs, CreateKursDto } from '../types/kurs.types';

const KursEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch the course data
  const { data: kurs, isPending: kursLoading, error } = useQuery({
    queryKey: ['kurs', id],
    queryFn: () => kursService.getKursById(Number(id)),
    enabled: !!id
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateKursDto> }) => 
      kursService.updateKurs(id, data),
    onSuccess: (updatedKurs) => {
      queryClient.invalidateQueries({ queryKey: ['kurse'] });
      queryClient.invalidateQueries({ queryKey: ['kurs', id] });
      toast.success('Kurs erfolgreich aktualisiert');
      // Navigate back to course details
      navigate(`/kurse/${id}`);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Fehler beim Aktualisieren des Kurses');
    }
  });

  // Helper function to convert form data to CreateKursDto
  const convertToCreateKursDto = (formData: Partial<Kurs>): CreateKursDto => {
  console.log('Converting form data to DTO:', formData);
  
  // Validate required fields exist
  if (!formData.kursName || !formData.kurstypId || !formData.kursraumId || 
      !formData.trainerId || !formData.startdatum || !formData.enddatum || 
      !formData.maxTeilnehmer || !formData.status) {
    console.error('Missing required fields:', {
      kursName: !!formData.kursName,
      kurstypId: !!formData.kurstypId,
      kursraumId: !!formData.kursraumId,
      trainerId: !!formData.trainerId,
      startdatum: !!formData.startdatum,
      enddatum: !!formData.enddatum,
      maxTeilnehmer: !!formData.maxTeilnehmer,
      status: !!formData.status
    });
    throw new Error('Required fields are missing');
  }

  // Convert IDs to numbers with validation
  const kurstypId = Number(formData.kurstypId);
  const kursraumId = Number(formData.kursraumId);
  const trainerId = Number(formData.trainerId);
  const maxTeilnehmer = Number(formData.maxTeilnehmer);

  // Validate that numeric conversions were successful
  if (isNaN(kurstypId) || kurstypId <= 0) {
    console.error('Invalid kurstypId:', formData.kurstypId);
    throw new Error('Ungültiger Kurstyp');
  }
  
  if (isNaN(kursraumId) || kursraumId <= 0) {
    console.error('Invalid kursraumId:', formData.kursraumId);
    throw new Error('Ungültiger Kursraum');
  }
  
  if (isNaN(trainerId) || trainerId <= 0) {
    console.error('Invalid trainerId:', formData.trainerId);
    throw new Error('Ungültiger Trainer');
  }
  
  if (isNaN(maxTeilnehmer) || maxTeilnehmer < 1) {
    console.error('Invalid maxTeilnehmer:', formData.maxTeilnehmer);
    throw new Error('Ungültige maximale Teilnehmerzahl');
  }

  // Validate status is one of the allowed values
  const validStatuses = ['geplant', 'laufend', 'abgeschlossen', 'abgebrochen'];
  if (!validStatuses.includes(formData.status)) {
    console.error('Invalid status:', formData.status);
    throw new Error('Ungültiger Status');
  }

  // Validate dates
  const startDate = new Date(formData.startdatum);
  const endDate = new Date(formData.enddatum);
  
  if (isNaN(startDate.getTime())) {
    console.error('Invalid startdatum:', formData.startdatum);
    throw new Error('Ungültiges Startdatum');
  }
  
  if (isNaN(endDate.getTime())) {
    console.error('Invalid enddatum:', formData.enddatum);
    throw new Error('Ungültiges Enddatum');
  }
  
  if (endDate < startDate) {
    console.error('End date before start date');
    throw new Error('Enddatum muss nach dem Startdatum liegen');
  }

  const dto: CreateKursDto = {
    kursName: formData.kursName.trim(),
    kurstypId,
    kursraumId,
    trainerId,
    startdatum: formData.startdatum,
    enddatum: formData.enddatum,
    maxTeilnehmer,
    status: formData.status,
    beschreibung: formData.beschreibung?.trim() || undefined
  };
  
  console.log('Successfully converted DTO:', dto);
  return dto;
};
  const handleSubmit = (data: Partial<Kurs>) => {
    console.log('KursEdit received form data:', data);
    
    try {
      const kursData = convertToCreateKursDto(data);
      console.log('Updating kurs with ID:', id, 'Data:', kursData);
      updateMutation.mutate({ id: Number(id), data: kursData });
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast.error(error.message || 'Fehler beim Verarbeiten der Formulardaten');
    }
  };

  const handleCancel = () => {
    navigate(`/kurse/${id}`);
  };

  if (kursLoading) {
    return <LoadingSpinner text="Lade Kursdaten..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/kurse')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zurück zur Übersicht
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            <h3 className="text-lg font-medium">Fehler beim Laden</h3>
            <p className="mt-2">Der Kurs konnte nicht gefunden werden oder es ist ein Fehler aufgetreten.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!kurs) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/kurse')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zurück zur Übersicht
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-yellow-800">
            <h3 className="text-lg font-medium">Kurs nicht gefunden</h3>
            <p className="mt-2">Der angeforderte Kurs existiert nicht oder Sie haben keine Berechtigung darauf zuzugreifen.</p>
          </div>
        </div>
      </div>
    );
  }

  const kursData = kurs as Kurs;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/kurse/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Zurück zu Kursdetails
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kurs bearbeiten</h1>
            <p className="text-gray-600 mt-1">
              Bearbeiten Sie die Details für: <strong>{kursData.kursName}</strong>
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Save className="w-4 h-4" />
            <span>Kurs-ID: {kursData.id}</span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <KursForm
            initialData={kursData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isPending={updateMutation.isPending}
          />
        </div>
      </div>

      {/* Course Info Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Aktuelle Kursinformationen</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Typ:</span>
            <div className="font-medium">{kursData.kurstypName}</div>
          </div>
          <div>
            <span className="text-gray-500">Trainer:</span>
            <div className="font-medium">{kursData.trainerName}</div>
          </div>
          <div>
            <span className="text-gray-500">Raum:</span>
            <div className="font-medium">{kursData.kursraumName}</div>
          </div>
          <div>
            <span className="text-gray-500">Teilnehmer:</span>
            <div className="font-medium">{kursData.aktuelleTeilnehmer} / {kursData.maxTeilnehmer}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KursEdit;