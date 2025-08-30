// Enhanced Dashboard.tsx with complete implementation - Removed Success Rate
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate , useLocation} from 'react-router-dom';
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
  BookOpen, Users, School, Calendar, Target,
  RefreshCw, Download, Activity, Plus,
  TrendingUp, TrendingDown, ArrowRight, Info,
  CheckCircle, AlertTriangle, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import useDashboard, { useDashboardCalculations } from '../hooks/useDashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

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

// Extended interface for stats to include attendanceDetails
interface ExtendedDashboardStats {
  activeKurse: number;
  totalTeilnehmer: number;
  availableTrainer: number;
  avgAttendance: number;
  upcomingKurse: any[];
  recentEnrollments: number;
  coursesThisMonth: number;
  trends: {
    kurseChange: number;
    teilnehmerChange: number;
    attendanceChange: number;
  };
  attendanceDetails?: {
    totalSessions: number;
    presentSessions: number;
    excusedSessions: number;
    unexcusedSessions: number;
    averageByWeekday: Record<string, number>;
    courseAttendanceRates: Array<{
      kursId: number;
      kursName: string;
      attendanceRate: number;
      totalSessions: number;
    }>;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false);
  
  const {
    stats,
    chartData,
    recentActivity,
    isPending,
    hasErrors,
    refresh,
    exportData,
    timeRange,
    setTimeRange,
    autoRefresh,
    toggleAutoRefresh,
    isRefreshing
  } = useDashboard({
    autoRefresh: true,
    refreshInterval: 30000,
    timeRange: '7d'
  });

  const { getKpiSummary } = useDashboardCalculations(stats);
  const kpiSummary = getKpiSummary();

  console.log('Dashboard render:', { 
    isPending, 
    hasErrors, 
    hasStats: !!stats, 
    hasChartData: !!chartData,
    hasActivity: !!recentActivity 
  });

  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip refresh on initial mount (data is already loading)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Refetch dashboard data when navigating back to dashboard
    if (location.pathname === '/dashboard') {
      console.log('Navigated to dashboard, refreshing data...');
      refresh();
    }
}, [location.pathname, refresh]);

  // Show loading state only if we have no data at all
  if (isPending && !stats) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner text="Lade Dashboard..." />
      </div>
    );
  }

  // Show error state only if we have critical errors and no fallback data
  if (hasErrors && !stats) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={refresh}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Erneut versuchen
          </button>
        </div>
        <ErrorMessage 
          message="Dashboard-Daten konnten nicht geladen werden. Versuchen Sie es erneut oder wenden Sie sich an den Support."
          type="error"
        />
      </div>
    );
  }


  // Cast stats to extended type for attendanceDetails access
  const extendedStats = stats as ExtendedDashboardStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader 
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={toggleAutoRefresh}
        onRefresh={refresh}
        onExport={() => exportData('json')}
        isRefreshing={isRefreshing}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* Quick Actions */}
      <QuickActions onNavigate={navigate} />

      {/* Stats Grid with Enhanced Attendance */}
      {stats && (
        <StatsGrid 
          stats={extendedStats} 
          kpiSummary={kpiSummary}
          onNavigate={navigate}
          onShowAttendanceDetails={() => setShowAttendanceDetails(true)}
        />
      )}

      {/* Enhanced Attendance Details Modal */}
      {showAttendanceDetails && extendedStats?.attendanceDetails && (
        <AttendanceDetailsModal
          attendanceDetails={extendedStats.attendanceDetails}
          avgAttendance={extendedStats.avgAttendance}
          onClose={() => setShowAttendanceDetails(false)}
        />
      )}

      {/* Charts with Enhanced Attendance Visualization */}
      {chartData && (
        <EnhancedChartsSection 
          chartData={chartData} 
          timeRange={timeRange}
          attendanceDetails={extendedStats?.attendanceDetails}
        />
      )}

      {/* Recent Activity & Upcoming Courses */}
      <BottomSection 
        recentActivity={recentActivity}
        upcomingCourses={extendedStats?.upcomingKurse}
        onNavigate={navigate}
      />
    </div>
  );
};

// Header Component
interface DashboardHeaderProps {
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  onExport: () => void;
  isRefreshing: boolean;
  timeRange: '7d' | '30d' | '90d';
  onTimeRangeChange: (range: '7d' | '30d' | '90d') => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  onExport,
  isRefreshing,
  timeRange,
  onTimeRangeChange
}) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-600">
        Willkommen zurück! Hier ist Ihre Übersicht.
        {autoRefresh && (
          <span className="ml-2 text-sm text-green-600">● Live-Updates aktiv</span>
        )}
      </p>
    </div>
    
    <div className="flex items-center space-x-3">
      <select
        value={timeRange}
        onChange={(e) => onTimeRangeChange(e.target.value as '7d' | '30d' | '90d')}
        className="text-sm px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="7d">7 Tage</option>
        <option value="30d">30 Tage</option>
        <option value="90d">90 Tage</option>
      </select>
      
      <button
        onClick={onToggleAutoRefresh}
        className={`p-2 rounded-md ${
          autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
        }`}
        title={autoRefresh ? 'Auto-Update deaktivieren' : 'Auto-Update aktivieren'}
      >
        <Activity className="w-4 h-4" />
      </button>
      
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Aktualisieren
      </button>
      
      <button
        onClick={onExport}
        className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </button>
    </div>
  </div>
);

// Quick Actions Component
interface QuickActionsProps {
  onNavigate: (path: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <h3 className="text-sm font-medium text-gray-900 mb-3">Schnellaktionen</h3>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <QuickActionButton
        icon={Plus}
        label="Neuer Kurs"
        color="blue"
        onClick={() => onNavigate('/kurse')}
      />
      <QuickActionButton
        icon={Users}
        label="Teilnehmer"
        color="green"
        onClick={() => onNavigate('/teilnehmer/new')}
      />
      <QuickActionButton
        icon={Calendar}
        label="Anwesenheit"
        color="purple"
        onClick={() => onNavigate('/anwesenheit')}
      />
      <QuickActionButton
        icon={School}
        label="Stundenplan"
        color="orange"
        onClick={() => onNavigate('/stundenplan')}
      />
    </div>
  </div>
);

const QuickActionButton: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  onClick: () => void;
}> = ({ icon: Icon, label, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
    green: 'bg-green-50 hover:bg-green-100 text-green-600',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-600',
    orange: 'bg-orange-50 hover:bg-orange-100 text-orange-600',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center p-3 rounded-lg transition-colors ${colorClasses[color]}`}
    >
      <Icon className="w-5 h-5 mr-2" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

// Enhanced Stats Grid - Removed Success Rate
interface StatsGridProps {
  stats: ExtendedDashboardStats;
  kpiSummary: any;
  onNavigate: (path: string) => void;
  onShowAttendanceDetails?: () => void;
}

const StatsGrid: React.FC<StatsGridProps> = ({ 
  stats, 
  kpiSummary, 
  onNavigate, 
  onShowAttendanceDetails 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <StatCard
      title="Aktive Kurse"
      value={stats.activeKurse}
      change={stats.trends.kurseChange}
      icon={BookOpen}
      color="blue"
      onClick={() => onNavigate('/kurse')}
    />
    <StatCard
      title="Teilnehmer Gesamt"
      value={stats.totalTeilnehmer}
      change={stats.trends.teilnehmerChange}
      icon={Users}
      color="purple"
      onClick={() => onNavigate('/teilnehmer')}
    />
    <EnhancedAttendanceStatCard
      title="Ø Anwesenheit"
      avgAttendance={stats.avgAttendance}
      change={stats.trends.attendanceChange}
      attendanceDetails={stats.attendanceDetails}
      kpiStatus={kpiSummary?.attendance}
      onClick={() => onNavigate('/anwesenheit')}
      onShowDetails={onShowAttendanceDetails}
    />
  </div>
);

// Regular StatCard Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'purple' | 'green' | 'orange';
  status?: any;
  onClick?: () => void;
}> = ({ title, value, change, icon: Icon, color, status, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div 
      className={`bg-white p-6 rounded-lg shadow ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              {change > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : change < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              ) : null}
              <span className={`text-xs ${
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change > 0 ? '+' : ''}{change}% zum Vormonat
              </span>
            </div>
          )}
          {status && (
            <div className="mt-1">
              <span className={`text-xs px-2 py-1 rounded-full bg-${status.color}-100 text-${status.color}-700`}>
                {status.text}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Enhanced Attendance Stat Card with more details
const EnhancedAttendanceStatCard: React.FC<{
  title: string;
  avgAttendance: number;
  change?: number;
  attendanceDetails?: ExtendedDashboardStats['attendanceDetails'];
  kpiStatus?: any;
  onClick?: () => void;
  onShowDetails?: () => void;
}> = ({ title, avgAttendance, change, attendanceDetails, kpiStatus, onClick, onShowDetails }) => {
  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceIcon = (rate: number) => {
    if (rate >= 90) return CheckCircle;
    if (rate >= 80) return AlertTriangle;
    return XCircle;
  };

  const AttendanceIcon = getAttendanceIcon(avgAttendance);

  return (
    <div 
      className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {onShowDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowDetails();
                }}
                className="text-gray-400 hover:text-blue-600 p-1"
                title="Details anzeigen"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <p className={`text-2xl font-bold ${getAttendanceColor(avgAttendance)}`}>
              {avgAttendance}%
            </p>
            <AttendanceIcon className={`w-5 h-5 ${getAttendanceColor(avgAttendance)}`} />
          </div>
          
          {change !== undefined && (
            <div className="flex items-center mt-1">
              {change > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : change < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              ) : null}
              <span className={`text-xs ${
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change > 0 ? '+' : ''}{change}% zum Vormonat
              </span>
            </div>
          )}

          {/* Quick attendance summary */}
          {attendanceDetails && (
            <div className="mt-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Anwesend: {attendanceDetails.presentSessions}</span>
                <span>Gesamt: {attendanceDetails.totalSessions}</span>
              </div>
            </div>
          )}

          {kpiStatus && (
            <div className="mt-1">
              <span className={`text-xs px-2 py-1 rounded-full bg-${kpiStatus.color}-100 text-${kpiStatus.color}-700`}>
                {kpiStatus.text}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-full bg-green-100 text-green-600">
          <Target className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Attendance Details Modal
const AttendanceDetailsModal: React.FC<{
  attendanceDetails: NonNullable<ExtendedDashboardStats['attendanceDetails']>;
  avgAttendance: number;
  onClose: () => void;
}> = ({ attendanceDetails, avgAttendance, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Anwesenheits-Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{avgAttendance}%</p>
            <p className="text-sm text-green-700">Durchschnitt</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{attendanceDetails.presentSessions}</p>
            <p className="text-sm text-blue-700">Anwesend</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-600">{attendanceDetails.excusedSessions}</p>
            <p className="text-sm text-yellow-700">Entschuldigt</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{attendanceDetails.unexcusedSessions}</p>
            <p className="text-sm text-red-700">Unentschuldigt</p>
          </div>
        </div>

        {/* Weekday Breakdown */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Anwesenheit nach Wochentag</h4>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(attendanceDetails.averageByWeekday).map(([day, rate]) => (
              <div key={day} className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-lg font-bold text-gray-900">{rate as number}%</p>
                <p className="text-xs text-gray-600">{day}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Course-specific Attendance */}
        {attendanceDetails.courseAttendanceRates?.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Anwesenheit nach Kurs</h4>
            <div className="space-y-2">
              {attendanceDetails.courseAttendanceRates.map((course: any) => (
                <div key={course.kursId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{course.kursName}</p>
                    <p className="text-sm text-gray-600">{course.totalSessions} Einheiten</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      course.attendanceRate >= 90 ? 'text-green-600' :
                      course.attendanceRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {Math.round(course.attendanceRate)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Enhanced Charts Section with attendance focus
const EnhancedChartsSection: React.FC<{
  chartData: any;
  timeRange: string;
  attendanceDetails?: ExtendedDashboardStats['attendanceDetails'];
}> = ({ chartData, timeRange, attendanceDetails }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6B7280' } },
      y: { 
        beginAtZero: true, 
        max: 100, // For attendance percentage
        grid: { color: 'rgba(107, 114, 128, 0.1)' }, 
        ticks: { 
          color: '#6B7280',
          callback: function(value: any) {
            return value + '%';
          }
        } 
      },
    },
  };

  // Enhanced attendance trend data
  const attendanceData = {
    labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr'],
    datasets: [{
      label: 'Anwesenheitsrate (%)',
      data: chartData.attendanceTrend,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: chartData.attendanceTrend.map((rate: number) => 
        rate >= 90 ? 'rgb(34, 197, 94)' : 
        rate >= 80 ? 'rgb(251, 146, 60)' : 'rgb(239, 68, 68)'
      ),
      pointRadius: 6,
    }],
  };

  // Weekday attendance breakdown
  const weekdayAttendanceData = attendanceDetails?.averageByWeekday ? {
    labels: Object.keys(attendanceDetails.averageByWeekday),
    datasets: [{
      label: 'Anwesenheit (%)',
      data: Object.values(attendanceDetails.averageByWeekday),
      backgroundColor: Object.values(attendanceDetails.averageByWeekday).map((rate: any) => 
        rate >= 90 ? 'rgba(34, 197, 94, 0.8)' : 
        rate >= 80 ? 'rgba(251, 146, 60, 0.8)' : 'rgba(239, 68, 68, 0.8)'
      ),
      borderRadius: 4,
    }],
  } : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Main attendance trend */}
      <ChartCard title={`Anwesenheitstrend (${timeRange})`}>
        <div className="h-64">
          <Line data={attendanceData} options={chartOptions} />
        </div>
      </ChartCard>

      {/* Weekday attendance breakdown */}
      {weekdayAttendanceData && (
        <ChartCard title="Anwesenheit nach Wochentag">
          <div className="h-64">
            <Bar data={weekdayAttendanceData} options={chartOptions} />
          </div>
        </ChartCard>
      )}

      {/* Course distribution */}
      <ChartCard title="Kursverteilung nach Level">
        <div className="h-64">
          <Doughnut 
            data={{
              labels: ['A1', 'A2', 'B1', 'B2', 'C1'],
              datasets: [{
                data: chartData.courseDistribution,
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(34, 197, 94, 0.8)',
                  'rgba(251, 146, 60, 0.8)',
                  'rgba(168, 85, 247, 0.8)',
                  'rgba(239, 68, 68, 0.8)',
                ],
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'right' as const } },
            }} 
          />
        </div>
      </ChartCard>

      {/* Monthly enrollments */}
      <ChartCard title="Monatliche Anmeldungen">
        <div className="h-64">
          <Bar 
            data={{
              labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
              datasets: [{
                label: 'Neue Anmeldungen',
                data: chartData.monthlyEnrollments,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 4,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true },
              },
            }} 
          />
        </div>
      </ChartCard>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-6 border-b">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// Bottom Section Component
interface BottomSectionProps {
  recentActivity?: any[];
  upcomingCourses?: any[];
  onNavigate: (path: string) => void;
}

const BottomSection: React.FC<BottomSectionProps> = ({ recentActivity, upcomingCourses, onNavigate }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Recent Activity */}
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Letzte Aktivitäten</h3>
      </div>
      <div className="p-6">
        {recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(activity.timestamp), 'dd.MM.yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Keine aktuellen Aktivitäten</p>
        )}
      </div>
    </div>

    {/* Upcoming Courses */}
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Kommende Kurse</h3>
          <button
            onClick={() => onNavigate('/kurse')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            Alle anzeigen
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
      <div className="p-6">
        {upcomingCourses && upcomingCourses.length > 0 ? (
          <div className="space-y-4">
            {upcomingCourses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onNavigate(`/kurse/${course.id}`)}
              >
                <h4 className="text-sm font-medium text-gray-900">{course.name}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(course.startTime), 'dd.MM.yyyy HH:mm')} • {course.room}
                </p>
                <p className="text-xs text-gray-500">
                  {course.participants} Teilnehmer • {course.trainer}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Keine geplanten Kurse</p>
        )}
      </div>
    </div>
  </div>
);

export default Dashboard;