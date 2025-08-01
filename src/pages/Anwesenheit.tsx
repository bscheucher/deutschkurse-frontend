import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import { Calendar, Check, X, Save, Loader } from 'lucide-react';
import anwesenheitService from '../services/anwesenheitService';
import kursService from '../services/kursService';
import { Anwesenheit, BulkAnwesenheitDto } from '../types/anwesenheit.types';
import { Kurs } from '../types/kurs.types';

const AnwesenheitPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedKurs, setSelectedKurs] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<Map<number, {
    anwesend: boolean;
    entschuldigt: boolean;
    bemerkung: string;
  }>>(new Map());

  // Fetch courses
  const { data: kurse, isLoading: kurseLoading } = useQuery(
    'kurse',
    () => kursService.getAllKurse(),
    {
      select: (data) => data.filter(k => k.status === 'laufend'),
    }
  );

  // Fetch attendance for selected course and date
  const { data: anwesenheit, isLoading: anwesenheitLoading, refetch } = useQuery(
    ['anwesenheit', selectedKurs, format(selectedDate, 'yyyy-MM-dd')],
    () => anwesenheitService.getByKursAndDatum(
      selectedKurs!,
      format(selectedDate, 'yyyy-MM-dd')
    ),
    {
      enabled: !!selectedKurs,
      onSuccess: (data) => {
        // Initialize attendance data
        const newAttendanceData = new Map();
        data.forEach((a) => {
          newAttendanceData.set(a.teilnehmerId, {
            anwesend: a.anwesend,
            entschuldigt: a.entschuldigt,
            bemerkung: a.bemerkung || '',
          });
        });
        setAttendanceData(newAttendanceData);
      },
    }
  );

  // Fetch participants for selected course
  const { data: teilnehmer } = useQuery(
    ['kursTeilnehmer', selectedKurs],
    () => kursService.getTeilnehmerInKurs(selectedKurs!),
    {
      enabled: !!selectedKurs,
    }
  );

  // Save attendance mutation
  const saveMutation = useMutation(
    (data: BulkAnwesenheitDto) => anwesenheitService.createBulk(data),
    {
      onSuccess: () => {
        toast.success('Anwesenheit erfolgreich gespeichert');
        queryClient.invalidateQueries(['anwesenheit']);
      },
      onError: () => {
        toast.error('Fehler beim Speichern der Anwesenheit');
      },
    }
  );

  const handleAttendanceChange = (
    teilnehmerId: number,
    field: 'anwesend' | 'entschuldigt' | 'bemerkung',
    value: boolean | string
  ) => {
    const current = attendanceData.get(teilnehmerId) || {
      anwesend: true,
      entschuldigt: false,
      bemerkung: '',
    };

    const updated = { ...current, [field]: value };
    
    // If marking as absent, ensure not marked as present
    if (field === 'entschuldigt' && value === true) {
      updated.anwesend = false;
    }
    // If marking as present, ensure not marked as excused
    if (field === 'anwesend' && value === true) {
      updated.entschuldigt = false;
    }

    const newData = new Map(attendanceData);
    newData.set(teilnehmerId, updated);
    setAttendanceData(newData);
  };

  const handleSave = () => {
    if (!selectedKurs || !teilnehmer) return;

    const attendanceRecords = teilnehmer.map((t) => {
      const data = attendanceData.get(t.id) || {
        anwesend: true,
        entschuldigt: false,
        bemerkung: '',
      };
      return {
        teilnehmerId: t.id,
        ...data,
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
    if (!teilnehmer) return { present: 0, excused: 0, absent: 0 };

    let present = 0;
    let excused = 0;
    let absent = 0;

    teilnehmer.forEach((t) => {
      const data = attendanceData.get(t.id);
      if (data?.anwesend) {
        present++;
      } else if (data?.entschuldigt) {
        excused++;
      } else {
        absent++;
      }
    });

    return { present, excused, absent };
  };

  const stats = getAttendanceStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Anwesenheit erfassen</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kurs auswählen
            </label>
            <select
              value={selectedKurs || ''}
              onChange={(e) => setSelectedKurs(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Bitte wählen...</option>
              {kurse?.map((kurs) => (
                <option key={kurs.id} value={kurs.id}>
                  {kurs.kursName} - {kurs.trainerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              dateFormat="dd.MM.yyyy"
              locale={de}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              customInput={
                <div className="relative">
                  <input
                    type="text"
                    value={format(selectedDate, 'dd.MM.yyyy')}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                  <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              }
            />
          </div>
        </div>

        {selectedKurs && (
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
            <button
              onClick={handleSave}
              disabled={saveMutation.isLoading || !teilnehmer?.length}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saveMutation.isLoading ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Speichern
            </button>
          </div>
        )}
      </div>

      {selectedKurs && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {anwesenheitLoading ? (
            <div className="p-8 text-center">
              <Loader className="w-8 h-8 mx-auto animate-spin text-blue-500" />
            </div>
          ) : (
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
                {teilnehmer?.map((t) => {
                  const data = attendanceData.get(t.id) || {
                    anwesend: true,
                    entschuldigt: false,
                    bemerkung: '',
                  };
                  return (
                    <tr key={t.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {t.vorname} {t.nachname}
                        </div>
                        <div className="text-sm text-gray-500">{t.email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleAttendanceChange(t.id, 'anwesend', !data.anwesend)}
                          className={`p-2 rounded-full ${
                            data.anwesend
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleAttendanceChange(t.id, 'entschuldigt', !data.entschuldigt)}
                          className={`p-2 rounded-full ${
                            data.entschuldigt
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}
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
          )}
        </div>
      )}
    </div>
  );
};

export default AnwesenheitPage;