// src/pages/TeilnehmerDetails.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Edit, Trash2, Mail, Phone, Calendar, 
  User, MapPin, Globe, Languages, Plus, BookOpen 
} from 'lucide-react';
import teilnehmerService from '../services/teilnehmerService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import TeilnehmerForm from '../components/forms/TeilnehmerForm';
import { Teilnehmer, CreateTeilnehmerDto } from '../types/teilnehmer.types';
import { Kurs } from '../types/kurs.types';

const TeilnehmerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch participant data
  const { data: teilnehmer, isPending: teilnehmerLoading, error: teilnehmerError } = useQuery({
    queryKey: ['teilnehmer', id],
    queryFn: () => teilnehmerService.getTeilnehmerById(Number(id)),
    enabled: !!id
  });

  // Fetch courses for this participant
  const { data: kurse, isPending: kurseLoading } = useQuery({
    queryKey: ['teilnehmerKurse', id],
    queryFn: () => teilnehmerService.getKurseForTeilnehmer(Number(id)),
    enabled: !!id
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTeilnehmerDto> }) => 
      teilnehmerService.updateTeilnehmer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teilnehmer'] });
      queryClient.invalidateQueries({ queryKey: ['teilnehmer', id] });
      toast.success('Teilnehmer erfolgreich aktualisiert');
      setShowEditModal(false);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Fehler beim Aktualisieren des Teilnehmers');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => teilnehmerService.deleteTeilnehmer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teilnehmer'] });
      toast.success('Teilnehmer erfolgreich gelöscht');
      navigate('/teilnehmer');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Fehler beim Löschen des Teilnehmers');
    }
  });

  // Helper function to convert form data to CreateTeilnehmerDto
  const convertToCreateTeilnehmerDto = (formData: Partial<Teilnehmer>): CreateTeilnehmerDto => {
    return {
      vorname: formData.vorname!,
      nachname: formData.nachname!,
      email: formData.email!,
      telefon: formData.telefon || undefined,
      geburtsdatum: formData.geburtsdatum || undefined,
      geschlecht: formData.geschlecht || undefined,
      staatsangehoerigkeit: formData.staatsangehoerigkeit || undefined,
      muttersprache: formData.muttersprache || undefined,
      aktiv: formData.aktiv ?? true
    };
  };

  const handleUpdate = (data: Partial<Teilnehmer>) => {
    console.log('Updating teilnehmer with data:', data);
    
    try {
      const teilnehmerData = convertToCreateTeilnehmerDto(data);
      console.log('Update DTO:', teilnehmerData);
      updateMutation.mutate({ id: Number(id), data: teilnehmerData });
    } catch (error: any) {
      console.error('Error in handleUpdate:', error);
      toast.error(error.message || 'Fehler beim Verarbeiten der Formulardaten');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Möchten Sie diesen Teilnehmer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      deleteMutation.mutate(Number(id));
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const getGenderText = (geschlecht?: string) => {
    switch (geschlecht) {
      case 'm': return 'Männlich';
      case 'w': return 'Weiblich';
      case 'd': return 'Divers';
      default: return 'Nicht angegeben';
    }
  };

  const calculateAge = (birthDate?: string): string => {
    if (!birthDate) return 'Nicht angegeben';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return `${age - 1} Jahre`;
    }
    
    return `${age} Jahre`;
  };

  if (teilnehmerLoading) return <LoadingSpinner text="Lade Teilnehmerdaten..." />;
  
  if (teilnehmerError || !teilnehmer) {
    return (
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/teilnehmer')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Zurück zur Übersicht
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            <h3 className="text-lg font-medium">Teilnehmer nicht gefunden</h3>
            <p className="mt-2">Der angeforderte Teilnehmer existiert nicht oder es ist ein Fehler aufgetreten.</p>
          </div>
        </div>
      </div>
    );
  }

  const teilnehmerData = teilnehmer as Teilnehmer;
  const kurseList = kurse as Kurs[] | undefined;

  return (
    <div>
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
            <h1 className="text-2xl font-bold text-gray-900">
              {teilnehmerData.vorname} {teilnehmerData.nachname}
            </h1>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                teilnehmerData.aktiv 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {teilnehmerData.aktiv ? 'Aktiv' : 'Inaktiv'}
              </span>
              <span className="text-sm text-gray-500">
                ID: {teilnehmerData.id}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Edit className="w-4 h-4 mr-2" />
              Bearbeiten
            </button>
            <button 
              onClick={handleDelete}
              className="flex items-center px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Persönliche Informationen</h2>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Vollständiger Name</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  {teilnehmerData.vorname} {teilnehmerData.nachname}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`mailto:${teilnehmerData.email}`} className="text-blue-600 hover:text-blue-800">
                    {teilnehmerData.email}
                  </a>
                </dd>
              </div>
              
              {teilnehmerData.telefon && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`tel:${teilnehmerData.telefon}`} className="text-blue-600 hover:text-blue-800">
                      {teilnehmerData.telefon}
                    </a>
                  </dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Geschlecht</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {getGenderText(teilnehmerData.geschlecht)}
                </dd>
              </div>
              
              {teilnehmerData.geburtsdatum && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Geburtsdatum / Alter</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {format(new Date(teilnehmerData.geburtsdatum), 'dd. MMM yyyy', { locale: de })} 
                    <span className="ml-2 text-gray-500">({calculateAge(teilnehmerData.geburtsdatum)})</span>
                  </dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Anmeldedatum</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {format(new Date(teilnehmerData.anmeldedatum), 'dd. MMM yyyy', { locale: de })}
                </dd>
              </div>
              
              {teilnehmerData.staatsangehoerigkeit && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Staatsangehörigkeit</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-gray-400" />
                    {teilnehmerData.staatsangehoerigkeit}
                  </dd>
                </div>
              )}
              
              {teilnehmerData.muttersprache && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Muttersprache</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <Languages className="w-4 h-4 mr-2 text-gray-400" />
                    {teilnehmerData.muttersprache}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Courses */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Eingeschriebene Kurse ({kurseList?.length || 0})
                </h2>
                <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Zu Kurs hinzufügen
                </button>
              </div>
            </div>
            
            {kurseLoading ? (
              <div className="p-6">
                <LoadingSpinner text="Lade Kurse..." />
              </div>
            ) : kurseList && kurseList.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {kurseList.map((kurs: Kurs) => (
                  <div key={kurs.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {kurs.kursName}
                        </h3>
                        <div className="mt-1 text-sm text-gray-500 space-y-1">
                          <div className="flex items-center">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {kurs.kurstypName}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {kurs.kursraumName}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(kurs.startdatum), 'dd.MM.yyyy')} - 
                            {format(new Date(kurs.enddatum), 'dd.MM.yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          kurs.status === 'laufend' ? 'bg-green-100 text-green-800' :
                          kurs.status === 'geplant' ? 'bg-blue-100 text-blue-800' :
                          kurs.status === 'abgeschlossen' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {kurs.status === 'laufend' ? 'Laufend' :
                           kurs.status === 'geplant' ? 'Geplant' :
                           kurs.status === 'abgeschlossen' ? 'Abgeschlossen' :
                           'Abgebrochen'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>Noch nicht in Kurse eingeschrieben</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Statistics */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Übersicht</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Eingeschriebene Kurse</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{kurseList?.length || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Aktive Kurse</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {kurseList?.filter(k => k.status === 'laufend').length || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Abgeschlossene Kurse</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {kurseList?.filter(k => k.status === 'abgeschlossen').length || 0}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktionen</h3>
            <div className="space-y-3">
              <button 
                onClick={() => window.open(`mailto:${teilnehmerData.email}`)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                E-Mail senden
              </button>
              {teilnehmerData.telefon && (
                <button 
                  onClick={() => window.open(`tel:${teilnehmerData.telefon}`)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Anrufen
                </button>
              )}
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                <Calendar className="w-4 h-4 mr-2" />
                Anwesenheit anzeigen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Teilnehmer bearbeiten"
        size="lg"
      >
        <TeilnehmerForm
          initialData={teilnehmerData}
          onSubmit={handleUpdate}
          onCancel={handleCloseEditModal}
          isPending={updateMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default TeilnehmerDetails;