// src/pages/KursDetails.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Calendar, Clock, Users, MapPin, 
  User, Plus, Trash2, Edit, Download, Mail 
} from 'lucide-react';
import kursService from '../services/kursService';
import teilnehmerService from '../services/teilnehmerService';
import stundenplanService from '../services/stundenplanService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import StundenplanForm from '../components/forms/StundenplanForm';
import { Kurs } from '../types/kurs.types';
import { Teilnehmer } from '../types/teilnehmer.types';
import { Stundenplan, CreateStundenplanDto } from '../types/stundenplan.types';

const KursDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedTeilnehmer, setSelectedTeilnehmer] = useState<number | null>(null);
  const [showStundenplanModal, setShowStundenplanModal] = useState(false);
  const [editingStundenplan, setEditingStundenplan] = useState<Stundenplan | null>(null);

  // Fetch course data
  const { data: kurs, isPending: kursLoading, error: kursError } = useQuery({
    queryKey: ['kurs', id],
    queryFn: () => kursService.getKursById(Number(id)),
    enabled: !!id
  });

  // Fetch participants in course
  const { data: teilnehmerInKurs, isPending: teilnehmerLoading } = useQuery({
    queryKey: ['kursTeilnehmer', id],
    queryFn: () => kursService.getTeilnehmerInKurs(Number(id)),
    enabled: !!id
  });

  // Fetch all participants for enrollment
  const { data: alleTeilnehmer } = useQuery({
    queryKey: ['teilnehmer'],
    queryFn: teilnehmerService.getAllTeilnehmer
  });

  // Fetch schedule entries for this course
  const { data: stundenplanEntries, isPending: stundenplanLoading } = useQuery({
    queryKey: ['stundenplan', 'kurs', id],
    queryFn: () => stundenplanService.getStundenplanByKurs(Number(id)),
    enabled: !!id
  });

  // Enroll participant mutation
  const enrollMutation = useMutation({
    mutationFn: (teilnehmerId: number) => kursService.enrollTeilnehmer(teilnehmerId, Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kursTeilnehmer', id] });
      queryClient.invalidateQueries({ queryKey: ['kurs', id] });
      toast.success('Teilnehmer erfolgreich eingeschrieben');
      setShowEnrollModal(false);
      setSelectedTeilnehmer(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Fehler beim Einschreiben des Teilnehmers');
    }
  });

  // Remove participant mutation
  const removeMutation = useMutation({
    mutationFn: (teilnehmerId: number) => kursService.removeTeilnehmer(Number(id), teilnehmerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kursTeilnehmer', id] });
      queryClient.invalidateQueries({ queryKey: ['kurs', id] });
      toast.success('Teilnehmer erfolgreich entfernt');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Fehler beim Entfernen des Teilnehmers');
    }
  });

  // Create schedule entry mutation
  const createStundenplanMutation = useMutation({
    mutationFn: (data: CreateStundenplanDto) => stundenplanService.createStundenplanEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stundenplan', 'kurs', id] });
      queryClient.invalidateQueries({ queryKey: ['stundenplan'] });
      toast.success('Stundenplan erfolgreich erstellt');
      setShowStundenplanModal(false);
      setEditingStundenplan(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Fehler beim Erstellen des Stundenplans');
    }
  });

  // Update schedule entry mutation
  const updateStundenplanMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateStundenplanDto> }) =>
      stundenplanService.updateStundenplanEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stundenplan', 'kurs', id] });
      queryClient.invalidateQueries({ queryKey: ['stundenplan'] });
      toast.success('Stundenplan erfolgreich aktualisiert');
      setShowStundenplanModal(false);
      setEditingStundenplan(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Fehler beim Aktualisieren des Stundenplans');
    }
  });

  // Delete schedule entry mutation
  const deleteStundenplanMutation = useMutation({
    mutationFn: (stundenplanId: number) => stundenplanService.deleteStundenplanEntry(stundenplanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stundenplan', 'kurs', id] });
      queryClient.invalidateQueries({ queryKey: ['stundenplan'] });
      toast.success('Stundenplan erfolgreich gelöscht');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Fehler beim Löschen des Stundenplans');
    }
  });

  const handleEnroll = () => {
    if (selectedTeilnehmer) {
      enrollMutation.mutate(selectedTeilnehmer);
    }
  };

  const handleRemoveTeilnehmer = (teilnehmerId: number) => {
    if (window.confirm('Möchten Sie diesen Teilnehmer wirklich aus dem Kurs entfernen?')) {
      removeMutation.mutate(teilnehmerId);
    }
  };

  const handleEditClick = () => {
    console.log('Edit button clicked, navigating to:', `/kurse/${id}/edit`);
    navigate(`/kurse/${id}/edit`);
  };

  const handleAddStundenplan = () => {
    setEditingStundenplan(null);
    setShowStundenplanModal(true);
  };

  const handleEditStundenplan = (stundenplan: Stundenplan) => {
    setEditingStundenplan(stundenplan);
    setShowStundenplanModal(true);
  };

  const handleDeleteStundenplan = (stundenplanId: number) => {
    if (window.confirm('Möchten Sie diesen Stundenplan-Eintrag wirklich löschen?')) {
      deleteStundenplanMutation.mutate(stundenplanId);
    }
  };

  const handleStundenplanSubmit = (data: CreateStundenplanDto) => {
    console.log('Stundenplan submit:', data, 'Editing:', editingStundenplan);
    
    if (editingStundenplan) {
      updateStundenplanMutation.mutate({ id: editingStundenplan.id, data });
    } else {
      createStundenplanMutation.mutate(data);
    }
  };

  const handleCloseStundenplanModal = () => {
    setShowStundenplanModal(false);
    setEditingStundenplan(null);
  };

  // Helper function to format time display
  const formatTime = (time: string): string => {
    if (!time) return '';
    // Extract HH:MM from HH:MM:SS format
    return time.substring(0, 5);
  };

  // Helper function to get weekday order for sorting
  const getWeekdayOrder = (day: string): number => {
    const order = { Montag: 1, Dienstag: 2, Mittwoch: 3, Donnerstag: 4, Freitag: 5 };
    return order[day as keyof typeof order] || 6;
  };

  if (kursLoading) return <LoadingSpinner text="Lade Kursdaten..." />;
  
  if (kursError || !kurs) {
    return (
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/kurse')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Zurück zur Übersicht
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            <h3 className="text-lg font-medium">Kurs nicht gefunden</h3>
            <p className="mt-2">Der angeforderte Kurs existiert nicht oder es ist ein Fehler aufgetreten.</p>
          </div>
        </div>
      </div>
    );
  }

  // Cast data to proper types
  const kursData = kurs as Kurs;
  const teilnehmerList = teilnehmerInKurs as Teilnehmer[] | undefined;
  const allTeilnehmerList = alleTeilnehmer as Teilnehmer[] | undefined;
  const stundenplanList = stundenplanEntries as Stundenplan[] | undefined;

  // Filter out already enrolled participants
  const enrolledIds = teilnehmerList?.map((t: Teilnehmer) => t.id) || [];
  const availableTeilnehmer = allTeilnehmerList?.filter((t: Teilnehmer) => 
    !enrolledIds.includes(t.id) && t.aktiv
  ) || [];

  // Sort schedule entries by weekday and start time
  const sortedStundenplan = stundenplanList
    ?.filter(s => s.aktiv)
    ?.sort((a, b) => {
      const dayOrder = getWeekdayOrder(a.wochentag) - getWeekdayOrder(b.wochentag);
      if (dayOrder !== 0) return dayOrder;
      return a.startzeit.localeCompare(b.startzeit);
    }) || [];

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/kurse')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Zurück zur Übersicht
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{kursData.kursName}</h1>
            <div className="mt-2 flex items-center space-x-4">
              <StatusBadge status={kursData.status} />
              <span className="text-sm text-gray-500">
                {kursData.kurstypName} • {kursData.kursraumName}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleEditClick}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Edit className="w-4 h-4 mr-2" />
              Bearbeiten
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kursinformationen</h2>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Trainer</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  {kursData.trainerName}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Kursraum</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {kursData.kursraumName}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Zeitraum</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {format(new Date(kursData.startdatum), 'dd. MMM yyyy', { locale: de })} - 
                  {format(new Date(kursData.enddatum), 'dd. MMM yyyy', { locale: de })}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Teilnehmer</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  {kursData.aktuelleTeilnehmer} / {kursData.maxTeilnehmer}
                </dd>
              </div>
            </dl>
            
            {kursData.beschreibung && (
              <div className="mt-6">
                <dt className="text-sm font-medium text-gray-500">Beschreibung</dt>
                <dd className="mt-1 text-sm text-gray-900">{kursData.beschreibung}</dd>
              </div>
            )}
          </div>

          {/* Participants List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Teilnehmer ({teilnehmerList?.length || 0})
                </h2>
                {kursData.aktuelleTeilnehmer < kursData.maxTeilnehmer && (
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Teilnehmer hinzufügen
                  </button>
                )}
              </div>
            </div>
            
            {teilnehmerLoading ? (
              <div className="p-6">
                <LoadingSpinner text="Lade Teilnehmer..." />
              </div>
            ) : teilnehmerList && teilnehmerList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-Mail
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teilnehmerList.map((teilnehmer: Teilnehmer) => (
                      <tr key={teilnehmer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {teilnehmer.vorname} {teilnehmer.nachname}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teilnehmer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teilnehmer.telefon || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              title="E-Mail senden"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveTeilnehmer(teilnehmer.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Aus Kurs entfernen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>Keine Teilnehmer eingeschrieben</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Schedule */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Stundenplan</h3>
              <button
                onClick={handleAddStundenplan}
                className="flex items-center px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="w-3 h-3 mr-1" />
                Hinzufügen
              </button>
            </div>
            
            {stundenplanLoading ? (
              <LoadingSpinner size="sm" text="Lade Stundenplan..." />
            ) : sortedStundenplan.length > 0 ? (
              <div className="space-y-3">
                {sortedStundenplan.map((entry: Stundenplan) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entry.wochentag}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(entry.startzeit)} - {formatTime(entry.endzeit)}
                        </div>
                        {entry.bemerkungen && (
                          <div className="text-xs text-gray-400 italic">
                            {entry.bemerkungen}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditStundenplan(entry)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Bearbeiten"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteStundenplan(entry.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Löschen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Noch keine Stundenplan-Einträge</p>
                <button
                  onClick={handleAddStundenplan}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                >
                  Ersten Eintrag hinzufügen
                </button>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiken</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Ø Anwesenheit</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">92%</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Erfolgsquote</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">87%</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Wochenstunden</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {sortedStundenplan.length > 0 
                    ? `${sortedStundenplan.length}x`
                    : '0x'
                  }
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => {
          setShowEnrollModal(false);
          setSelectedTeilnehmer(null);
        }}
        title="Teilnehmer hinzufügen"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teilnehmer auswählen
            </label>
            <select
              value={selectedTeilnehmer || ''}
              onChange={(e) => setSelectedTeilnehmer(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Bitte wählen...</option>
              {availableTeilnehmer.map((teilnehmer: Teilnehmer) => (
                <option key={teilnehmer.id} value={teilnehmer.id}>
                  {teilnehmer.vorname} {teilnehmer.nachname} ({teilnehmer.email})
                </option>
              ))}
            </select>
            {availableTeilnehmer.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">
                Alle aktiven Teilnehmer sind bereits in diesem Kurs eingeschrieben.
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowEnrollModal(false);
                setSelectedTeilnehmer(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleEnroll}
              disabled={!selectedTeilnehmer || enrollMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {enrollMutation.isPending ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stundenplan Modal */}
      <Modal
        isOpen={showStundenplanModal}
        onClose={handleCloseStundenplanModal}
        title={editingStundenplan ? 'Stundenplan bearbeiten' : 'Neuer Stundenplan'}
        size="lg"
      >
        <StundenplanForm
          initialData={editingStundenplan}
          kursId={Number(id)}
          kursName={kursData.kursName}
          onSubmit={handleStundenplanSubmit}
          onCancel={handleCloseStundenplanModal}
          isPending={createStundenplanMutation.isPending || updateStundenplanMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default KursDetails;