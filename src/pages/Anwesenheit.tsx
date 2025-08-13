// src/pages/Anwesenheit.tsx - Enhanced with date range and weekday validation
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isSameDay, isWithinInterval, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import { 
  Calendar, Check, X, Save, Loader, 
  Users, AlertCircle, Info, Clock, AlertTriangle 
} from 'lucide-react';
import anwesenheitService from '../services/anwesenheitService';
import kursService from '../services/kursService';
import stundenplanService from '../services/stundenplanService';
import { Anwesenheit, BulkAnwesenheitDto } from '../types/anwesenheit.types';
import { Kurs } from '../types/kurs.types';
import { Teilnehmer } from '../types/teilnehmer.types';
import { StundenplanEntry } from '../services/stundenplanService';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface AttendanceData {
  anwesend: boolean;
  entschuldigt: boolean;
  bemerkung: string;
}

// Mapping from JavaScript day numbers to German weekday names
const WEEKDAY_MAPPING: Record<number, string> = {
  1: 'Montag',
  2: 'Dienstag', 
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: 'Samstag',
  0: 'Sonntag'
};

// Valid German weekdays for courses
const VALID_WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

const AnwesenheitPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedKurs, setSelectedKurs] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<Map<number, AttendanceData>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);

  // Fetch active courses
  const { data: kurse, isLoading: kurseLoading, error: kurseError } = useQuery({
    queryKey: ['kurse', 'active'],
    queryFn: async () => {
      const allKurse = await kursService.getAllKurse();
      return allKurse.filter(k => k.status === 'laufend' || k.status === 'geplant');
    },
  });

  // Fetch stundenplan for selected course
  const { 
    data: stundenplan, 
    isLoading: stundenplanLoading,
    error: stundenplanError 
  } = useQuery({
    queryKey: ['stundenplan', 'kurs', selectedKurs],
    queryFn: () => stundenplanService.getStundenplanByKurs(selectedKurs!),
    enabled: !!selectedKurs,
  });

  // Fetch attendance for selected course and date
  const { 
    data: anwesenheit, 
    isLoading: anwesenheitLoading,
    error: anwesenheitError,
    refetch: refetchAttendance 
  } = useQuery({
    queryKey: ['anwesenheit', selectedKurs, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => anwesenheitService.getByKursAndDatum(
      selectedKurs!,
      format(selectedDate, 'yyyy-MM-dd')
    ),
    enabled: !!selectedKurs && !dateValidationError,
    retry: 1,
  });

  // Fetch participants for selected course
  const { 
    data: teilnehmer,
    isLoading: teilnehmerLoading,
    error: teilnehmerError
  } = useQuery({
    queryKey: ['kursTeilnehmer', selectedKurs],
    queryFn: () => kursService.getTeilnehmerInKurs(selectedKurs!),
    enabled: !!selectedKurs,
  });

  // Get selected course details
  const selectedKursDetails = kurse?.find((k: Kurs) => k.id === selectedKurs);

  // Date validation functions
  const getValidWeekdays = (): string[] => {
    if (!stundenplan || stundenplan.length === 0) return [];
    return stundenplan
      .filter((s: StundenplanEntry) => s.aktiv)
      .map((s: StundenplanEntry) => s.wochentag)
      .filter((day: string) => VALID_WEEKDAYS.includes(day));
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selectedKursDetails) return false;
    
    try {
      const courseStart = parseISO(selectedKursDetails.startdatum);
      const courseEnd = parseISO(selectedKursDetails.enddatum);
      
      return isWithinInterval(date, { start: courseStart, end: courseEnd });
    } catch (error) {
      console.error('Error parsing course dates:', error);
      return false;
    }
  };

  const isValidWeekday = (date: Date): boolean => {
    const validWeekdays = getValidWeekdays();
    if (validWeekdays.length === 0) return false;
    
    const dayOfWeek = getDay(date);
    const germanWeekday = WEEKDAY_MAPPING[dayOfWeek];
    
    return validWeekdays.includes(germanWeekday);
  };

  const validateSelectedDate = (date: Date): string | null => {
    if (!selectedKursDetails) {
      return 'Bitte wählen Sie zuerst einen Kurs aus.';
    }

    if (!isDateInRange(date)) {
      const startDate = format(parseISO(selectedKursDetails.startdatum), 'dd.MM.yyyy');
      const endDate = format(parseISO(selectedKursDetails.enddatum), 'dd.MM.yyyy');
      return `Das Datum muss zwischen ${startDate} und ${endDate} liegen.`;
    }

    if (!isValidWeekday(date)) {
      const validWeekdays = getValidWeekdays();
      if (validWeekdays.length === 0) {
        return 'Für diesen Kurs sind noch keine Stundenplan-Einträge definiert.';
      }
      return `An diesem Wochentag findet kein Unterricht statt. Gültige Tage: ${validWeekdays.join(', ')}.`;
    }

    return null;
  };

  // Custom date filter for DatePicker
  const isDateSelectable = (date: Date): boolean => {
    if (!selectedKursDetails) return false;
    return isDateInRange(date) && isValidWeekday(date);
  };

  // Update attendance data when anwesenheit changes
  useEffect(() => {
    if (teilnehmer) {
      const newAttendanceData = new Map<number, AttendanceData>();
      
      // Initialize with default values for all participants
      teilnehmer.forEach((t: Teilnehmer) => {
        newAttendanceData.set(t.id, {
          anwesend: false,
          entschuldigt: false,
          bemerkung: '',
        });
      });

      // Override with existing attendance records if they exist
      if (anwesenheit && anwesenheit.length > 0) {
        anwesenheit.forEach((a: Anwesenheit) => {
          newAttendanceData.set(a.teilnehmerId, {
            anwesend: a.anwesend,
            entschuldigt: a.entschuldigt,
            bemerkung: a.bemerkung || '',
          });
        });
      }

      setAttendanceData(newAttendanceData);
      setHasUnsavedChanges(false);
    }
  }, [anwesenheit, teilnehmer]);

  // Validate date whenever selection changes
  useEffect(() => {
    const error = validateSelectedDate(selectedDate);
    setDateValidationError(error);
    
    if (error) {
      setHasUnsavedChanges(false);
    }
  }, [selectedDate, selectedKursDetails, stundenplan]);

  // Save attendance mutation
  const saveMutation = useMutation({
    mutationFn: (data: BulkAnwesenheitDto) => anwesenheitService.createBulk(data),
    onSuccess: () => {
      toast.success('Anwesenheit erfolgreich gespeichert');
      queryClient.invalidateQueries({ queryKey: ['anwesenheit'] });
      setHasUnsavedChanges(false);
      refetchAttendance();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Fehler beim Speichern der Anwesenheit');
    },
  });

  const handleAttendanceChange = (
    teilnehmerId: number,
    field: 'anwesend' | 'entschuldigt' | 'bemerkung',
    value: boolean | string
  ) => {
    if (dateValidationError) {
      toast.error('Bitte wählen Sie zuerst ein gültiges Datum aus.');
      return;
    }

    const current = attendanceData.get(teilnehmerId) || {
      anwesend: false,
      entschuldigt: false,
      bemerkung: '',
    };

    const updated = { ...current };

    if (field === 'anwesend') {
      updated.anwesend = value as boolean;
      if (value === true) {
        updated.entschuldigt = false;
      }
    } else if (field === 'entschuldigt') {
      updated.entschuldigt = value as boolean;
      if (value === true) {
        updated.anwesend = false;
      }
    } else if (field === 'bemerkung') {
      updated.bemerkung = value as string;
    }

    const newData = new Map(attendanceData);
    newData.set(teilnehmerId, updated);
    setAttendanceData(newData);
    setHasUnsavedChanges(true);
  };

  const handleQuickAction = (action: 'all-present' | 'all-absent') => {
    if (!teilnehmer || dateValidationError) {
      toast.error('Bitte wählen Sie zuerst ein gültiges Datum aus.');
      return;
    }

    const newData = new Map<number, AttendanceData>();
    teilnehmer.forEach((t: Teilnehmer) => {
      const current = attendanceData.get(t.id);
      newData.set(t.id, {
        anwesend: action === 'all-present',
        entschuldigt: false,
        bemerkung: current?.bemerkung || '',
      });
    });
    setAttendanceData(newData);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (dateValidationError) {
      toast.error('Bitte wählen Sie ein gültiges Datum aus.');
      return;
    }

    if (!selectedKurs || !teilnehmer || teilnehmer.length === 0) {
      toast.error('Bitte wählen Sie einen Kurs mit Teilnehmern aus');
      return;
    }

    const attendanceRecords = teilnehmer.map((t: Teilnehmer) => {
      const data = attendanceData.get(t.id) || {
        anwesend: false,
        entschuldigt: false,
        bemerkung: '',
      };
      return {
        teilnehmerId: t.id,
        anwesend: data.anwesend,
        entschuldigt: data.entschuldigt,
        bemerkung: data.bemerkung || '',
      };
    });

    const bulkData: BulkAnwesenheitDto = {
      kursId: selectedKurs,
      datum: format(selectedDate, 'yyyy-MM-dd'),
      attendanceRecords,
    };

    saveMutation.mutate(bulkData);
  };

  const getAttendanceStats = () => {
    if (!teilnehmer) return { present: 0, excused: 0, absent: 0, total: 0 };

    let present = 0;
    let excused = 0;
    let absent = 0;

    teilnehmer.forEach((t: Teilnehmer) => {
      const data = attendanceData.get(t.id);
      if (data?.anwesend) {
        present++;
      } else if (data?.entschuldigt) {
        excused++;
      } else {
        absent++;
      }
    });

    return { present, excused, absent, total: teilnehmer.length };
  };

  const stats = getAttendanceStats();
  const attendanceRate = stats.total > 0 
    ? Math.round((stats.present / stats.total) * 100) 
    : 0;

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setHasUnsavedChanges(false);
    }
  };

  const handleKursChange = (kursId: string) => {
    setSelectedKurs(kursId ? Number(kursId) : null);
    setHasUnsavedChanges(false);
    setDateValidationError(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Anwesenheit erfassen</h1>
        <p className="text-gray-600 mt-1">
          Erfassen und verwalten Sie die Anwesenheit der Kursteilnehmer
        </p>
      </div>

      {/* Selection Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kurs auswählen *
            </label>
            <select
              value={selectedKurs || ''}
              onChange={(e) => handleKursChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={kurseLoading}
            >
              <option value="">Bitte wählen...</option>
              {kurse?.map((kurs: Kurs) => (
                <option key={kurs.id} value={kurs.id}>
                  {kurs.kursName} - {kurs.trainerName} ({kurs.aktuelleTeilnehmer} Teilnehmer)
                </option>
              ))}
            </select>
            {kurseError && (
              <p className="mt-1 text-sm text-red-600">Fehler beim Laden der Kurse</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum *
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="dd.MM.yyyy"
              locale={de}
              filterDate={isDateSelectable}
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                dateValidationError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              customInput={
                <div className="relative">
                  <input
                    type="text"
                    value={format(selectedDate, 'dd.MM.yyyy')}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      dateValidationError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    readOnly
                  />
                  <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              }
              disabled={!selectedKurs || stundenplanLoading}
            />
            {dateValidationError && (
              <div className="mt-1 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{dateValidationError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Course Info and Schedule Info */}
        {selectedKursDetails && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Info className="w-4 h-4" />
                <span>
                  <strong>{selectedKursDetails.kursName}</strong> • 
                  {selectedKursDetails.kurstypName} • 
                  Raum: {selectedKursDetails.kursraumName}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Kurszeitraum: {format(parseISO(selectedKursDetails.startdatum), 'dd.MM.yyyy')} - 
                  {format(parseISO(selectedKursDetails.enddatum), 'dd.MM.yyyy')}
                </span>
              </div>

              {stundenplan && stundenplan.length > 0 && (
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 mt-0.5" />
                  <div>
                    <span className="font-medium">Unterrichtstage: </span>
                    {getValidWeekdays().join(', ')}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {stats.total} Teilnehmer
                    </span>
                  </div>
                  {!dateValidationError && (
                    <div className="text-sm font-medium text-gray-900">
                      Anwesenheitsrate: {attendanceRate}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Bar */}
        {selectedKurs && teilnehmer && teilnehmer.length > 0 && !dateValidationError && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Anwesend: {stats.present}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Entschuldigt: {stats.excused}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Abwesend: {stats.absent}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Ungespeicherte Änderungen
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending || !teilnehmer?.length || !hasUnsavedChanges || !!dateValidationError}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Speichern
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Table */}
      {selectedKurs && !dateValidationError && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Quick Actions Bar */}
          {teilnehmer && teilnehmer.length > 0 && (
            <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Schnellaktionen:</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleQuickAction('all-present')}
                  className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Alle anwesend
                </button>
                <button
                  onClick={() => handleQuickAction('all-absent')}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Alle abwesend
                </button>
              </div>
            </div>
          )}

          {anwesenheitLoading || teilnehmerLoading ? (
            <div className="p-8">
              <LoadingSpinner text="Lade Teilnehmerdaten..." />
            </div>
          ) : teilnehmerError || anwesenheitError ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600">
                Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.
              </p>
            </div>
          ) : !teilnehmer || teilnehmer.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>Keine Teilnehmer in diesem Kurs eingeschrieben</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teilnehmer
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anwesend
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entschuldigt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bemerkung
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teilnehmer.map((t: Teilnehmer) => {
                    const data = attendanceData.get(t.id) || {
                      anwesend: false,
                      entschuldigt: false,
                      bemerkung: '',
                    };
                    
                    return (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {t.vorname[0]}{t.nachname[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {t.vorname} {t.nachname}
                              </div>
                              <div className="text-sm text-gray-500">{t.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleAttendanceChange(t.id, 'anwesend', !data.anwesend)}
                            className={`inline-flex items-center justify-center p-2 rounded-full transition-colors ${
                              data.anwesend
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title={data.anwesend ? 'Als abwesend markieren' : 'Als anwesend markieren'}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleAttendanceChange(t.id, 'entschuldigt', !data.entschuldigt)}
                            className={`inline-flex items-center justify-center p-2 rounded-full transition-colors ${
                              data.entschuldigt
                                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title={data.entschuldigt ? 'Entschuldigung entfernen' : 'Als entschuldigt markieren'}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={data.bemerkung}
                            onChange={(e) => handleAttendanceChange(t.id, 'bemerkung', e.target.value)}
                            placeholder="Optional..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty State when no course selected */}
      {!selectedKurs && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Kurs auswählen
          </h3>
          <p className="text-gray-500">
            Bitte wählen Sie einen Kurs aus, um die Anwesenheit zu erfassen
          </p>
        </div>
      )}

      {/* Empty State for invalid date */}
      {selectedKurs && dateValidationError && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-orange-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ungültiges Datum
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {dateValidationError}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnwesenheitPage;