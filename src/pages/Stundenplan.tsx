// src/pages/Stundenplan.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, Clock, MapPin, User, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import kursService from '../services/kursService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { Kurs } from '../types/kurs.types';

interface ScheduleEntry {
  id: number;
  kursId: number;
  kursName: string;
  kurstypName: string;
  trainerName: string;
  kursraumName: string;
  wochentag: string;
  startzeit: string;
  endzeit: string;
  status: string;
}

const Stundenplan: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [filterTrainer, setFilterTrainer] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');

  // FIXED: React Query v5 syntax - Fetch courses to generate schedule
  const { data: kurse, isLoading } = useQuery({
    queryKey: ['kurse', 'laufend'],
    queryFn: () => kursService.getAllKurse(),
    select: (data: Kurs[]) => data.filter(k => k.status === 'laufend' || k.status === 'geplant')
  });

  // Mock schedule data generation from courses
  const generateScheduleData = (): ScheduleEntry[] => {
    if (!kurse) return [];

    const scheduleEntries: ScheduleEntry[] = [];
    const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
    const timeSlots = [
      { start: '09:00', end: '12:00' },
      { start: '13:00', end: '16:00' },
      { start: '17:00', end: '20:00' }
    ];

    kurse.forEach((kurs: Kurs, index: number) => {
      // Assign courses to different weekdays and time slots
      const dayIndex = index % weekdays.length;
      const slotIndex = Math.floor(index / weekdays.length) % timeSlots.length;

      scheduleEntries.push({
        id: kurs.id,
        kursId: kurs.id,
        kursName: kurs.kursName,
        kurstypName: kurs.kurstypName,
        trainerName: kurs.trainerName,
        kursraumName: kurs.kursraumName,
        wochentag: weekdays[dayIndex],
        startzeit: timeSlots[slotIndex].start,
        endzeit: timeSlots[slotIndex].end,
        status: kurs.status
      });
    });

    return scheduleEntries;
  };

  const scheduleData = generateScheduleData();

  // Filter schedule data
  const filteredSchedule = scheduleData.filter((entry: ScheduleEntry) => {
    const matchesTrainer = filterTrainer === 'all' || entry.trainerName === filterTrainer;
    const matchesRoom = filterRoom === 'all' || entry.kursraumName === filterRoom;
    return matchesTrainer && matchesRoom;
  });

  // Get unique trainers and rooms for filters
  const trainers = [...new Set(scheduleData.map((s: ScheduleEntry) => s.trainerName))];
  const rooms = [...new Set(scheduleData.map((s: ScheduleEntry) => s.kursraumName))];

  const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getScheduleForDayAndTime = (day: string, time: string): ScheduleEntry[] => {
    return filteredSchedule.filter((entry: ScheduleEntry) => 
      entry.wochentag === day && 
      entry.startzeit <= time && 
      entry.endzeit > time
    );
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

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
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zeit
                </th>
                {weekdays.map((day: string) => (
                  <th key={day} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map((time: string) => (
                <tr key={time}>
                  <td className="px-4 py-2 text-sm text-gray-500 font-medium whitespace-nowrap">
                    {time}
                  </td>
                  {weekdays.map((day: string) => {
                    const entries = getScheduleForDayAndTime(day, time);
                    return (
                      <td key={`${day}-${time}`} className="px-4 py-2 relative">
                        {entries.map((entry: ScheduleEntry) => (
                          <div
                            key={entry.id}
                            className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {entry.kursName}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {entry.kurstypName}
                                </p>
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center text-xs text-gray-500">
                                    <User className="w-3 h-3 mr-1" />
                                    {entry.trainerName}
                                  </div>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {entry.kursraumName}
                                  </div>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {entry.startzeit} - {entry.endzeit}
                                  </div>
                                </div>
                              </div>
                              <StatusBadge status={entry.status} variant="kurs" />
                            </div>
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
        </div>
      </div>
    </div>
  );
};

export default Stundenplan;