// src/services/trainerService.ts
import api from './api';
import { Trainer, CreateTrainerDto } from '../types/trainer.types';

class TrainerService {
  async getAllTrainer(): Promise<Trainer[]> {
    const response = await api.get<Trainer[]>('/trainer');
    return response.data;
  }

  async getTrainerById(id: number): Promise<Trainer> {
    const response = await api.get<Trainer>(`/trainer/${id}`);
    return response.data;
  }

  async getVerfuegbareTrainer(): Promise<Trainer[]> {
    const response = await api.get<Trainer[]>('/trainer/verfuegbar');
    return response.data;
  }

  async getTrainerByAbteilung(abteilungId: number): Promise<Trainer[]> {
    const response = await api.get<Trainer[]>(`/trainer/abteilung/${abteilungId}`);
    return response.data;
  }

  async createTrainer(data: CreateTrainerDto): Promise<Trainer> {
    const response = await api.post<Trainer>('/trainer', data);
    return response.data;
  }

  async updateTrainer(id: number, data: Partial<CreateTrainerDto>): Promise<Trainer> {
    const response = await api.put<Trainer>(`/trainer/${id}`, data);
    return response.data;
  }

  async deleteTrainer(id: number): Promise<void> {
    await api.delete(`/trainer/${id}`);
  }
}

export default new TrainerService();