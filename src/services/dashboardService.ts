// src/services/dashboardService.ts
import api from './api';

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
  }>;
}

interface ChartData {
  attendanceTrend: number[];
  courseDistribution: number[];
  monthlyEnrollments: number[];
}

class DashboardService {
  async getDashboardStats(): Promise<DashboardStats> {
    // Since we don't have a specific dashboard endpoint, we'll aggregate data
    // In a real app, this would be a dedicated endpoint
    try {
      const kurseResponse = await api.get('/kurse');
      const teilnehmerResponse = await api.get('/teilnehmer');
      const trainerResponse = await api.get('/trainer');
      
      const kurse = kurseResponse.data;
      const teilnehmer = teilnehmerResponse.data;
      const trainer = trainerResponse.data;
      
      return {
        activeKurse: kurse.filter((k: any) => k.status === 'laufend').length,
        totalTeilnehmer: teilnehmer.filter((t: any) => t.aktiv).length,
        availableTrainer: trainer.filter((t: any) => t.status === 'verfuegbar').length,
        avgAttendance: 92, // Mock data
        successRate: 87, // Mock data
        upcomingKurse: kurse
          .filter((k: any) => k.status === 'geplant')
          .slice(0, 5)
          .map((k: any) => ({
            id: k.id,
            name: k.kursName,
            startTime: k.startdatum,
            room: k.kursraumName
          }))
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
        upcomingKurse: []
      };
    }
  }

  async getChartData(): Promise<ChartData> {
    // Mock data for charts
    // In a real app, this would come from the backend
    return {
      attendanceTrend: [92, 88, 95, 91, 89, 94, 93],
      courseDistribution: [12, 8, 15, 10, 5],
      monthlyEnrollments: [45, 52, 48, 58, 62, 55]
    };
  }
}

export default new DashboardService();