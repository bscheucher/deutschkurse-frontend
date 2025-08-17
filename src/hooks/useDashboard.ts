// src/hooks/useDashboard.ts - Custom Dashboard Hook
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dashboardService from '../services/dashboardService';
import toast from 'react-hot-toast';

export interface DashboardStats {
  activeKurse: number;
  totalTeilnehmer: number;
  availableTrainer: number;
  avgAttendance: number;
  successRate: number;
  upcomingKurse: Array<{
    id: number;
    name: string;
    startTime: string;
    room: string;
    trainer: string;
    participants: number;
  }>;
  recentEnrollments: number;
  coursesThisMonth: number;
  trends: {
    kurseChange: number;
    teilnehmerChange: number;
    attendanceChange: number;
  };
}

export interface ChartData {
  attendanceTrend: number[];
  courseDistribution: number[];
  monthlyEnrollments: number[];
  trainerUtilization: {
    labels: string[];
    data: number[];
  };
}

export interface ActivityItem {
  id: string;
  type: 'enrollment' | 'course_start' | 'course_end' | 'attendance' | 'completion';
  message: string;
  timestamp: string;
  userId?: number;
  courseId?: number;
  priority: 'high' | 'medium' | 'low';
}

interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  timeRange?: '7d' | '30d' | '90d';
}

interface UseDashboardReturn {
  // Data
  stats: DashboardStats | undefined;
  chartData: ChartData | undefined;
  recentActivity: ActivityItem[] | undefined;
  
  // Loading states
  isLoadingStats: boolean;
  isLoadingCharts: boolean;
  isLoadingActivity: boolean;
  isRefreshing: boolean;
  
  // Error states
  statsError: Error | null;
  chartsError: Error | null;
  activityError: Error | null;
  
  // Actions
  refresh: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshCharts: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  exportData: (format?: 'json' | 'csv') => Promise<void>;
  
  // Settings
  timeRange: '7d' | '30d' | '90d';
  setTimeRange: (range: '7d' | '30d' | '90d') => void;
  autoRefresh: boolean;
  toggleAutoRefresh: () => void;
  
  // Computed values
  hasData: boolean;
  hasErrors: boolean;
  isLoading: boolean;
}

export const useDashboard = (options: UseDashboardOptions = {}): UseDashboardReturn => {
  const {
    autoRefresh: initialAutoRefresh = true,
    refreshInterval = 30000,
    timeRange: initialTimeRange = '7d'
  } = options;

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(initialAutoRefresh);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>(initialTimeRange);

  // Dashboard stats query
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getDashboardStats,
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Chart data query
  const {
    data: chartData,
    isLoading: isLoadingCharts,
    error: chartsError,
    refetch: refetchCharts
  } = useQuery({
    queryKey: ['dashboardCharts', timeRange],
    queryFn: () => dashboardService.getChartData(timeRange),
    refetchInterval: autoRefresh ? refreshInterval * 2 : false, // Less frequent updates for charts
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Recent activity query
  const {
    data: recentActivity,
    isLoading: isLoadingActivity,
    error: activityError,
    refetch: refetchActivity
  } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: dashboardService.getRecentActivity,
    refetchInterval: autoRefresh ? refreshInterval / 2 : false, // More frequent updates for activity
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Refresh all data
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchCharts(),
        refetchActivity()
      ]);
      toast.success('Dashboard erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error('Fehler beim Aktualisieren des Dashboards');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchStats, refetchCharts, refetchActivity]);

  // Individual refresh functions
  const refreshStats = useCallback(async () => {
    try {
      await refetchStats();
      toast.success('Statistiken aktualisiert');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Statistiken');
    }
  }, [refetchStats]);

  const refreshCharts = useCallback(async () => {
    try {
      await refetchCharts();
      toast.success('Diagramme aktualisiert');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Diagramme');
    }
  }, [refetchCharts]);

  const refreshActivity = useCallback(async () => {
    try {
      await refetchActivity();
    } catch (error) {
      console.error('Error refreshing activity:', error);
    }
  }, [refetchActivity]);

  // Export functionality
  const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
    try {
      const blob = await dashboardService.exportDashboardData(format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Dashboard-Daten als ${format.toUpperCase()} exportiert`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Fehler beim Exportieren der Daten');
    }
  }, []);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => {
      const newValue = !prev;
      toast.success(`Auto-Update ${newValue ? 'aktiviert' : 'deaktiviert'}`);
      return newValue;
    });
  }, []);

  // Update time range and invalidate chart queries
  const handleSetTimeRange = useCallback((range: '7d' | '30d' | '90d') => {
    setTimeRange(range);
    // Invalidate chart queries to trigger refetch with new time range
    queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
  }, [queryClient]);

  // Computed values
  const hasData = Boolean(stats && chartData && recentActivity);
  const hasErrors = Boolean(statsError || chartsError || activityError);
  const isLoading = isLoadingStats || isLoadingCharts || isLoadingActivity;

  // Effect to handle visibility change (pause auto-refresh when tab is not visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && autoRefresh) {
        // Optionally pause auto-refresh when tab is not visible
        console.log('Tab hidden, auto-refresh continues...');
      } else if (!document.hidden && autoRefresh) {
        // Optionally trigger a refresh when tab becomes visible again
        console.log('Tab visible, auto-refresh active...');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefresh]);

  // Effect to show error notifications
  useEffect(() => {
    if (statsError && !isLoadingStats) {
      toast.error('Fehler beim Laden der Dashboard-Statistiken');
    }
  }, [statsError, isLoadingStats]);

  useEffect(() => {
    if (chartsError && !isLoadingCharts) {
      toast.error('Fehler beim Laden der Diagramm-Daten');
    }
  }, [chartsError, isLoadingCharts]);

  useEffect(() => {
    if (activityError && !isLoadingActivity) {
      console.warn('Error loading activity data:', activityError);
      // Don't show toast for activity errors as they're less critical
    }
  }, [activityError, isLoadingActivity]);

  return {
    // Data
    stats: stats as DashboardStats | undefined,
    chartData: chartData as ChartData | undefined,
    recentActivity: recentActivity as ActivityItem[] | undefined,
    
    // Loading states
    isLoadingStats,
    isLoadingCharts,
    isLoadingActivity,
    isRefreshing,
    
    // Error states
    statsError: statsError as Error | null,
    chartsError: chartsError as Error | null,
    activityError: activityError as Error | null,
    
    // Actions
    refresh,
    refreshStats,
    refreshCharts,
    refreshActivity,
    exportData,
    
    // Settings
    timeRange,
    setTimeRange: handleSetTimeRange,
    autoRefresh,
    toggleAutoRefresh,
    
    // Computed values
    hasData,
    hasErrors,
    isLoading
  };
};

// Additional hook for dashboard statistics calculations
export const useDashboardCalculations = (stats?: DashboardStats) => {
  const getAttendanceStatus = useCallback((rate: number) => {
    if (rate >= 90) return { status: 'excellent', color: 'green', text: 'Ausgezeichnet' };
    if (rate >= 80) return { status: 'good', color: 'blue', text: 'Gut' };
    if (rate >= 70) return { status: 'warning', color: 'yellow', text: 'Verbesserungsfähig' };
    return { status: 'poor', color: 'red', text: 'Niedrig' };
  }, []);

  const getSuccessRateStatus = useCallback((rate: number) => {
    if (rate >= 95) return { status: 'excellent', color: 'green', text: 'Hervorragend' };
    if (rate >= 85) return { status: 'good', color: 'blue', text: 'Sehr gut' };
    if (rate >= 75) return { status: 'warning', color: 'yellow', text: 'Gut' };
    return { status: 'poor', color: 'red', text: 'Verbesserungsbedarf' };
  }, []);

  const getTrendIndicator = useCallback((change: number) => {
    if (change > 10) return { trend: 'strong-up', color: 'green', icon: '📈' };
    if (change > 0) return { trend: 'up', color: 'green', icon: '↗️' };
    if (change === 0) return { trend: 'stable', color: 'gray', icon: '➡️' };
    if (change > -10) return { trend: 'down', color: 'red', icon: '↘️' };
    return { trend: 'strong-down', color: 'red', icon: '📉' };
  }, []);

  const getKpiSummary = useCallback(() => {
    if (!stats) return null;

    return {
      attendance: getAttendanceStatus(stats.avgAttendance),
      success: getSuccessRateStatus(stats.successRate),
      coursesTrend: getTrendIndicator(stats.trends.kurseChange),
      participantsTrend: getTrendIndicator(stats.trends.teilnehmerChange),
      attendanceTrend: getTrendIndicator(stats.trends.attendanceChange),
      
      // Additional calculations
      capacityUtilization: stats.activeKurse > 0 
        ? Math.round((stats.totalTeilnehmer / (stats.activeKurse * 15)) * 100) // Assuming avg 15 per course
        : 0,
      
      trainerCoverage: stats.availableTrainer > 0 
        ? Math.round((stats.activeKurse / stats.availableTrainer) * 100)
        : 0,
    };
  }, [stats, getAttendanceStatus, getSuccessRateStatus, getTrendIndicator]);

  return {
    getAttendanceStatus,
    getSuccessRateStatus,
    getTrendIndicator,
    getKpiSummary
  };
};

// Hook for dashboard preferences/settings
export const useDashboardSettings = () => {
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('dashboard-settings');
    return saved ? JSON.parse(saved) : {
      autoRefresh: true,
      refreshInterval: 30000,
      defaultTimeRange: '7d',
      showWelcomeMessage: true,
      compactMode: false,
      theme: 'light'
    };
  });

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    setSettings((prev: any) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('dashboard-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const defaultSettings = {
      autoRefresh: true,
      refreshInterval: 30000,
      defaultTimeRange: '7d',
      showWelcomeMessage: true,
      compactMode: false,
      theme: 'light'
    };
    setSettings(defaultSettings);
    localStorage.setItem('dashboard-settings', JSON.stringify(defaultSettings));
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings
  };
};

export default useDashboard;