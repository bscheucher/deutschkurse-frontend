// src/pages/Teilnehmer.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  Plus, Search, Filter, Download, Edit, Trash2, Eye,
  Mail, Phone, Calendar
} from 'lucide-react';
import teilnehmerService from '../services/teilnehmerService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { Teilnehmer } from '../types/teilnehmer.types';

const TeilnehmerPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: teilnehmer, isLoading } = useQuery({
    queryKey: ['teilnehmer'],
    queryFn: teilnehmerService.getAllTeilnehmer
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => teilnehmerService.deleteTeilnehmer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teilnehmer'] });
      toast.success('Teilnehmer erfolgreich gelöscht');
    },
    onError: () => {
      toast.error('Fehler beim Löschen des Teilnehmers');
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Möchten Sie diesen Teilnehmer wirklich löschen?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredTeilnehmer = teilnehmer?.filter(t => {
    const matchesSearch = 
      t.vorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nachname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'aktiv' && t.aktiv) ||
      (statusFilter === 'inaktiv' && !t.aktiv);
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teilnehmer</h1>
        <button
          onClick={() => navigate('/teilnehmer/new')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Teilnehmer
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
                placeholder="Name oder E-Mail suchen..."
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
                <option value="aktiv">Aktiv</option>
                <option value="inaktiv">Inaktiv</option>
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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anmeldedatum
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
              {filteredTeilnehmer?.map((teilnehmer) => (
                <tr key={teilnehmer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {teilnehmer.vorname} {teilnehmer.nachname}
                      </div>
                      {teilnehmer.geschlecht && (
                        <div className="text-sm text-gray-500">
                          {teilnehmer.geschlecht === 'm' ? 'Männlich' : 
                           teilnehmer.geschlecht === 'w' ? 'Weiblich' : 'Divers'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-3 h-3 mr-1 text-gray-400" />
                        {teilnehmer.email}
                      </div>
                      {teilnehmer.telefon && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {teilnehmer.telefon}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {format(new Date(teilnehmer.anmeldedatum), 'dd.MM.yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      teilnehmer.aktiv 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {teilnehmer.aktiv ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/teilnehmer/${teilnehmer.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Details anzeigen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/teilnehmer/${teilnehmer.id}/edit`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(teilnehmer.id)}
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
          
          {filteredTeilnehmer?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Keine Teilnehmer gefunden
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeilnehmerPage;