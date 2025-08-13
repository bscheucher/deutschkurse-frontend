import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, Clock, MapPin, User, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import kursService from '../services/kursService';
import stundenplanService, { StundenplanEntry } from '../services/stundenplanService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { Kurs } from '../types/kurs.types';

interface ScheduleEntry extends StundenplanEntry {
  status: string;
  kurstypName: string;
  trainerName: string;
  kursraumName: string;
}

const Stundenplan: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [filterTrainer, setFilterTrainer] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');

  // Fetch courses to get additional details
  const { data: kurse, isLoading: kurseLoading } = useQuery({
    queryKey: ['kurse', 'active'],
    queryFn: () => kursService.getAllKurse(),
    select: (data: Kurs[]) => data.filter(k => k.status === 'laufend' || k.status === 'geplant')
  });

  // Fetch ALL schedule entries
  const { data: stundenplanEntries, isLoading: stundenplanLoading } = useQuery({
    queryKey: ['stundenplan'],
    queryFn: stundenplanService.getAllStundenplan,
    select: (data: StundenplanEntry[]) => data.filter(s => s.aktiv)
  });

  const isLoading = kurseLoading || stundenplanLoading;

  // Helper function to check if a course is active during the current week
  const isCourseActiveInWeek = (kurs: Kurs, weekStart: Date, weekEnd: Date): boolean => {
    try {
      const courseStart = parseISO(kurs.startdatum);
      const courseEnd = parseISO(kurs.enddatum);
      
      // Check if there's any overlap between course date range and current week
      // Course is active if:
      // 1. Course starts before or during the week AND course ends during or after the week
      return courseStart <= weekEnd && courseEnd >= weekStart;
    } catch (error) {
      console.warn('Error parsing course dates:', error);
      return false; // Don't show courses with invalid dates
    }
  };

  // Combine schedule entries with course details and filter by date
  const generateScheduleData = (): ScheduleEntry[] => {
    if (!kurse || !stundenplanEntries) return [];

    const scheduleEntries: ScheduleEntry[] = [];
    
    // Get current week boundaries
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Sunday end

    stundenplanEntries.forEach((stundenplan: StundenplanEntry) => {
      const kurs = kurse.find(k => k.id === stundenplan.kursId);
      
      if (kurs && isCourseActiveInWeek(kurs, weekStart, weekEnd)) {
        scheduleEntries.push({
          ...stundenplan,
          status: kurs.status,
          kurstypName: kurs.kurstypName,
          trainerName: kurs.trainerName,
          kursraumName: kurs.kursraumName
        });
      }
    });

    return scheduleEntries;
  };

  const scheduleData = generateScheduleData();

  // Filter schedule data by trainer and room
  const filteredSchedule = scheduleData.filter((entry: ScheduleEntry) => {
    const matchesTrainer = filterTrainer === 'all' || entry.trainerName === filterTrainer;
    const matchesRoom = filterRoom === 'all' || entry.kursraumName === filterRoom;
    return matchesTrainer && matchesRoom;
  });

  // Get unique trainers and rooms for filters (from currently active courses only)
  const trainers = [...new Set(scheduleData.map((s: ScheduleEntry) => s.trainerName))];
  const rooms = [...new Set(scheduleData.map((s: ScheduleEntry) => s.kursraumName))];

  const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7; // Start from 07:00
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getScheduleForDayAndTime = (day: string, time: string): ScheduleEntry[] => {
    return filteredSchedule.filter((entry: ScheduleEntry) => {
      // Convert time strings to comparable format (HH:MM)
      const entryStartTime = entry.startzeit.substring(0, 5); // Get HH:MM from HH:MM:SS
      const entryEndTime = entry.endzeit.substring(0, 5);
      const currentTime = time.substring(0, 5);
      
      return entry.wochentag === day && 
             entryStartTime <= currentTime && 
             entryEndTime > currentTime;
    });
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  // Calculate statistics for current week
  const getWeekStatistics = () => {
    const totalScheduleEntries = scheduleData.length;
    const activeCourses = new Set(scheduleData.map(s => s.kursId)).size;
    const activeTrainers = new Set(scheduleData.map(s => s.trainerName)).size;
    
    return {
      totalEntries: totalScheduleEntries,
      activeCourses,
      activeTrainers
    };
  };

  const weekStats = getWeekStatistics();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stundenplan</h1>
        <p className="text-gray-600 mt-1">Übersicht über alle laufenden und geplanten Kurse</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Week Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h3 className="font-medium">
                  {format(weekStart, 'dd. MMM', { locale: de })} - 
                  {format(addDays(weekStart, 4), 'dd. MMM yyyy', { locale: de })}
                </h3>
                <p className="text-sm text-gray-500">Kalenderwoche {format(currentWeek, 'w')}</p>
              </div>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterTrainer}
                  onChange={(e) => setFilterTrainer(e.target.value)}
                  className="text-sm px-3 py-1 border border-gray-300 rounded-md"
                >
                  <option value="all">Alle Trainer</option>
                  {trainers.map((trainer: string) => (
                    <option key={trainer} value={trainer}>{trainer}</option>
                  ))}
                </select>
              </div>
              <select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                className="text-sm px-3 py-1 border border-gray-300 rounded-md"
              >
                <option value="all">Alle Räume</option>
                {rooms.map((room: string) => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'week' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Woche
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'day' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tag
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="overflow-x-auto overflow-y-visible" style={{ minWidth: '100%' }}>
          {/* Desktop View */}
          <div className="hidden md:block">
            <table className="w-full table-fixed" style={{ minWidth: '1000px' }}>
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 flex-shrink-0">
                    Zeit
                  </th>
                  {weekdays.map((day: string) => (
                    <th key={day} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '19.2%' }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map((time: string) => (
                  <tr key={time}>
                    <td className="px-2 py-2 text-sm text-gray-500 font-medium whitespace-nowrap bg-gray-50 w-16 flex-shrink-0">
                      {time}
                    </td>
                    {weekdays.map((day: string) => {
                      const entries = getScheduleForDayAndTime(day, time);
                      return (
                        <td key={`${day}-${time}`} className="px-1 py-2 relative min-h-[60px] align-top" style={{ width: '19.2%' }}>
                          {entries.map((entry: ScheduleEntry) => (
                            <div
                              key={entry.id}
                              className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer transition-colors text-xs"
                              title={`${entry.kursName} - ${entry.trainerName} - ${entry.kursraumName}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {entry.kursName}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1 truncate">
                                    {entry.kurstypName}
                                  </p>
                                  <div className="mt-1 space-y-1">
                                    <div className="flex items-center text-xs text-gray-500 truncate">
                                      <User className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">{entry.trainerName}</span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 truncate">
                                      <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">{entry.kursraumName}</span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="text-xs">{entry.startzeit.substring(0, 5)} - {entry.endzeit.substring(0, 5)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-1 flex-shrink-0">
                                  <StatusBadge status={entry.status} variant="kurs" />
                                </div>
                              </div>
                              {entry.bemerkungen && (
                                <div className="mt-1 text-xs text-gray-500 italic truncate">
                                  {entry.bemerkungen}
                                </div>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View - List format */}
          <div className="block md:hidden">
            {weekdays.map((day: string) => (
              <div key={day} className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 px-4 py-2 bg-gray-50 rounded-t-lg">
                  {day}
                </h4>
                <div className="space-y-2">
                  {timeSlots.map((time: string) => {
                    const entries = getScheduleForDayAndTime(day, time);
                    if (entries.length === 0) return null;
                    
                    return (
                      <div key={`${day}-${time}`} className="px-4">
                        <div className="text-sm font-medium text-gray-500 mb-2">{time}</div>
                        {entries.map((entry: ScheduleEntry) => (
                          <div key={entry.id} className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="text-sm font-medium text-gray-900">{entry.kursName}</h5>
                              <StatusBadge status={entry.status} variant="kurs" />
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>{entry.kurstypName}</div>
                              <div className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {entry.trainerName}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {entry.kursraumName}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {entry.startzeit.substring(0, 5)} - {entry.endzeit.substring(0, 5)}
                              </div>
                              {entry.bemerkungen && (
                                <div className="italic text-gray-500">{entry.bemerkungen}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Week Statistics */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Wochenstatistiken</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-gray-600">Aktive Kurse:</span>
            <span className="font-semibold text-blue-600">{weekStats.activeCourses}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-gray-600">Trainer im Einsatz:</span>
            <span className="font-semibold text-green-600">{weekStats.activeTrainers}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="text-gray-600">Gesamt Termine:</span>
            <span className="font-semibold text-purple-600">{weekStats.totalEntries}</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Legende</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <StatusBadge status="geplant" />
            <span className="ml-2 text-gray-600">Geplant</span>
          </div>
          <div className="flex items-center">
            <StatusBadge status="laufend" />
            <span className="ml-2 text-gray-600">Laufend</span>
          </div>
          <div className="flex items-center">
            <User className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-gray-600">Trainer</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-gray-600">Raum</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-gray-600">Nur Kurse im aktuellen Zeitraum</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stundenplan;