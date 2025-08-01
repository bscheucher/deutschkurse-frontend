// src/pages/Kurse.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  Plus, Search, Filter, Download, Edit, Trash2, Eye,
  Calendar, Users, MapPin
} from 'lucide-react';
import kursService from '../services/kursService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import KursForm from '../components/forms/KursForm';
import { Kurs } from '../types/kurs.types';

const Kurse: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingKurs, setEditingKurs] = useState<Kurs | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: kurse, isLoading } = useQuery(['kurse'], kursService.getAllKurse);

  const createMutation = useMutation(
    (data: Partial<Kurs>) => kursService.createKurs(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['kurse']);
        toast.success('Kurs erfolgreich erstellt');
        setShowForm(false);
      },
      onError: () => {
        toast.error('Fehler beim Erstellen des Kurses');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Kurs> }) => 
      kursService.updateKurs(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['kurse']);
        toast.success('Kurs erfolgreich aktualisiert');
        setEditingKurs(null);
        setShowForm(false);
      },
      onError: () => {
        toast.error('Fehler beim Aktualisieren des Kurses');
      }
    }
  );

  const deleteMutation = useMutation(
    (id: number) => kursService.deleteKurs(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['kurse']);
        toast.success('Kurs erfolgreich gelöscht');
      },
      onError: () => {
        toast.error('Fehler beim Löschen des Kurses');
      }
    }
  );

  const handleSubmit = (data: Partial<Kurs>) => {
    if (editingKurs) {
      updateMutation.mutate({ id: editingKurs.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Möchten Sie diesen Kurs wirklich löschen?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredKurse = kurse?.filter(kurs => {
    const matchesSearch = kurs.kursName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kurs.trainerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || kurs.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kurse</h1>
        <button
          onClick={() => {
            setEditingKurs(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Kurs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Kurs oder Trainer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle Status</option>
                <option value="geplant">Geplant</option>
                <option value="laufend">Laufend</option>
                <option value="abgeschlossen">Abgeschlossen</option>
                <option value="abgebrochen">Abgebrochen</option>
              </select>
            </div>
            
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kursname
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trainer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zeitraum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teilnehmer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredKurse?.map((kurs) => (
                <tr key={kurs.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {kurs.kursName}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {kurs.kursraumName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {kurs.kurstypName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {kurs.trainerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {format(new Date(kurs.startdatum), 'dd.MM.yyyy')} - 
                      {format(new Date(kurs.enddatum), 'dd.MM.yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-gray-400" />
                      <span className={`text-sm ${
                        kurs.aktuelleTeilnehmer >= kurs.maxTeilnehmer 
                          ? 'text-red-600 font-medium' 
                          : 'text-gray-900'
                      }`}>
                        {kurs.aktuelleTeilnehmer} / {kurs.maxTeilnehmer}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={kurs.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/kurse/${kurs.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Details anzeigen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingKurs(kurs);
                          setShowForm(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="Bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(kurs.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredKurse?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Keine Kurse gefunden
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingKurs(null);
        }}
        title={editingKurs ? 'Kurs bearbeiten' : 'Neuer Kurs'}
        size="lg"
      >
        <KursForm
          initialData={editingKurs}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingKurs(null);
          }}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>
    </div>
  );
};

export default Kurse;