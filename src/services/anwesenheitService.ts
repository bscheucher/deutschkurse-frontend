// src/services/anwesenheitService.ts
import api from './api';
import { Anwesenheit, BulkAnwesenheitDto } from '../types/anwesenheit.types'

class AnwesenheitService {
  async getAll(): Promise<Anwesenheit[]> {
    const response = await api.get<Anwesenheit[]>('/anwesenheit');
    return response.data;
  }

  async getById(id: number): Promise<Anwesenheit> {
    const response = await api.get<Anwesenheit>(`/anwesenheit/${id}`);
    return response.data;
  }

  async getByKursAndDatum(kursId: number, datum: string): Promise<Anwesenheit[]> {
    const response = await api.get<Anwesenheit[]>(`/anwesenheit/kurs/${kursId}/datum/${datum}`);
    return response.data;
  }

  async getByTeilnehmerAndKurs(teilnehmerId: number, kursId: number): Promise<Anwesenheit[]> {
    const response = await api.get<Anwesenheit[]>(`/anwesenheit/teilnehmer/${teilnehmerId}/kurs/${kursId}`);
    return response.data;
  }

  async getStatistik(teilnehmerId: number, kursId: number): Promise<any> {
    const response = await api.get(`/anwesenheit/statistik/teilnehmer/${teilnehmerId}/kurs/${kursId}`);
    return response.data;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Anwesenheit[]> {
    const response = await api.get<Anwesenheit[]>(`/anwesenheit/zeitraum?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  }

  async create(data: Partial<Anwesenheit>): Promise<Anwesenheit> {
    const response = await api.post<Anwesenheit>('/anwesenheit', data);
    return response.data;
  }

  async createBulk(data: BulkAnwesenheitDto): Promise<Anwesenheit[]> {
    const response = await api.post<Anwesenheit[]>('/anwesenheit/bulk', data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/anwesenheit/${id}`);
  }
}

export default new AnwesenheitService();