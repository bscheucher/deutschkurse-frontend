// src/pages/TeilnehmerNew.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, UserPlus } from 'lucide-react';
import teilnehmerService from '../services/teilnehmerService';
import TeilnehmerForm from '../components/forms/TeilnehmerForm';
import { Teilnehmer, CreateTeilnehmerDto } from '../types/teilnehmer.types';

const TeilnehmerNew: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTeilnehmerDto) => teilnehmerService.createTeilnehmer(data),
    onSuccess: (newTeilnehmer) => {
      queryClient.invalidateQueries({ queryKey: ['teilnehmer'] });
      toast.success('Teilnehmer erfolgreich erstellt');
      // Navigate to the new participant's details page or back to list
      navigate(`/teilnehmer/${newTeilnehmer.id}`);
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'Fehler beim Erstellen des Teilnehmers');
    }
  });

  // Helper function to convert form data to CreateTeilnehmerDto
  const convertToCreateTeilnehmerDto = (formData: Partial<Teilnehmer>): CreateTeilnehmerDto => {
    console.log('Converting form data to DTO:', formData);
    
    if (!formData.vorname || !formData.nachname || !formData.email) {
      console.error('Missing required fields:', {
        vorname: !!formData.vorname,
        nachname: !!formData.nachname,
        email: !!formData.email
      });
      throw new Error('Required fields are missing');
    }

    const dto: CreateTeilnehmerDto = {
      vorname: formData.vorname,
      nachname: formData.nachname,
      email: formData.email,
      telefon: formData.telefon || undefined,
      geburtsdatum: formData.geburtsdatum || undefined,
      geschlecht: formData.geschlecht || undefined,
      staatsangehoerigkeit: formData.staatsangehoerigkeit || undefined,
      muttersprache: formData.muttersprache || undefined,
      aktiv: formData.aktiv ?? true
    };
    
    console.log('Converted DTO:', dto);
    return dto;
  };

  const handleSubmit = (data: Partial<Teilnehmer>) => {
    console.log('TeilnehmerNew received form data:', data);
    
    try {
      const teilnehmerData = convertToCreateTeilnehmerDto(data);
      console.log('Creating new teilnehmer with data:', teilnehmerData);
      createMutation.mutate(teilnehmerData);
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast.error(error.message || 'Fehler beim Verarbeiten der Formulardaten');
    }
  };

  const handleCancel = () => {
    navigate('/teilnehmer');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/teilnehmer')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Zurück zur Übersicht
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Neuer Teilnehmer</h1>
            <p className="text-gray-600 mt-1">
              Erstellen Sie einen neuen Teilnehmer für die Deutschkurse
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <UserPlus className="w-4 h-4" />
            <span>Neu erstellen</span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <TeilnehmerForm
            initialData={null}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createMutation.isPending}
          />
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Hinweise</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Felder mit * sind Pflichtfelder</li>
          <li>• Die E-Mail-Adresse muss eindeutig sein</li>
          <li>• Telefonnummer ist optional, aber empfohlen für die Kommunikation</li>
          <li>• Das Geburtsdatum wird für Statistiken und Altersgruppen verwendet</li>
          <li>• Nach dem Erstellen kann der Teilnehmer zu Kursen hinzugefügt werden</li>
        </ul>
      </div>
    </div>
  );
};

export default TeilnehmerNew;