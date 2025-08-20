// src/pages/Teilnehmer.tsx - Integrated with ExportService
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  Plus, Search, Filter, Download, Edit, Trash2, Eye,
  Mail, Phone, Calendar, ChevronDown, FileText, File,
  AlertCircle
} from 'lucide-react';
import teilnehmerService from '../services/teilnehmerService';
import ExportService, { ExportColumn, ExportFormat, CommonFormatters } from '../services/exportService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Teilnehmer } from '../types/teilnehmer.types';

const TeilnehmerPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);

  const { data: teilnehmer, isPending } = useQuery({
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
      (t.vorname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.nachname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'aktiv' && t.aktiv) ||
      (statusFilter === 'inaktiv' && !t.aktiv);
    return matchesSearch && matchesStatus;
  });

  // Define export columns
  const exportColumns: ExportColumn[] = [
    { key: 'id', header: 'ID' },
    { key: 'vorname', header: 'Vorname' },
    { key: 'nachname', header: 'Nachname' },
    { key: 'email', header: 'E-Mail' },
    { key: 'telefon', header: 'Telefon', formatter: CommonFormatters.phone },
    { key: 'geburtsdatum', header: 'Geburtsdatum', formatter: CommonFormatters.date },
    { key: 'geschlecht', header: 'Geschlecht', formatter: CommonFormatters.gender },
    { key: 'staatsangehoerigkeit', header: 'Staatsangehörigkeit' },
    { key: 'muttersprache', header: 'Muttersprache' },
    { key: 'anmeldedatum', header: 'Anmeldedatum', formatter: CommonFormatters.date },
    { key: 'aktiv', header: 'Status', formatter: CommonFormatters.status }
  ];

  // Export function using the ExportService
  const handleExport = async (format: ExportFormat) => {
    if (!filteredTeilnehmer || filteredTeilnehmer.length === 0) {
      toast.error('Keine Teilnehmer zum Exportieren vorhanden');
      return;
    }

    setIsExporting(true);
    setShowExportDropdown(false);

    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `teilnehmer_${timestamp}`;
      
      // Get file size estimate
      const estimatedSize = ExportService.getFileSizeEstimate(filteredTeilnehmer, format);
      
      await ExportService.export(format, filteredTeilnehmer, exportColumns, {
        filename,
        title: 'Teilnehmer Liste',
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
        `${filteredTeilnehmer.length} Teilnehmer als ${formatNames[format]} exportiert (${estimatedSize})`,
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
    if (!filteredTeilnehmer || filteredTeilnehmer.length === 0) {
      toast.error('Keine Teilnehmer zum Exportieren vorhanden');
      return;
    }

    setIsExporting(true);
    setShowExportDropdown(false);

    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      
      await ExportService.exportBatch([
        {
          name: `teilnehmer_csv_${timestamp}`,
          data: filteredTeilnehmer,
          columns: exportColumns,
          format: 'csv',
          options: { title: 'Teilnehmer Liste (CSV)' }
        },
        {
          name: `teilnehmer_json_${timestamp}`,
          data: filteredTeilnehmer,
          columns: exportColumns,
          format: 'json',
          options: { title: 'Teilnehmer Liste (JSON)' }
        }
      ]);

      toast.success(`${filteredTeilnehmer.length} Teilnehmer in mehreren Formaten exportiert`);

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
          <h1 className="text-2xl font-bold text-gray-900">Teilnehmer</h1>
          <p className="text-gray-600 mt-1">
            {filteredTeilnehmer?.length || 0} von {teilnehmer?.length || 0} Teilnehmern
            {searchTerm && (
              <span className="text-blue-600"> • Gefiltert nach "{searchTerm}"</span>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/teilnehmer/new')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Teilnehmer
        </button>
      </div>

      {/* Filters and Export */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
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
            
            {/* Enhanced Export Dropdown */}
            <div className="relative" ref={exportButtonRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                disabled={isExporting || !filteredTeilnehmer?.length}
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
                        {filteredTeilnehmer?.length || 0} Teilnehmer exportieren
                      </div>
                      <div className="text-xs text-blue-600">
                        Geschätzte Größe: {ExportService.getFileSizeEstimate(filteredTeilnehmer || [], 'csv')}
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
        {(searchTerm || statusFilter !== 'all') && filteredTeilnehmer && filteredTeilnehmer.length > 0 && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4 mr-2" />
              Export enthält nur die {filteredTeilnehmer.length} gefilterten Teilnehmer von insgesamt {teilnehmer?.length || 0}
            </div>
          </div>
        )}

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
                          {CommonFormatters.gender(teilnehmer.geschlecht)}
                          {teilnehmer.staatsangehoerigkeit && ` • ${teilnehmer.staatsangehoerigkeit}`}
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
                      {CommonFormatters.date(teilnehmer.anmeldedatum)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      teilnehmer.aktiv 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {CommonFormatters.status(teilnehmer.aktiv)}
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
            <div className="text-center py-12 text-gray-500">
              <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Teilnehmer</h3>
              <p>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Keine Teilnehmer entsprechen den Filterkriterien' 
                  : 'Noch keine Teilnehmer vorhanden'
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
      </div>
    </div>
  );
};

export default TeilnehmerPage;