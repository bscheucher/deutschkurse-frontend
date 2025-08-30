// src/hooks/useDashboard.ts - Fixed for React Query v5 compatibility - Removed Success Rate
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dashboardService from '../services/dashboardService';
import toast from 'react-hot-toast';

export interface DashboardStats {
  activeKurse: number;
  totalTeilnehmer: number;
  availableTrainer: number;
  avgAttendance: number;
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
  isPendingStats: boolean;
  isPendingCharts: boolean;
  isPendingActivity: boolean;
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
  isPending: boolean;
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

  // Dashboard stats query - FIXED: Removed onError and onSuccess
  const {
    data: stats,
    isPending: isPendingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      console.log('Fetching dashboard stats...');
      const result = await dashboardService.getDashboardStats();
      console.log('Dashboard stats fetched successfully:', result);
      return result;
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: (failureCount, error) => {
      console.log(`Dashboard stats fetch attempt ${failureCount + 1} failed:`, error);
      return failureCount < 2; // Max 3 attempts
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Chart data query - FIXED: Removed onError
  const {
    data: chartData,
    isPending: isPendingCharts,
    error: chartsError,
    refetch: refetchCharts
  } = useQuery({
    queryKey: ['dashboardCharts', timeRange],
    queryFn: async () => {
      console.log(`Fetching chart data for ${timeRange}...`);
      const result = await dashboardService.getChartData(timeRange);
      console.log('Chart data fetched successfully');
      return result;
    },
    refetchInterval: autoRefresh ? refreshInterval * 2 : false,
    retry: (failureCount, error) => {
      console.log(`Chart data fetch attempt ${failureCount + 1} failed:`, error);
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Recent activity query - FIXED: Removed onError
  const {
    data: recentActivity,
    isPending: isPendingActivity,
    error: activityError,
    refetch: refetchActivity
  } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      console.log('Fetching recent activity...');
      const result = await dashboardService.getRecentActivity();
      console.log('Recent activity fetched successfully');
      return result;
    },
    refetchInterval: autoRefresh ? refreshInterval / 2 : false,
    retry: (failureCount, error) => {
      console.log(`Activity fetch attempt ${failureCount + 1} failed:`, error);
      return failureCount < 1; // Less retries for activity data
    },
    retryDelay: 2000,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // FIXED: Handle success/error states with useEffect instead of callbacks
  useEffect(() => {
    if (statsError && !isPendingStats && !stats) {
      console.error('Critical error loading dashboard stats:', statsError);
      toast.error('Fehler beim Laden der Dashboard-Statistiken');
    }
  }, [statsError, isPendingStats, stats]);

  useEffect(() => {
    if (chartsError && !isPendingCharts && !chartData) {
      console.error('Error loading chart data:', chartsError);
      toast.error('Fehler beim Laden der Diagramm-Daten');
    }
  }, [chartsError, isPendingCharts, chartData]);

  useEffect(() => {
    if (activityError && !isPendingActivity) {
      console.warn('Non-critical error loading activity data:', activityError);
      // Don't show toast for activity errors as they're less critical
    }
  }, [activityError, isPendingActivity]);

  // Log successful data fetches
  useEffect(() => {
    if (stats && !isPendingStats) {
      console.log('Dashboard stats query successful:', stats);
    }
  }, [stats, isPendingStats]);

  // Refresh all data
  const refresh = useCallback(async () => {
    console.log('Manually refreshing all dashboard data...');
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refetchStats(),
        refetchCharts(),
        refetchActivity()
      ]);
      console.log('Manual refresh completed successfully');
      toast.success('Dashboard erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error during manual refresh:', error);
      toast.error('Fehler beim Aktualisieren des Dashboards');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchStats, refetchCharts, refetchActivity]);

  // Individual refresh functions
  const refreshStats = useCallback(async () => {
    console.log('Refreshing stats...');
    try {
      await refetchStats();
      toast.success('Statistiken aktualisiert');
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('Fehler beim Aktualisieren der Statistiken');
    }
  }, [refetchStats]);

  const refreshCharts = useCallback(async () => {
    console.log('Refreshing charts...');
    try {
      await refetchCharts();
      toast.success('Diagramme aktualisiert');
    } catch (error) {
      console.error('Error refreshing charts:', error);
      toast.error('Fehler beim Aktualisieren der Diagramme');
    }
  }, [refetchCharts]);

  const refreshActivity = useCallback(async () => {
    console.log('Refreshing activity...');
    try {
      await refetchActivity();
    } catch (error) {
      console.warn('Error refreshing activity (non-critical):', error);
    }
  }, [refetchActivity]);

  // Export functionality
  const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
    console.log(`Exporting dashboard data as ${format}...`);
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
      console.log(`Auto-refresh ${newValue ? 'enabled' : 'disabled'}`);
      toast.success(`Auto-Update ${newValue ? 'aktiviert' : 'deaktiviert'}`);
      return newValue;
    });
  }, []);

  // Update time range and invalidate chart queries
  const handleSetTimeRange = useCallback((range: '7d' | '30d' | '90d') => {
    console.log(`Setting time range to: ${range}`);
    setTimeRange(range);
    queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
  }, [queryClient]);

  // Computed values
  const hasData = Boolean(stats && chartData && recentActivity);
  const hasErrors = Boolean(statsError || chartsError || activityError);
  const isPending = isPendingStats || isPendingCharts || isPendingActivity;

  // Effect to handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && autoRefresh) {
        console.log('Tab hidden, auto-refresh continues...');
      } else if (!document.hidden && autoRefresh) {
        console.log('Tab visible, auto-refresh active...');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefresh]);

  return {
    // Data
    stats: stats as DashboardStats | undefined,
    chartData: chartData as ChartData | undefined,
    recentActivity: recentActivity as ActivityItem[] | undefined,
    
    // Loading states
    isPendingStats,
    isPendingCharts,
    isPendingActivity,
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
    isPending
  };
};

// Hook für Dashboard-Berechnungen - Removed Success Rate functions
export const useDashboardCalculations = (stats?: DashboardStats) => {
  const getAttendanceStatus = useCallback((rate: number) => {
    if (rate >= 90) return { status: 'excellent', color: 'green', text: 'Ausgezeichnet' };
    if (rate >= 80) return { status: 'good', color: 'blue', text: 'Gut' };
    if (rate >= 70) return { status: 'warning', color: 'yellow', text: 'Verbesserungsfähig' };
    return { status: 'poor', color: 'red', text: 'Niedrig' };
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
      coursesTrend: getTrendIndicator(stats.trends.kurseChange),
      participantsTrend: getTrendIndicator(stats.trends.teilnehmerChange),
      attendanceTrend: getTrendIndicator(stats.trends.attendanceChange),
      
      capacityUtilization: stats.activeKurse > 0 
        ? Math.round((stats.totalTeilnehmer / (stats.activeKurse * 15)) * 100)
        : 0,
      
      trainerCoverage: stats.availableTrainer > 0 
        ? Math.round((stats.activeKurse / stats.availableTrainer) * 100)
        : 0,
    };
  }, [stats, getAttendanceStatus, getTrendIndicator]);

  return {
    getAttendanceStatus,
    getTrendIndicator,
    getKpiSummary
  };
};

// Hook für Dashboard-Einstellungen
export const useDashboardSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard-settings');
      return saved ? JSON.parse(saved) : {
        autoRefresh: true,
        refreshInterval: 30000,
        defaultTimeRange: '7d',
        showWelcomeMessage: true,
        compactMode: false,
        theme: 'light'
      };
    } catch {
      return {
        autoRefresh: true,
        refreshInterval: 30000,
        defaultTimeRange: '7d',
        showWelcomeMessage: true,
        compactMode: false,
        theme: 'light'
      };
    }
  });

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    setSettings((prev: any) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('dashboard-settings', JSON.stringify(updated));
      } catch (error) {
        console.warn('Could not save dashboard settings:', error);
      }
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
    try {
      localStorage.setItem('dashboard-settings', JSON.stringify(defaultSettings));
    } catch (error) {
      console.warn('Could not save default dashboard settings:', error);
    }
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings
  };
};

export default useDashboard;

// Additional fix for Users.tsx mutation isPending issue
// In React Query v5, mutations use isPending instead of isLoading
// This should be applied to any useMutation hooks in your codebase