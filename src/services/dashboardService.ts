// src/services/dashboardService.ts - Enhanced Dashboard Service
import api from './api';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, isAfter, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';

interface DashboardStats {
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

interface ChartData {
  attendanceTrend: number[];
  courseDistribution: number[];
  monthlyEnrollments: number[];
  trainerUtilization: {
    labels: string[];
    data: number[];
  };
}

interface ActivityItem {
  id: string;
  type: 'enrollment' | 'course_start' | 'course_end' | 'attendance' | 'completion';
  message: string;
  timestamp: string;
  userId?: number;
  courseId?: number;
  priority: 'high' | 'medium' | 'low';
}

interface AttendanceData {
  datum: string;
  attendanceRate: number;
}

interface KpiMetrics {
  totalRevenue: number;
  averageClassSize: number;
  completionRate: number;
  customerSatisfaction: number;
  trainerUtilization: number;
}

class DashboardService {
  // Cache for dashboard data to improve performance
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const cacheKey = 'dashboard-stats';
    const cached = this.getFromCache<DashboardStats>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch all required data in parallel for better performance
      const [kurseResponse, teilnehmerResponse, trainerResponse, attendanceStats, trends] = await Promise.all([
        api.get('/kurse'),
        api.get('/teilnehmer'),
        api.get('/trainer'),
        this.getAttendanceStatistics(),
        this.getTrendData()
      ]);
      
      const kurse = kurseResponse.data;
      const teilnehmer = teilnehmerResponse.data;
      const trainer = trainerResponse.data;
      
      // Calculate metrics
      const activeKurse = kurse.filter((k: any) => 
        k.status === 'laufend' || k.status === 'geplant'
      ).length;
      
      const totalTeilnehmer = teilnehmer.filter((t: any) => t.aktiv).length;
      
      const availableTrainer = trainer.filter((t: any) => 
        t.status === 'verfuegbar' && t.aktiv
      ).length;
      
      // Calculate recent enrollments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentEnrollments = teilnehmer.filter((t: any) => 
        new Date(t.anmeldedatum) >= thirtyDaysAgo
      ).length;
      
      // Calculate courses started this month
      const thisMonthStart = startOfMonth(new Date());
      const coursesThisMonth = kurse.filter((k: any) => 
        new Date(k.startdatum) >= thisMonthStart
      ).length;
      
      // Get upcoming courses
      const upcomingKurse = this.getUpcomingCourses(kurse);
      
      // Calculate success rate
      const finishedCourses = kurse.filter((k: any) => 
        k.status === 'abgeschlossen' || k.status === 'abgebrochen'
      );
      const successRate = finishedCourses.length > 0 
        ? Math.round((kurse.filter((k: any) => k.status === 'abgeschlossen').length / finishedCourses.length) * 100)
        : 0;
      
      const stats: DashboardStats = {
        activeKurse,
        totalTeilnehmer,
        availableTrainer,
        avgAttendance: attendanceStats.avgAttendance,
        successRate,
        upcomingKurse,
        recentEnrollments,
        coursesThisMonth,
        trends
      };

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return fallback data
      return this.getFallbackStats();
    }
  }

  async getChartData(timeRange: '7d' | '30d' | '90d' = '7d'): Promise<ChartData> {
    const cacheKey = `chart-data-${timeRange}`;
    const cached = this.getFromCache<ChartData>(cacheKey);
    if (cached) return cached;

    try {
      const [attendanceData, courseData, enrollmentData, trainerData] = await Promise.all([
        this.getAttendanceTrendData(timeRange),
        this.getCourseDistributionData(),
        this.getMonthlyEnrollmentData(),
        this.getTrainerUtilizationData()
      ]);

      const chartData: ChartData = {
        attendanceTrend: attendanceData,
        courseDistribution: courseData,
        monthlyEnrollments: enrollmentData,
        trainerUtilization: trainerData
      };

      this.setCache(cacheKey, chartData);
      return chartData;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return this.getMockChartData();
    }
  }

  async getRecentActivity(): Promise<ActivityItem[]> {
    const cacheKey = 'recent-activity';
    const cached = this.getFromCache<ActivityItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const activities: ActivityItem[] = [];
      
      // Get recent enrollments
      const teilnehmerResponse = await api.get('/teilnehmer');
      const recentTeilnehmer = teilnehmerResponse.data
        .filter((t: any) => {
          const enrollDate = new Date(t.anmeldedatum);
          const sevenDaysAgo = subDays(new Date(), 7);
          return enrollDate >= sevenDaysAgo;
        })
        .sort((a: any, b: any) => new Date(b.anmeldedatum).getTime() - new Date(a.anmeldedatum).getTime())
        .slice(0, 10);
      
      recentTeilnehmer.forEach((t: any) => {
        activities.push({
          id: `enrollment_${t.id}`,
          type: 'enrollment',
          message: `${t.vorname} ${t.nachname} hat sich angemeldet`,
          timestamp: t.anmeldedatum,
          userId: t.id,
          priority: 'medium'
        });
      });
      
      // Get recent course starts
      const kurseResponse = await api.get('/kurse');
      const recentCourses = kurseResponse.data
        .filter((k: any) => {
          const startDate = new Date(k.startdatum);
          const sevenDaysAgo = subDays(new Date(), 7);
          return startDate >= sevenDaysAgo && k.status === 'laufend';
        })
        .sort((a: any, b: any) => new Date(b.startdatum).getTime() - new Date(a.startdatum).getTime())
        .slice(0, 5);
      
      recentCourses.forEach((k: any) => {
        activities.push({
          id: `course_start_${k.id}`,
          type: 'course_start',
          message: `Kurs "${k.kursName}" wurde gestartet`,
          timestamp: k.startdatum,
          courseId: k.id,
          priority: 'high'
        });
      });

      // Get recent completions
      const completedCourses = kurseResponse.data
        .filter((k: any) => {
          const endDate = new Date(k.enddatum);
          const sevenDaysAgo = subDays(new Date(), 7);
          return endDate >= sevenDaysAgo && k.status === 'abgeschlossen';
        })
        .sort((a: any, b: any) => new Date(b.enddatum).getTime() - new Date(a.enddatum).getTime())
        .slice(0, 3);

      completedCourses.forEach((k: any) => {
        activities.push({
          id: `course_end_${k.id}`,
          type: 'completion',
          message: `Kurs "${k.kursName}" wurde erfolgreich abgeschlossen`,
          timestamp: k.enddatum,
          courseId: k.id,
          priority: 'high'
        });
      });
      
      // Sort by timestamp and return latest
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);

      this.setCache(cacheKey, sortedActivities);
      return sortedActivities;
        
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  async getKpiMetrics(): Promise<KpiMetrics> {
    try {
      const [kurseResponse, teilnehmerResponse, trainerResponse] = await Promise.all([
        api.get('/kurse'),
        api.get('/teilnehmer'),
        api.get('/trainer')
      ]);

      const kurse = kurseResponse.data;
      const teilnehmer = teilnehmerResponse.data;
      const trainer = trainerResponse.data;

      // Calculate average class size
      const activeKurse = kurse.filter((k: any) => k.status === 'laufend');
      const averageClassSize = activeKurse.length > 0 
        ? Math.round(activeKurse.reduce((sum: number, k: any) => sum + (k.aktuelleTeilnehmer || 0), 0) / activeKurse.length)
        : 0;

      // Calculate completion rate
      const totalFinishedCourses = kurse.filter((k: any) => 
        k.status === 'abgeschlossen' || k.status === 'abgebrochen'
      ).length;
      const completedCourses = kurse.filter((k: any) => k.status === 'abgeschlossen').length;
      const completionRate = totalFinishedCourses > 0 
        ? Math.round((completedCourses / totalFinishedCourses) * 100)
        : 0;

      // Calculate trainer utilization
      const activeTrainer = trainer.filter((t: any) => t.aktiv);
      const busyTrainer = trainer.filter((t: any) => t.status === 'im_einsatz');
      const trainerUtilization = activeTrainer.length > 0 
        ? Math.round((busyTrainer.length / activeTrainer.length) * 100)
        : 0;

      return {
        totalRevenue: 0, // This would come from a billing/payment system
        averageClassSize,
        completionRate,
        customerSatisfaction: 85, // This would come from surveys
        trainerUtilization
      };
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      return {
        totalRevenue: 0,
        averageClassSize: 0,
        completionRate: 0,
        customerSatisfaction: 0,
        trainerUtilization: 0
      };
    }
  }

  private async getTrendData(): Promise<{ kurseChange: number; teilnehmerChange: number; attendanceChange: number }> {
    try {
      // Get data for current and previous month
      const currentMonth = new Date();
      const previousMonth = subMonths(currentMonth, 1);
      
      const [kurseResponse, teilnehmerResponse] = await Promise.all([
        api.get('/kurse'),
        api.get('/teilnehmer')
      ]);

      const kurse = kurseResponse.data;
      const teilnehmer = teilnehmerResponse.data;

      // Calculate course trends
      const currentMonthCourses = kurse.filter((k: any) => {
        const startDate = new Date(k.startdatum);
        return startDate.getMonth() === currentMonth.getMonth() && 
               startDate.getFullYear() === currentMonth.getFullYear();
      }).length;

      const previousMonthCourses = kurse.filter((k: any) => {
        const startDate = new Date(k.startdatum);
        return startDate.getMonth() === previousMonth.getMonth() && 
               startDate.getFullYear() === previousMonth.getFullYear();
      }).length;

      const kurseChange = previousMonthCourses > 0 
        ? Math.round(((currentMonthCourses - previousMonthCourses) / previousMonthCourses) * 100)
        : currentMonthCourses > 0 ? 100 : 0;

      // Calculate participant trends
      const currentMonthTeilnehmer = teilnehmer.filter((t: any) => {
        const enrollDate = new Date(t.anmeldedatum);
        return enrollDate.getMonth() === currentMonth.getMonth() && 
               enrollDate.getFullYear() === currentMonth.getFullYear();
      }).length;

      const previousMonthTeilnehmer = teilnehmer.filter((t: any) => {
        const enrollDate = new Date(t.anmeldedatum);
        return enrollDate.getMonth() === previousMonth.getMonth() && 
               enrollDate.getFullYear() === previousMonth.getFullYear();
      }).length;

      const teilnehmerChange = previousMonthTeilnehmer > 0 
        ? Math.round(((currentMonthTeilnehmer - previousMonthTeilnehmer) / previousMonthTeilnehmer) * 100)
        : currentMonthTeilnehmer > 0 ? 100 : 0;

      return {
        kurseChange,
        teilnehmerChange,
        attendanceChange: -2 // This would be calculated from actual attendance data
      };
    } catch (error) {
      console.error('Error calculating trends:', error);
      return { kurseChange: 0, teilnehmerChange: 0, attendanceChange: 0 };
    }
  }

  private async getAttendanceStatistics(): Promise<{ avgAttendance: number }> {
    try {
      // Get attendance data for the last 30 days
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const response = await api.get(`/anwesenheit/zeitraum?startDate=${startDate}&endDate=${endDate}`);
      const attendanceRecords = response.data;
      
      if (attendanceRecords.length === 0) {
        return { avgAttendance: 0 };
      }
      
      // Group by date and calculate daily attendance rates
      const dailyStats = attendanceRecords.reduce((acc: any, record: any) => {
        const date = record.datum;
        if (!acc[date]) {
          acc[date] = { total: 0, present: 0 };
        }
        acc[date].total++;
        if (record.anwesend) {
          acc[date].present++;
        }
        return acc;
      }, {});
      
      // Calculate average attendance rate
      const dailyRates = Object.values(dailyStats).map((day: any) => 
        day.total > 0 ? (day.present / day.total) * 100 : 0
      );
      
      const avgAttendance = dailyRates.length > 0 
        ? Math.round(dailyRates.reduce((sum: number, rate: number) => sum + rate, 0) / dailyRates.length)
        : 0;
      
      return { avgAttendance };
    } catch (error) {
      console.error('Error calculating attendance statistics:', error);
      return { avgAttendance: 0 };
    }
  }

  private async getAttendanceTrendData(timeRange: '7d' | '30d' | '90d' = '7d'): Promise<number[]> {
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const data: number[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        try {
          const response = await api.get(`/anwesenheit/zeitraum?startDate=${dateStr}&endDate=${dateStr}`);
          const dayRecords = response.data;
          
          if (dayRecords.length === 0) {
            data.push(0);
          } else {
            const presentCount = dayRecords.filter((r: any) => r.anwesend).length;
            const attendanceRate = Math.round((presentCount / dayRecords.length) * 100);
            data.push(attendanceRate);
          }
        } catch {
          data.push(0);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching attendance trend data:', error);
      return Array(7).fill(0);
    }
  }

  private async getCourseDistributionData(): Promise<number[]> {
    try {
      const response = await api.get('/kurse');
      const kurse = response.data;
      
      // Count courses by level (assuming course types include level)
      const levelCounts = {
        'A1': 0,
        'A2': 0,
        'B1': 0,
        'B2': 0,
        'C1': 0
      };
      
      kurse.forEach((kurs: any) => {
        const kurstypName = kurs.kurstypName || '';
        if (kurstypName.includes('A1')) levelCounts.A1++;
        else if (kurstypName.includes('A2')) levelCounts.A2++;
        else if (kurstypName.includes('B1')) levelCounts.B1++;
        else if (kurstypName.includes('B2')) levelCounts.B2++;
        else if (kurstypName.includes('C1')) levelCounts.C1++;
      });
      
      return Object.values(levelCounts);
    } catch (error) {
      console.error('Error fetching course distribution data:', error);
      return [0, 0, 0, 0, 0];
    }
  }

  private async getMonthlyEnrollmentData(): Promise<number[]> {
    try {
      const response = await api.get('/teilnehmer');
      const teilnehmer = response.data;
      
      // Get last 6 months
      const months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date()
      });
      
      const data = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        return teilnehmer.filter((t: any) => {
          const enrollmentDate = new Date(t.anmeldedatum);
          return enrollmentDate >= monthStart && enrollmentDate <= monthEnd;
        }).length;
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching monthly enrollment data:', error);
      return [0, 0, 0, 0, 0, 0];
    }
  }

  private async getTrainerUtilizationData(): Promise<{ labels: string[]; data: number[] }> {
    try {
      const [trainerResponse, kurseResponse] = await Promise.all([
        api.get('/trainer'),
        api.get('/kurse')
      ]);
      
      const trainer = trainerResponse.data;
      const kurse = kurseResponse.data.filter((k: any) => k.status === 'laufend');
      
      // Count courses per trainer
      const trainerUtilization = trainer.map((t: any) => {
        const trainerCourses = kurse.filter((k: any) => k.trainerId === t.id).length;
        return {
          name: `${t.vorname} ${t.nachname}`,
          courses: trainerCourses
        };
      }).filter((t: any) => t.courses > 0)
        .sort((a: any, b: any) => b.courses - a.courses)
        .slice(0, 5); // Top 5 trainers
      
      const labels = trainerUtilization.map((t: any) => t.name);
      const data = trainerUtilization.map((t: any) => t.courses);
      
      return { labels, data };
    } catch (error) {
      console.error('Error fetching trainer utilization data:', error);
      return { labels: [], data: [] };
    }
  }

  private getUpcomingCourses(kurse: any[]): Array<{
    id: number;
    name: string;
    startTime: string;
    room: string;
    trainer: string;
    participants: number;
  }> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return kurse
      .filter((kurs: any) => {
        const startDate = new Date(kurs.startdatum);
        return startDate >= today && startDate <= nextWeek && 
               (kurs.status === 'geplant' || kurs.status === 'laufend');
      })
      .sort((a: any, b: any) => new Date(a.startdatum).getTime() - new Date(b.startdatum).getTime())
      .slice(0, 5)
      .map((kurs: any) => ({
        id: kurs.id,
        name: kurs.kursName,
        startTime: kurs.startdatum,
        room: kurs.kursraumName || 'TBA',
        trainer: kurs.trainerName || 'TBA',
        participants: kurs.aktuelleTeilnehmer || 0
      }));
  }

  private getFallbackStats(): DashboardStats {
    return {
      activeKurse: 0,
      totalTeilnehmer: 0,
      availableTrainer: 0,
      avgAttendance: 0,
      successRate: 0,
      upcomingKurse: [],
      recentEnrollments: 0,
      coursesThisMonth: 0,
      trends: {
        kurseChange: 0,
        teilnehmerChange: 0,
        attendanceChange: 0
      }
    };
  }

  private getMockChartData(): ChartData {
    return {
      attendanceTrend: [92, 88, 95, 91, 89, 94, 93],
      courseDistribution: [12, 8, 15, 10, 5],
      monthlyEnrollments: [45, 52, 48, 58, 62, 55],
      trainerUtilization: {
        labels: ['Trainer A', 'Trainer B', 'Trainer C'],
        data: [5, 3, 4]
      }
    };
  }

  // Additional utility methods
  async exportDashboardData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const [stats, chartData, activity] = await Promise.all([
        this.getDashboardStats(),
        this.getChartData(),
        this.getRecentActivity()
      ]);

      const exportData = {
        timestamp: new Date().toISOString(),
        stats,
        chartData,
        recentActivity: activity
      };

      if (format === 'json') {
        return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      } else {
        // Convert to CSV format
        const csvData = this.convertToCSV(exportData.stats);
        return new Blob([csvData], { type: 'text/csv' });
      }
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      throw new Error('Export failed');
    }
  }

  private convertToCSV(data: any): string {
    const headers = Object.keys(data).filter(key => typeof data[key] !== 'object');
    const values = headers.map(header => data[header]);
    return [headers.join(','), values.join(',')].join('\n');
  }

  // Method to clear cache (useful for testing or forcing refresh)
  clearCache(): void {
    this.cache.clear();
  }

  // Method to get cache status
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default new DashboardService();