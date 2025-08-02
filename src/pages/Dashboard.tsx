import React from 'react';
import { useQuery } from '@tanstack/react-query'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  BookOpen, Users, School, Calendar, TrendingUp, 
  Clock, Award, Target
} from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import dashboardService from '../services/dashboardService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery(
    'dashboardStats',
    dashboardService.getDashboardStats
  );

  const { data: chartData } = useQuery(
    'dashboardCharts',
    dashboardService.getChartData
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Attendance trend chart data
  const attendanceTrendData = {
    labels: eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    }).map(date => format(date, 'EEE', { locale: de })),
    datasets: [
      {
        label: 'Anwesenheitsrate (%)',
        data: chartData?.attendanceTrend || [92, 88, 95, 91, 89, 94, 93],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Course distribution chart data
  const courseDistributionData = {
    labels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    datasets: [
      {
        data: chartData?.courseDistribution || [12, 8, 15, 10, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  // Monthly enrollments chart data
  const monthlyEnrollmentsData = {
    labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Neue Anmeldungen',
        data: chartData?.monthlyEnrollments || [45, 52, 48, 58, 62, 55],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Willkommen zurück! Hier ist Ihre Übersicht.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Kurse</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeKurse || 0}</p>
              <p className="text-xs text-green-600 mt-1">+12% zum Vormonat</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Teilnehmer Gesamt</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalTeilnehmer || 0}</p>
              <p className="text-xs text-green-600 mt-1">+8% zum Vormonat</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ø Anwesenheit</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.avgAttendance || 0}%</p>
              <p className="text-xs text-red-600 mt-1">-2% zum Vormonat</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Erfolgsquote</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.successRate || 0}%</p>
              <p className="text-xs text-green-600 mt-1">+5% zum Vormonat</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Anwesenheitstrend</h3>
          <Line 
            data={attendanceTrendData} 
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                },
              },
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kursverteilung nach Level</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut 
              data={courseDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monatliche Anmeldungen</h3>
          <Bar 
            data={monthlyEnrollmentsData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nächste Kurse</h3>
          <div className="space-y-4">
            {stats?.upcomingKurse?.map((kurs: any) => (
              <div key={kurs.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{kurs.name}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(kurs.startTime), 'HH:mm')} - {kurs.room}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;