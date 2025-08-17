// src/utils/dashboardUtils.ts
import { format, subDays, isToday, isYesterday, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';

export interface StatCard {
  title: string;
  value: number | string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  link?: string;
}

export interface ActivityItem {
  id: string;
  type: 'enrollment' | 'course_start' | 'course_end' | 'attendance' | 'completion';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: number;
    name: string;
  };
  course?: {
    id: number;
    name: string;
  };
  priority: 'high' | 'medium' | 'low';
}

export class DashboardUtils {
  /**
   * Format numbers for display in dashboard
   */
  static formatNumber(value: number, type: 'default' | 'percentage' | 'currency' = 'default'): string {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      default:
        return new Intl.NumberFormat('de-DE').format(value);
    }
  }

  /**
   * Calculate percentage change between two values
   */
  static calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Get trend direction based on change
   */
  static getTrend(change: number): 'up' | 'down' | 'neutral' {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  }

  /**
   * Format time for dashboard display
   */
  static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return `Heute, ${format(date, 'HH:mm')}`;
    }
    
    if (isYesterday(date)) {
      return `Gestern, ${format(date, 'HH:mm')}`;
    }
    
    return format(date, 'dd.MM.yyyy, HH:mm', { locale: de });
  }

  /**
   * Get color classes for stat cards
   */
  static getStatCardColors(color: StatCard['color']) {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        icon: 'text-blue-600'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        icon: 'text-purple-600'
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        icon: 'text-green-600'
      },
      orange: {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        icon: 'text-orange-600'
      },
      red: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        icon: 'text-red-600'
      }
    };
    
    return colors[color];
  }

  /**
   * Get activity icon and color based on type
   */
  static getActivityDisplay(type: ActivityItem['type']) {
    const displays = {
      enrollment: {
        icon: 'UserPlus',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      course_start: {
        icon: 'BookOpen',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      course_end: {
        icon: 'CheckCircle',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      },
      attendance: {
        icon: 'Calendar',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      completion: {
        icon: 'Award',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      }
    };
    
    return displays[type];
  }

  /**
   * Generate chart colors for consistent theming
   */
  static getChartColors(count: number = 5): string[] {
    const baseColors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(34, 197, 94, 0.8)',    // Green
      'rgba(251, 146, 60, 0.8)',   // Orange
      'rgba(168, 85, 247, 0.8)',   // Purple
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(14, 165, 233, 0.8)',   // Sky
      'rgba(132, 204, 22, 0.8)',   // Lime
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(101, 163, 13, 0.8)',   // Green-600
      'rgba(147, 51, 234, 0.8)',   // Violet
    ];
    
    // Repeat colors if needed
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  }

  /**
   * Export dashboard data to CSV
   */
  static exportToCSV(data: any[], filename: string): void {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Calculate attendance rate with color coding
   */
  static getAttendanceRateDisplay(rate: number) {
    let color = 'text-red-600';
    let bgColor = 'bg-red-100';
    let status = 'Niedrig';
    
    if (rate >= 90) {
      color = 'text-green-600';
      bgColor = 'bg-green-100';
      status = 'Ausgezeichnet';
    } else if (rate >= 80) {
      color = 'text-yellow-600';
      bgColor = 'bg-yellow-100';
      status = 'Gut';
    } else if (rate >= 70) {
      color = 'text-orange-600';
      bgColor = 'bg-orange-100';
      status = 'Verbesserungsfähig';
    }
    
    return { color, bgColor, status, rate };
  }

  /**
   * Get week boundaries for filtering
   */
  static getWeekBoundaries(date: Date = new Date()) {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
      end: endOfWeek(date, { weekStartsOn: 1 }) // Sunday
    };
  }

  /**
   * Generate date range for charts
   */
  static generateDateRange(days: number = 7): string[] {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
    }
    return dates;
  }

  /**
   * Create default chart options
   */
  static getDefaultChartOptions(type: 'line' | 'bar' | 'doughnut' = 'line') {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type === 'doughnut',
          position: type === 'doughnut' ? 'right' as const : 'top' as const,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
        },
      },
    };

    if (type === 'line' || type === 'bar') {
      return {
        ...baseOptions,
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#6B7280',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(107, 114, 128, 0.1)',
            },
            ticks: {
              color: '#6B7280',
            },
          },
        },
      };
    }

    return baseOptions;
  }

  /**
   * Validate dashboard data
   */
  static validateDashboardData(data: any): boolean {
    if (!data) return false;
    
    // Check required properties
    const requiredProps = ['activeKurse', 'totalTeilnehmer', 'avgAttendance'];
    return requiredProps.every(prop => typeof data[prop] === 'number');
  }

  /**
   * Format large numbers with K, M suffixes
   */
  static formatLargeNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  /**
   * Get performance indicators
   */
  static getPerformanceIndicator(current: number, target: number) {
    const percentage = Math.round((current / target) * 100);
    let status: 'excellent' | 'good' | 'warning' | 'poor';
    let color: string;
    
    if (percentage >= 100) {
      status = 'excellent';
      color = 'text-green-600';
    } else if (percentage >= 80) {
      status = 'good';
      color = 'text-blue-600';
    } else if (percentage >= 60) {
      status = 'warning';
      color = 'text-yellow-600';
    } else {
      status = 'poor';
      color = 'text-red-600';
    }
    
    return { status, color, percentage };
  }
}

export default DashboardUtils;