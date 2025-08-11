import api from './api';
import { Kurs, CreateKursDto, KursStatus } from '../types/kurs.types';
import { Teilnehmer } from '../types/teilnehmer.types';

class KursService {
  async getAllKurse(): Promise<Kurs[]> {
    const response = await api.get<Kurs[]>('/kurse');
    return response.data;
  }

  async getKursById(id: number): Promise<Kurs> {
    const response = await api.get<Kurs>(`/kurse/${id}`);
    return response.data;
  }

  async getKurseByStatus(status: KursStatus): Promise<Kurs[]> {
    const response = await api.get<Kurs[]>(`/kurse/status/${status}`);
    return response.data;
  }

  async getTeilnehmerInKurs(kursId: number): Promise<Teilnehmer[]> {
    const response = await api.get<Teilnehmer[]>(`/kurse/${kursId}/teilnehmer`);
    return response.data;
  }

  async createKurs(data: CreateKursDto): Promise<Kurs> {
    // Ensure dates are in the correct format for the backend
    const formattedData = {
      ...data,
      startdatum: this.formatDateForBackend(data.startdatum),
      enddatum: this.formatDateForBackend(data.enddatum)
    };
    
    const response = await api.post<Kurs>('/kurse', formattedData);
    return response.data;
  }

  async updateKurs(id: number, data: Partial<CreateKursDto>): Promise<Kurs> {
    // Format dates if they exist
    const formattedData = { ...data };
    if (data.startdatum) {
      formattedData.startdatum = this.formatDateForBackend(data.startdatum);
    }
    if (data.enddatum) {
      formattedData.enddatum = this.formatDateForBackend(data.enddatum);
    }
    
    const response = await api.put<Kurs>(`/kurse/${id}`, formattedData);
    return response.data;
  }

  async updateKursStatus(id: number, status: KursStatus): Promise<Kurs> {
    const response = await api.patch<Kurs>(`/kurse/${id}/status?status=${status}`);
    return response.data;
  }

  async deleteKurs(id: number): Promise<void> {
    await api.delete(`/kurse/${id}`);
  }

  async enrollTeilnehmer(teilnehmerId: number, kursId: number): Promise<any> {
    const response = await api.post('/kurse/enroll', { teilnehmerId, kursId });
    return response.data;
  }

  async removeTeilnehmer(kursId: number, teilnehmerId: number): Promise<void> {
    await api.delete(`/kurse/${kursId}/teilnehmer/${teilnehmerId}`);
  }

  // Helper method to format dates for backend
  private formatDateForBackend(dateString: string): string {
    // If it's already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // If it's in ISO format (YYYY-MM-DDTHH:mm:ss), extract just the date part
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Try to parse and format the date
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateString; // Return original if formatting fails
    }
  }
}

export default new KursService();