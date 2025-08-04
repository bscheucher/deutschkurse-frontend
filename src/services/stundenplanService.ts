// src/services/stundenplanService.ts
import api from './api';

export interface StundenplanEntry {
  id: number;
  kursId: number;
  kursName: string;
  wochentag: string;
  startzeit: string;
  endzeit: string;
  bemerkungen?: string;
  aktiv: boolean;
  validTimeRange: boolean;
}

class StundenplanService {
  async getAllStundenplan(): Promise<StundenplanEntry[]> {
    const response = await api.get<StundenplanEntry[]>('/stundenplan');
    return response.data;
  }

  async getStundenplanByKurs(kursId: number): Promise<StundenplanEntry[]> {
    const response = await api.get<StundenplanEntry[]>(`/stundenplan/kurs/${kursId}`);
    return response.data;
  }

  async createStundenplanEntry(data: Omit<StundenplanEntry, 'id' | 'kursName' | 'validTimeRange'>): Promise<StundenplanEntry> {
    const response = await api.post<StundenplanEntry>('/stundenplan', data);
    return response.data;
  }

  async updateStundenplanEntry(id: number, data: Partial<StundenplanEntry>): Promise<StundenplanEntry> {
    const response = await api.put<StundenplanEntry>(`/stundenplan/${id}`, data);
    return response.data;
  }

  async deleteStundenplanEntry(id: number): Promise<void> {
    await api.delete(`/stundenplan/${id}`);
  }
}

export default new StundenplanService();
