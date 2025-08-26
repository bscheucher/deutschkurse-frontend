// Extract this into a separate component file: src/components/dashboard/EnhancedChartsSection.tsx
import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Calendar, Info } from 'lucide-react';

interface ChartData {
  attendanceTrend: number[];
  attendanceTrendLabels: string[];
  courseDistribution: number[];
  monthlyEnrollments: number[];
  trainerUtilization: {
    labels: string[];
    data: number[];
  };
  weeklyAttendanceTrend: {
    labels: string[];
    data: number[];
    dates: string[];
  };
  attendanceByLevel: {
    labels: string[];
    data: number[];
  };
}

interface AttendanceDetails {
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
}

interface EnhancedChartsSectionProps {
  chartData: ChartData;
  timeRange: '7d' | '30d' | '90d';
  attendanceDetails?: AttendanceDetails;
}

export const EnhancedChartsSection: React.FC<EnhancedChartsSectionProps> = ({ 
  chartData, 
  timeRange, 
  attendanceDetails 
}) => {
  // Enhanced chart options with better styling
  const attendanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const label = context.label;
            
            // Add emoji indicators for performance
            let emoji = '';
            if (value >= 90) emoji = '🟢';
            else if (value >= 80) emoji = '🟡';
            else emoji = '🔴';
            
            return `${emoji} ${label}: ${value}%`;
          },
          afterLabel: function(context: any) {
            const value = context.parsed.y;
            if (value >= 90) return 'Ausgezeichnet!';
            else if (value >= 80) return 'Gut';
            else if (value >= 70) return 'Verbesserungsbedarf';
            else return 'Kritisch';
          }
        }
      },
    },
    scales: {
      x: { 
        grid: { 
          display: false 
        }, 
        ticks: { 
          color: '#6B7280',
          font: {
            size: 11
          }
        } 
      },
      y: { 
        beginAtZero: true, 
        max: 100,
        grid: { 
          color: 'rgba(107, 114, 128, 0.1)' 
        }, 
        ticks: { 
          color: '#6B7280',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return value + '%';
          },
          stepSize: 20
        } 
      },
    },
  };

  // Prepare attendance trend data with dynamic colors
  const attendanceData = {
    labels: chartData.attendanceTrendLabels || chartData.attendanceTrend.map((_, i) => `Tag ${i + 1}`),
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
      pointBorderColor: chartData.attendanceTrend.map((rate: number) => 
        rate >= 90 ? 'rgb(34, 197, 94)' : 
        rate >= 80 ? 'rgb(251, 146, 60)' : 'rgb(239, 68, 68)'
      ),
      pointRadius: 6,
      pointHoverRadius: 8,
      borderWidth: 2,
    }],
  };

  // Calculate average attendance for the period
  const avgAttendance = chartData.attendanceTrend.length > 0
    ? Math.round(chartData.attendanceTrend.reduce((a, b) => a + b, 0) / chartData.attendanceTrend.length)
    : 0;

  // Find highest and lowest attendance
  const maxAttendance = Math.max(...chartData.attendanceTrend);
  const minAttendance = Math.min(...chartData.attendanceTrend);
  const maxDay = chartData.attendanceTrendLabels?.[chartData.attendanceTrend.indexOf(maxAttendance)] || '';
  const minDay = chartData.attendanceTrendLabels?.[chartData.attendanceTrend.indexOf(minAttendance)] || '';

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

  // Weekly trend data
  const weeklyTrendData = chartData.weeklyAttendanceTrend ? {
    labels: chartData.weeklyAttendanceTrend.labels,
    datasets: [{
      label: 'Wöchentlicher Durchschnitt (%)',
      data: chartData.weeklyAttendanceTrend.data,
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderRadius: 4,
    }],
  } : null;

  return (
    <div className="space-y-6">
      {/* Main Attendance Trend Chart with Statistics */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Anwesenheitstrend
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {timeRange === '7d' && 'Letzte 7 Tage'}
                {timeRange === '30d' && 'Letzte 30 Tage'}
                {timeRange === '90d' && 'Letzte 90 Tage'}
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">≥90% Exzellent</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-gray-600">80-89% Gut</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-600">&lt;80% Kritisch</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Durchschnitt</p>
                  <p className={`text-xl font-bold ${
                    avgAttendance >= 90 ? 'text-green-600' :
                    avgAttendance >= 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {avgAttendance}%
                  </p>
                </div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Höchstwert</p>
                  <p className="text-xl font-bold text-green-600">{maxAttendance}%</p>
                  <p className="text-xs text-gray-500">{maxDay}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Tiefstwert</p>
                  <p className="text-xl font-bold text-red-600">{minAttendance}%</p>
                  <p className="text-xs text-gray-500">{minDay}</p>
                </div>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>
          
          {/* Main Chart */}
          <div className="h-64">
            <Line data={attendanceData} options={attendanceChartOptions} />
          </div>
          
          {/* Trend Analysis */}
          {chartData.attendanceTrend.length > 1 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Trend-Analyse:</p>
                  <p className="mt-1">
                    {(() => {
                      const trend = chartData.attendanceTrend;
                      const lastValue = trend[trend.length - 1];
                      const firstValue = trend[0];
                      const change = lastValue - firstValue;
                      
                      if (change > 5) {
                        return `Die Anwesenheitsrate zeigt eine positive Entwicklung mit einer Verbesserung von ${Math.abs(change)}% im gewählten Zeitraum.`;
                      } else if (change < -5) {
                        return `Die Anwesenheitsrate ist um ${Math.abs(change)}% gesunken. Maßnahmen zur Verbesserung sollten in Betracht gezogen werden.`;
                      } else {
                        return `Die Anwesenheitsrate bleibt stabil bei durchschnittlich ${avgAttendance}%.`;
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekday Breakdown */}
        {weekdayAttendanceData && (
          <ChartCard title="Anwesenheit nach Wochentag">
            <div className="h-64">
              <Bar 
                data={weekdayAttendanceData} 
                options={{
                  ...attendanceChartOptions,
                  plugins: {
                    ...attendanceChartOptions.plugins,
                    legend: { display: false }
                  }
                }} 
              />
            </div>
          </ChartCard>
        )}

        {/* Weekly Trend */}
        {weeklyTrendData && (
          <ChartCard title="Wöchentlicher Verlauf">
            <div className="h-64">
              <Bar 
                data={weeklyTrendData} 
                options={{
                  ...attendanceChartOptions,
                  plugins: {
                    ...attendanceChartOptions.plugins,
                    legend: { display: false },
                    tooltip: {
                      ...attendanceChartOptions.plugins.tooltip,
                      callbacks: {
                        title: function(context: any) {
                          const index = context[0].dataIndex;
                          const dates = chartData.weeklyAttendanceTrend.dates;
                          return dates?.[index] || context[0].label;
                        },
                        label: function(context: any) {
                          return `Durchschnitt: ${context.parsed.y}%`;
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          </ChartCard>
        )}

        {/* Course Distribution */}
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
                plugins: { 
                  legend: { 
                    position: 'right' as const,
                    labels: {
                      padding: 15,
                      font: {
                        size: 12
                      }
                    }
                  } 
                },
              }} 
            />
          </div>
        </ChartCard>

        {/* Monthly Enrollments */}
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

export default EnhancedChartsSection;