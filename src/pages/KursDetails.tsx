// src/pages/KursDetails.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Calendar, Clock, Users, MapPin, 
  User, Plus, Trash2, Edit, Download, Mail 
} from 'lucide-react';
import kursService from '../services/kursService';
import teilnehmerService from '../services/teilnehmerService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

const KursDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedTeilnehmer, setSelectedTeilnehmer] = useState<number | null>(null);

  const { data: kurs, isLoading: kursLoading } = useQuery(
    ['kurs', id],
    () => kursService.getKursById(Number(id)),
    { enabled: !!id }
  );

  const { data: teilnehmerInKurs, isLoading: teilnehmerLoading } = useQuery(
    ['kursTeilnehmer', id],
    () => kursService.getTeilnehmerInKurs(Number(id)),
    { enabled: !!id }
  );

  const { data: alleTeilnehmer } = useQuery(
    'teilnehmer',
    teilnehmerService.getAllTeilnehmer
  );

  const enrollMutation = useMutation(
    (teilnehmerId: number) => kursService.enrollTeilnehmer(teilnehmerId, Number(id)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['kursTeilnehmer', id]);
        queryClient.invalidateQueries(['kurs', id]);
        toast.success('Teilnehmer erfolgreich eingeschrieben');
        setShowEnrollModal(false);
        setSelectedTeilnehmer(null);
      },
      onError: () => {
        toast.error('Fehler beim Einschreiben des Teilnehmers');
      }
    }
  );

  const removeMutation = useMutation(
    (teilnehmerId: number) => kursService.removeTeilnehmer(Number(id), teilnehmerId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['kursTeilnehmer', id]);
        queryClient.invalidateQueries(['kurs', id]);
        toast.success('Teilnehmer erfolgreich entfernt');
      },
      onError: () => {
        toast.error('Fehler beim Entfernen des Teilnehmers');
      }
    }
  );

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

  if (kursLoading) return <LoadingSpinner />;
  if (!kurs) return <div>Kurs nicht gefunden</div>;

  // Filter out already enrolled participants
  const enrolledIds = teilnehmerInKurs?.map(t => t.id) || [];
  const availableTeilnehmer = alleTeilnehmer?.filter(t => 
    !enrolledIds.includes(t.id) && t.aktiv
  ) || [];

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
            <h1 className="text-2xl font-bold text-gray-900">{kurs.kursName}</h1>
            <div className="mt-2 flex items-center space-x-4">
              <StatusBadge status={kurs.status} />
              <span className="text-sm text-gray-500">
                {kurs.kurstypName} • {kurs.kursraumName}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/kurse/${id}/edit`)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
        {/* Kurs Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kursinformationen</h2>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Trainer</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  {kurs.trainerName}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Kursraum</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {kurs.kursraumName}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Zeitraum</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {format(new Date(kurs.startdatum), 'dd. MMM yyyy', { locale: de })} - 
                  {format(new Date(kurs.enddatum), 'dd. MMM yyyy', { locale: de })}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Teilnehmer</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  {kurs.aktuelleTeilnehmer} / {kurs.maxTeilnehmer}
                </dd>
              </div>
            </dl>
            
            {kurs.beschreibung && (
              <div className="mt-6">
                <dt className="text-sm font-medium text-gray-500">Beschreibung</dt>
                <dd className="mt-1 text-sm text-gray-900">{kurs.beschreibung}</dd>
              </div>
            )}
          </div>

          {/* Teilnehmer Liste */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Teilnehmer ({teilnehmerInKurs?.length || 0})
                </h2>
                {kurs.aktuelleTeilnehmer < kurs.maxTeilnehmer && (
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
              <LoadingSpinner />
            ) : teilnehmerInKurs && teilnehmerInKurs.length > 0 ? (
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
                    {teilnehmerInKurs.map((teilnehmer) => (
                      <tr key={teilnehmer.id}>
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
                            <button className="text-blue-600 hover:text-blue-900">
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveTeilnehmer(teilnehmer.id)}
                              className="text-red-600 hover:text-red-900"
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
                Keine Teilnehmer eingeschrieben
              </div>
            )}
          </div>
        </div>

        {/* Seitliche Informationen */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stundenplan</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                <span>Montag: 09:00 - 12:00</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                <span>Mittwoch: 09:00 - 12:00</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                <span>Freitag: 09:00 - 12:00</span>
              </div>
            </div>
          </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Bitte wählen...</option>
              {availableTeilnehmer.map((teilnehmer) => (
                <option key={teilnehmer.id} value={teilnehmer.id}>
                  {teilnehmer.vorname} {teilnehmer.nachname} ({teilnehmer.email})
                </option>
              ))}
            </select>
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
              disabled={!selectedTeilnehmer || enrollMutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {enrollMutation.isLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KursDetails;