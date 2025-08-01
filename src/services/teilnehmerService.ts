// src/services/teilnehmerService.ts
import api from './api';
import { Teilnehmer, CreateTeilnehmerDto } from '../types/teilnehmer.types';
import { Kurs } from '../types/kurs.types';

class TeilnehmerService {
  async getAllTeilnehmer(): Promise<Teilnehmer[]> {
    const response = await api.get<Teilnehmer[]>('/teilnehmer');
    return response.data;
  }

  async getTeilnehmerById(id: number): Promise<Teilnehmer> {
    const response = await api.get<Teilnehmer>(`/teilnehmer/${id}`);
    return response.data;
  }

  async createTeilnehmer(data: CreateTeilnehmerDto): Promise<Teilnehmer> {
    const response = await api.post<Teilnehmer>('/teilnehmer', data);
    return response.data;
  }

  async updateTeilnehmer(id: number, data: Partial<CreateTeilnehmerDto>): Promise<Teilnehmer> {
    const response = await api.put<Teilnehmer>(`/teilnehmer/${id}`, data);
    return response.data;
  }

  async deleteTeilnehmer(id: number): Promise<void> {
    await api.delete(`/teilnehmer/${id}`);
  }

  async searchTeilnehmerByName(name: string): Promise<Teilnehmer[]> {
    const response = await api.get<Teilnehmer[]>(`/teilnehmer/search?name=${encodeURIComponent(name)}`);
    return response.data;
  }

  async getKurseForTeilnehmer(teilnehmerId: number): Promise<Kurs[]> {
    const response = await api.get<Kurs[]>(`/teilnehmer/${teilnehmerId}/kurse`);
    return response.data;
  }
}

export default new TeilnehmerService();