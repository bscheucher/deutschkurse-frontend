// src/pages/Kurse.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  Plus, Search, Filter, Download, Edit, Trash2, Eye,
  Calendar, Users, MapPin, ChevronDown, FileText, File,
  AlertCircle
} from 'lucide-react';
import kursService from '../services/kursService';
import ExportService, { ExportColumn, type ExportFormat, CommonFormatters } from '../services/exportService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import KursForm from '../components/forms/KursForm';
import { Kurs, CreateKursDto } from '../types/kurs.types';

const Kurse: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingKurs, setEditingKurs] = useState<Kurs | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);

  // Fetch kurse
  const { data: kurse, isPending } = useQuery({
    queryKey: ['kurse'],
    queryFn: kursService.getAllKurse
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateKursDto) => kursService.createKurs(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kurse'] });
      toast.success('Kurs erfolgreich erstellt');
      setShowForm(false);
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'Fehler beim Erstellen des Kurses');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateKursDto> }) => 
      kursService.updateKurs(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kurse'] });
      toast.success('Kurs erfolgreich aktualisiert');
      setEditingKurs(null);
      setShowForm(false);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Fehler beim Aktualisieren des Kurses');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => kursService.deleteKurs(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kurse'] });
      toast.success('Kurs erfolgreich gelöscht');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Fehler beim Löschen des Kurses');
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
    console.log('Kurse page received form data:', data);
    console.log('Is editing?', !!editingKurs);
    console.log('Editing kurs ID:', editingKurs?.id);
    
    try {
      const kursData = convertToCreateKursDto(data);

      if (editingKurs) {
        console.log('Updating kurs with ID:', editingKurs.id, 'Data:', kursData);
        updateMutation.mutate({ id: editingKurs.id, data: kursData });
      } else {
        console.log('Creating new kurs with data:', kursData);
        createMutation.mutate(kursData);
      }
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast.error(error.message || 'Fehler beim Verarbeiten der Formulardaten');
    }
  };

  const handleEdit = (kurs: Kurs) => {
    console.log('Edit button clicked for kurs:', kurs);
    setEditingKurs(kurs);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Möchten Sie diesen Kurs wirklich löschen?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingKurs(null);
  };

  // Filter kurse
  const filteredKurse = kurse?.filter((kurs: Kurs) => {
    const matchesSearch = kurs.kursName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kurs.trainerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kurs.kurstypName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || kurs.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Define export columns
  const exportColumns: ExportColumn[] = [
    { key: 'id', header: 'ID', width: 60 },
    { key: 'kursName', header: 'Kursname', width: 200 },
    { key: 'kurstypName', header: 'Kurstyp', width: 120 },
    { key: 'kursraumName', header: 'Raum', width: 100 },
    { key: 'trainerName', header: 'Trainer', width: 150 },
    { key: 'startdatum', header: 'Startdatum', formatter: CommonFormatters.date, width: 100 },
    { key: 'enddatum', header: 'Enddatum', formatter: CommonFormatters.date, width: 100 },
    { key: 'maxTeilnehmer', header: 'Max. Teilnehmer', formatter: CommonFormatters.number, width: 80 },
    { key: 'aktuelleTeilnehmer', header: 'Akt. Teilnehmer', formatter: CommonFormatters.number, width: 80 },
    { 
      key: 'status', 
      header: 'Status', 
      formatter: (value) => {
        switch(value) {
          case 'geplant': return 'Geplant';
          case 'laufend': return 'Laufend';
          case 'abgeschlossen': return 'Abgeschlossen';
          case 'abgebrochen': return 'Abgebrochen';
          default: return value;
        }
      },
      width: 100 
    },
    { key: 'beschreibung', header: 'Beschreibung', formatter: CommonFormatters.truncate(100), width: 200 }
  ];

  // Export function using the ExportService
  const handleExport = async (exportFormat: ExportFormat) => {
    if (!filteredKurse || filteredKurse.length === 0) {
      toast.error('Keine Kurse zum Exportieren vorhanden');
      return;
    }

    setIsExporting(true);
    setShowExportDropdown(false);

    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `kurse_${timestamp}`;
      
      // Get file size estimate
      const estimatedSize = ExportService.getFileSizeEstimate(filteredKurse, exportFormat);
      
      await ExportService.export(exportFormat, filteredKurse, exportColumns, {
        filename,
        title: 'Kursliste',
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
        `${filteredKurse.length} Kurse als ${formatNames[exportFormat]} exportiert (${estimatedSize})`,
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
    if (!filteredKurse || filteredKurse.length === 0) {
      toast.error('Keine Kurse zum Exportieren vorhanden');
      return;
    }

    setIsExporting(true);
    setShowExportDropdown(false);

    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      
      await ExportService.exportBatch([
        {
          name: `kurse_csv_${timestamp}`,
          data: filteredKurse,
          columns: exportColumns,
          format: 'csv',
          options: { title: 'Kursliste (CSV)' }
        },
        {
          name: `kurse_json_${timestamp}`,
          data: filteredKurse,
          columns: exportColumns,
          format: 'json',
          options: { title: 'Kursliste (JSON)' }
        }
      ]);

      toast.success(`${filteredKurse.length} Kurse in mehreren Formaten exportiert`);

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
          <h1 className="text-2xl font-bold text-gray-900">Kurse</h1>
          <p className="text-gray-600 mt-1">
            {filteredKurse?.length || 0} von {kurse?.length || 0} Kursen
            {searchTerm && (
              <span className="text-blue-600"> • Gefiltert nach "{searchTerm}"</span>
            )}
          </p>
        </div>
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
                placeholder="Kurs, Trainer oder Typ suchen..."
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
            
            {/* Enhanced Export Dropdown */}
            <div className="relative" ref={exportButtonRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                disabled={isExporting || !filteredKurse?.length}
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
                        {filteredKurse?.length || 0} Kurse exportieren
                      </div>
                      <div className="text-xs text-blue-600">
                        Geschätzte Größe: {ExportService.getFileSizeEstimate(filteredKurse || [], 'csv')}
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
        {(searchTerm || statusFilter !== 'all') && filteredKurse && filteredKurse.length > 0 && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4 mr-2" />
              Export enthält nur die {filteredKurse.length} gefilterten Kurse von insgesamt {kurse?.length || 0}
            </div>
          </div>
        )}

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
              {filteredKurse?.map((kurs: Kurs) => (
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
                        onClick={() => handleEdit(kurs)}
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
            <div className="text-center py-12 text-gray-500">
              <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Kurse</h3>
              <p>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Keine Kurse entsprechen den Filterkriterien' 
                  : 'Noch keine Kurse erstellt'
                }
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredKurse && filteredKurse.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 text-sm text-gray-700">
            Zeige {filteredKurse.length} von {kurse?.length || 0} Kursen
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingKurs ? 'Kurs bearbeiten' : 'Neuer Kurs'}
        size="lg"
      >
        <KursForm
          initialData={editingKurs}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default Kurse;