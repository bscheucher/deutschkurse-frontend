// src/services/dashboardService.ts
import api from './api';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
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
}

interface ChartData {
  attendanceTrend: {
    labels: string[];
    data: number[];
  };
  courseDistribution: {
    labels: string[];
    data: number[];
  };
  monthlyEnrollments: {
    labels: string[];
    data: number[];
  };
  trainerUtilization: {
    labels: string[];
    data: number[];
  };
}

interface AttendanceData {
  datum: string;
  attendanceRate: number;
}

class DashboardService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch all required data in parallel
      const [kurseResponse, teilnehmerResponse, trainerResponse, attendanceStats] = await Promise.all([
        api.get('/kurse'),
        api.get('/teilnehmer'),
        api.get('/trainer'),
        this.getAttendanceStatistics()
      ]);
      
      const kurse = kurseResponse.data;
      const teilnehmer = teilnehmerResponse.data;
      const trainer = trainerResponse.data;
      
      // Calculate active courses (running or planned)
      const activeKurse = kurse.filter((k: any) => 
        k.status === 'laufend' || k.status === 'geplant'
      ).length;
      
      // Calculate total active participants
      const totalTeilnehmer = teilnehmer.filter((t: any) => t.aktiv).length;
      
      // Calculate available trainers
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
      
      // Get upcoming courses (next 7 days)
      const upcomingKurse = this.getUpcomingCourses(kurse);
      
      // Calculate success rate (completed courses vs all finished courses)
      const finishedCourses = kurse.filter((k: any) => 
        k.status === 'abgeschlossen' || k.status === 'abgebrochen'
      );
      const successRate = finishedCourses.length > 0 
        ? Math.round((kurse.filter((k: any) => k.status === 'abgeschlossen').length / finishedCourses.length) * 100)
        : 0;
      
      return {
        activeKurse,
        totalTeilnehmer,
        availableTrainer,
        avgAttendance: attendanceStats.avgAttendance,
        successRate,
        upcomingKurse,
        recentEnrollments,
        coursesThisMonth
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default values in case of error
      return {
        activeKurse: 0,
        totalTeilnehmer: 0,
        availableTrainer: 0,
        avgAttendance: 0,
        successRate: 0,
        upcomingKurse: [],
        recentEnrollments: 0,
        coursesThisMonth: 0
      };
    }
  }

  async getChartData(): Promise<ChartData> {
    try {
      // Fetch data for charts
      const [attendanceData, courseData, enrollmentData, trainerData] = await Promise.all([
        this.getAttendanceTrendData(),
        this.getCourseDistributionData(),
        this.getMonthlyEnrollmentData(),
        this.getTrainerUtilizationData()
      ]);

      return {
        attendanceTrend: attendanceData,
        courseDistribution: courseData,
        monthlyEnrollments: enrollmentData,
        trainerUtilization: trainerData
      };
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Return mock data as fallback
      return this.getMockChartData();
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

  private async getAttendanceTrendData(): Promise<{ labels: string[]; data: number[] }> {
    try {
      // Get last 7 days of attendance data
      const labels: string[] = [];
      const data: number[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const labelStr = format(date, 'EEE', { locale: de });
        
        labels.push(labelStr);
        
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
      
      return { labels, data };
    } catch (error) {
      console.error('Error fetching attendance trend data:', error);
      return {
        labels: ['Mon', 'Die', 'Mit', 'Don', 'Fre', 'Sam', 'Son'],
        data: [0, 0, 0, 0, 0, 0, 0]
      };
    }
  }

  private async getCourseDistributionData(): Promise<{ labels: string[]; data: number[] }> {
    try {
      const response = await api.get('/kurse');
      const kurse = response.data;
      
      // Group courses by type
      const distribution = kurse.reduce((acc: any, kurs: any) => {
        const type = kurs.kurstypName || 'Unbekannt';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      const labels = Object.keys(distribution).sort();
      const data = labels.map(label => distribution[label]);
      
      return { labels, data };
    } catch (error) {
      console.error('Error fetching course distribution data:', error);
      return {
        labels: ['A1', 'A2', 'B1', 'B2', 'C1'],
        data: [0, 0, 0, 0, 0]
      };
    }
  }

  private async getMonthlyEnrollmentData(): Promise<{ labels: string[]; data: number[] }> {
    try {
      const response = await api.get('/teilnehmer');
      const teilnehmer = response.data;
      
      // Get last 6 months
      const months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date()
      });
      
      const labels = months.map(month => format(month, 'MMM', { locale: de }));
      const data = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        return teilnehmer.filter((t: any) => {
          const enrollmentDate = new Date(t.anmeldedatum);
          return enrollmentDate >= monthStart && enrollmentDate <= monthEnd;
        }).length;
      });
      
      return { labels, data };
    } catch (error) {
      console.error('Error fetching monthly enrollment data:', error);
      return {
        labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
        data: [0, 0, 0, 0, 0, 0]
      };
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
      return {
        labels: [],
        data: []
      };
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

  private getMockChartData(): ChartData {
    return {
      attendanceTrend: {
        labels: ['Mon', 'Die', 'Mit', 'Don', 'Fre', 'Sam', 'Son'],
        data: [92, 88, 95, 91, 89, 94, 93]
      },
      courseDistribution: {
        labels: ['A1', 'A2', 'B1', 'B2', 'C1'],
        data: [12, 8, 15, 10, 5]
      },
      monthlyEnrollments: {
        labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
        data: [45, 52, 48, 58, 62, 55]
      },
      trainerUtilization: {
        labels: ['Trainer A', 'Trainer B', 'Trainer C'],
        data: [5, 3, 4]
      }
    };
  }

  // Additional dashboard methods
  async getRecentActivity(): Promise<Array<{
    id: number;
    type: 'enrollment' | 'course_start' | 'course_end' | 'attendance';
    message: string;
    timestamp: string;
    userId?: number;
    courseId?: number;
  }>> {
    try {
      // This would ideally be a dedicated endpoint for activity logs
      // For now, we'll simulate recent activity from existing data
      const activities: any[] = [];
      
      // Get recent enrollments
      const teilnehmerResponse = await api.get('/teilnehmer');
      const recentTeilnehmer = teilnehmerResponse.data
        .filter((t: any) => {
          const enrollDate = new Date(t.anmeldedatum);
          const sevenDaysAgo = subDays(new Date(), 7);
          return enrollDate >= sevenDaysAgo;
        })
        .slice(0, 5);
      
      recentTeilnehmer.forEach((t: any) => {
        activities.push({
          id: `enrollment_${t.id}`,
          type: 'enrollment',
          message: `${t.vorname} ${t.nachname} hat sich angemeldet`,
          timestamp: t.anmeldedatum,
          userId: t.id
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
        .slice(0, 3);
      
      recentCourses.forEach((k: any) => {
        activities.push({
          id: `course_start_${k.id}`,
          type: 'course_start',
          message: `Kurs "${k.kursName}" wurde gestartet`,
          timestamp: k.startdatum,
          courseId: k.id
        });
      });
      
      // Sort by timestamp and return latest
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
        
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }
}

export default new DashboardService();