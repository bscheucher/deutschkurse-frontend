// src/components/tables/TrainerTable.tsx
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  ChevronUp, ChevronDown, ChevronsUpDown, 
  Mail, Phone, Calendar, User, Edit, Trash2, Eye 
} from 'lucide-react';
import { Trainer } from '../../types/trainer.types';
import StatusBadge from '../common/StatusBadge';

interface TrainerTableProps {
  data: Trainer[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onEdit?: (trainer: Trainer) => void;
  onDelete?: (trainerId: number) => void;
  onView?: (trainer: Trainer) => void;
  emptyMessage?: string;
  showActions?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

const TrainerTable: React.FC<TrainerTableProps> = ({
  data,
  searchable = true,
  searchPlaceholder = 'Trainer suchen...',
  onEdit,
  onDelete,
  onView,
  emptyMessage = 'Keine Trainer vorhanden',
  showActions = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Trainer | null;
    direction: SortDirection;
  }>({ key: null, direction: null });

  const handleSort = (key: keyof Trainer) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let processedData = [...data];

    // Filter
    if (searchTerm) {
      processedData = processedData.filter((trainer) =>
        trainer.vorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.nachname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trainer.abteilungName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trainer.qualifikationen || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortConfig.key && sortConfig.direction) {
      processedData.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return processedData;
  }, [data, searchTerm, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: keyof Trainer }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="w-4 h-4 text-gray-700" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ChevronDown className="w-4 h-4 text-gray-700" />;
    }
    return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
  };

  const handleDeleteClick = (e: React.MouseEvent, trainerId: number) => {
    e.stopPropagation();
    if (window.confirm('Möchten Sie diesen Trainer wirklich löschen?')) {
      onDelete?.(trainerId);
    }
  };

  const handleEditClick = (e: React.MouseEvent, trainer: Trainer) => {
    e.stopPropagation();
    onEdit?.(trainer);
  };

  const handleViewClick = (trainer: Trainer) => {
    onView?.(trainer);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {searchable && (
        <div className="p-4 border-b">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('vorname')}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <SortIcon columnKey="vorname" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontakt
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('abteilungId')}
              >
                <div className="flex items-center space-x-1">
                  <span>Abteilung</span>
                  <SortIcon columnKey="abteilungId" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <SortIcon columnKey="status" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('einstellungsdatum')}
              >
                <div className="flex items-center space-x-1">
                  <span>Einstellung</span>
                  <SortIcon columnKey="einstellungsdatum" />
                </div>
              </th>
              {showActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={showActions ? 6 : 5}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((trainer) => (
                <tr
                  key={trainer.id}
                  onClick={() => onView && handleViewClick(trainer)}
                  className={`${
                    onView ? 'hover:bg-gray-50 cursor-pointer' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {trainer.vorname} {trainer.nachname}
                        </div>
                        {trainer.qualifikationen && (
                          <div className="text-sm text-gray-500" title={trainer.qualifikationen}>
                            {trainer.qualifikationen.length > 40 
                              ? trainer.qualifikationen.substring(0, 40) + '...'
                              : trainer.qualifikationen
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-3 h-3 mr-1 text-gray-400" />
                        <span className="truncate" title={trainer.email}>
                          {trainer.email}
                        </span>
                      </div>
                      {trainer.telefon && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {trainer.telefon}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trainer.abteilungName || `Abteilung ${trainer.abteilungId}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={trainer.status} variant="trainer" />
                      {!trainer.aktiv && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inaktiv
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {trainer.einstellungsdatum ? (
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {format(new Date(trainer.einstellungsdatum), 'dd.MM.yyyy')}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {onView && (
                          <button
                            onClick={() => handleViewClick(trainer)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Details anzeigen"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={(e) => handleEditClick(e, trainer)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Bearbeiten"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => handleDeleteClick(e, trainer.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredAndSortedData.length > 0 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="text-sm text-gray-700">
            Zeige <span className="font-medium">{filteredAndSortedData.length}</span> von{' '}
            <span className="font-medium">{data.length}</span> Trainern
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerTable;