// src/pages/Trainer.tsx - Enhanced with ExportService integration
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  Plus, Filter, Download, ChevronDown, FileText, File,
  AlertCircle
} from 'lucide-react';
import trainerService from '../services/trainerService';
import ExportService, { ExportColumn, type ExportFormat, CommonFormatters } from '../services/exportService';
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
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);

  // Fetch trainers
  const { data: trainer, isPending } = useQuery({
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

  // Define export columns
  const exportColumns: ExportColumn[] = [
    { key: 'id', header: 'ID', width: 60 },
    { key: 'vorname', header: 'Vorname', width: 120 },
    { key: 'nachname', header: 'Nachname', width: 120 },
    { key: 'email', header: 'E-Mail', width: 200 },
    { key: 'telefon', header: 'Telefon', formatter: CommonFormatters.phone, width: 140 },
    { key: 'abteilungName', header: 'Abteilung', width: 150 },
    { 
      key: 'status', 
      header: 'Status', 
      formatter: (value) => {
        switch(value) {
          case 'verfuegbar': return 'Verfügbar';
          case 'im_einsatz': return 'Im Einsatz';
          case 'abwesend': return 'Abwesend';
          default: return value;
        }
      },
      width: 100 
    },
    { key: 'qualifikationen', header: 'Qualifikationen', formatter: CommonFormatters.truncate(100), width: 250 },
    { key: 'einstellungsdatum', header: 'Einstellungsdatum', formatter: CommonFormatters.date, width: 120 },
    { key: 'aktiv', header: 'Aktiv', formatter: CommonFormatters.status, width: 80 }
  ];

  // Export function using the ExportService
  const handleExport = async (exportFormat: ExportFormat) => {
    if (!filteredTrainer || filteredTrainer.length === 0) {
      toast.error('Keine Trainer zum Exportieren vorhanden');
      return;
    }

    setIsExporting(true);
    setShowExportDropdown(false);

    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `trainer_${timestamp}`;
      
      // Get file size estimate
      const estimatedSize = ExportService.getFileSizeEstimate(filteredTrainer, exportFormat);
      
      await ExportService.export(exportFormat, filteredTrainer, exportColumns, {
        filename,
        title: 'Trainer Liste',
        includeTimestamp: false // Already included in filename
      });

      // Show success message with details
      const formatNames = {
        csv: 'CSV (Excel)',
        txt: 'Text',
        pdf: 'PDF',
        json: 'JSON'
      };

      toast.success(
        `${filteredTrainer.length} Trainer als ${formatNames[exportFormat]} exportiert (${estimatedSize})`,
        { duration: 4000 }
      );

    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Fehler beim Exportieren der Daten');
    } finally {
      setIsExporting(false);
    }
  };

  // Export multiple formats at once
  const handleBatchExport = async () => {
    if (!filteredTrainer || filteredTrainer.length === 0) {
      toast.error('Keine Trainer zum Exportieren vorhanden');
      return;
    }

    setIsExporting(true);
    setShowExportDropdown(false);

    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      
      await ExportService.exportBatch([
        {
          name: `trainer_csv_${timestamp}`,
          data: filteredTrainer,
          columns: exportColumns,
          format: 'csv',
          options: { title: 'Trainer Liste (CSV)' }
        },
        {
          name: `trainer_json_${timestamp}`,
          data: filteredTrainer,
          columns: exportColumns,
          format: 'json',
          options: { title: 'Trainer Liste (JSON)' }
        }
      ]);

      toast.success(`${filteredTrainer.length} Trainer in mehreren Formaten exportiert`);

    } catch (error: any) {
      console.error('Batch export error:', error);
      toast.error('Fehler beim Batch-Export der Daten');
    } finally {
      setIsExporting(false);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isPending) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trainer</h1>
          <p className="text-gray-600 mt-1">
            {filteredTrainer?.length || 0} von {trainer?.length || 0} Trainern
            {(statusFilter !== 'all' || abteilungFilter !== 'all') && (
              <span className="text-blue-600"> • Gefiltert</span>
            )}
          </p>
        </div>
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

      {/* Filters and Export */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            
            {/* Spacer */}
            <div></div>

            {/* Enhanced Export Dropdown */}
            <div className="relative" ref={exportButtonRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                disabled={isExporting || !filteredTrainer?.length}
                className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-pulse' : ''}`} />
                {isExporting ? 'Exportiere...' : 'Export'}
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* Export info */}
                    <div className="px-4 py-2 bg-blue-50 border-b">
                      <div className="text-xs font-medium text-blue-900">
                        {filteredTrainer?.length || 0} Trainer exportieren
                      </div>
                      <div className="text-xs text-blue-600">
                        Geschätzte Größe: {ExportService.getFileSizeEstimate(filteredTrainer || [], 'csv')}
                      </div>
                    </div>

                    {/* Export options */}
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Export Format
                    </div>
                    
                    <button
                      onClick={() => handleExport('csv')}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-3 text-green-600" />
                      <div className="text-left flex-1">
                        <div className="font-medium">CSV (Excel)</div>
                        <div className="text-xs text-gray-500">Komma-getrennte Werte, Excel-kompatibel</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleExport('txt')}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <File className="w-4 h-4 mr-3 text-blue-600" />
                      <div className="text-left flex-1">
                        <div className="font-medium">Text (.txt)</div>
                        <div className="text-xs text-gray-500">Formatierter, lesbarer Text</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-3 text-red-600" />
                      <div className="text-left flex-1">
                        <div className="font-medium">PDF (Drucken)</div>
                        <div className="text-xs text-gray-500">Tabelle zum Drucken oder Speichern</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleExport('json')}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <File className="w-4 h-4 mr-3 text-purple-600" />
                      <div className="text-left flex-1">
                        <div className="font-medium">JSON</div>
                        <div className="text-xs text-gray-500">Strukturierte Daten für Entwickler</div>
                      </div>
                    </button>

                    <div className="border-t">
                      <button
                        onClick={handleBatchExport}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-3 text-orange-600" />
                        <div className="text-left flex-1">
                          <div className="font-medium">Batch Export</div>
                          <div className="text-xs text-gray-500">CSV + JSON gleichzeitig</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Export warning if filtered */}
        {(statusFilter !== 'all' || abteilungFilter !== 'all') && filteredTrainer && filteredTrainer.length > 0 && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4 mr-2" />
              Export enthält nur die {filteredTrainer.length} gefilterten Trainer von insgesamt {trainer?.length || 0}
            </div>
          </div>
        )}

        {/* Trainer Table */}
        <TrainerTable
          data={filteredTrainer || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          searchPlaceholder="Trainer nach Name, E-Mail oder Abteilung suchen..."
        />
      </div>

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
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default TrainerPage;