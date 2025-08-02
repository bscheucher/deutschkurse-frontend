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
    const response = await api.post<Kurs>('/kurse', data);
    return response.data;
  }

  async updateKurs(id: number, data: Partial<CreateKursDto>): Promise<Kurs> {
    const response = await api.put<Kurs>(`/kurse/${id}`, data);
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
}

export default new KursService();