// src/pages/Trainer.tsx (Alternative version using TrainerTable)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Filter, Download } from 'lucide-react';
import trainerService from '../services/trainerService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import TrainerForm from '../components/forms/TrainerForm';
import TrainerTable from '../components/tables/TrainerTable';
import { Trainer, CreateTrainerDto } from '../types/trainer.types';

const TrainerPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [abteilungFilter, setAbteilungFilter] = useState<string>('all');

  // Fetch trainers
  const { data: trainer, isLoading } = useQuery({
    queryKey: ['trainer'],
    queryFn: trainerService.getAllTrainer
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTrainerDto) => trainerService.createTrainer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer'] });
      toast.success('Trainer erfolgreich erstellt');
      setShowForm(false);
    },
    onError: () => {
      toast.error('Fehler beim Erstellen des Trainers');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTrainerDto> }) => 
      trainerService.updateTrainer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer'] });
      toast.success('Trainer erfolgreich aktualisiert');
      setEditingTrainer(null);
      setShowForm(false);
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren des Trainers');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => trainerService.deleteTrainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer'] });
      toast.success('Trainer erfolgreich gelöscht');
    },
    onError: () => {
      toast.error('Fehler beim Löschen des Trainers');
    }
  });

  const handleSubmit = (data: Partial<Trainer>) => {
    const trainerData: CreateTrainerDto = {
      vorname: data.vorname!,
      nachname: data.nachname!,
      email: data.email!,
      telefon: data.telefon,
      abteilungId: data.abteilungId!,
      status: data.status,
      qualifikationen: data.qualifikationen,
      einstellungsdatum: data.einstellungsdatum,
      aktiv: data.aktiv ?? true
    };

    if (editingTrainer) {
      updateMutation.mutate({ id: editingTrainer.id, data: trainerData });
    } else {
      createMutation.mutate(trainerData);
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setShowForm(true);
  };

  const handleDelete = (trainerId: number) => {
    deleteMutation.mutate(trainerId);
  };

  const handleView = (trainer: Trainer) => {
    // Navigate to trainer details page (if you have one)
    // navigate(`/trainer/${trainer.id}`);
    console.log('Viewing trainer:', trainer);
  };

  // Filter trainer data
  const filteredTrainer = trainer?.filter((t: Trainer) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesAbteilung = abteilungFilter === 'all' || t.abteilungId.toString() === abteilungFilter;
    return matchesStatus && matchesAbteilung;
  });

  // Get unique departments for filter
  const abteilungen = [...new Set(trainer?.map((t: Trainer) => ({ 
    id: t.abteilungId, 
    name: t.abteilungName || `Abteilung ${t.abteilungId}` 
  })))];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trainer</h1>
        <button
          onClick={() => {
            setEditingTrainer(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Trainer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Status</option>
              <option value="verfuegbar">Verfügbar</option>
              <option value="im_einsatz">Im Einsatz</option>
              <option value="abwesend">Abwesend</option>
            </select>
          </div>

          <div>
            <select
              value={abteilungFilter}
              onChange={(e) => setAbteilungFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Abteilungen</option>
              {abteilungen.map((abt: any) => (
                <option key={abt.id} value={abt.id.toString()}>{abt.name}</option>
              ))}
            </select>
          </div>
          
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Trainer Table */}
      <TrainerTable
        data={filteredTrainer || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        searchPlaceholder="Trainer nach Name, E-Mail oder Abteilung suchen..."
      />

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTrainer(null);
        }}
        title={editingTrainer ? 'Trainer bearbeiten' : 'Neuer Trainer'}
        size="lg"
      >
        <TrainerForm
          initialData={editingTrainer}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTrainer(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default TrainerPage;