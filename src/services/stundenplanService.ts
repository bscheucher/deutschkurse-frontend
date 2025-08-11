// src/services/stundenplanService.ts
import api from './api';
import { CreateStundenplanDto } from '../types/stundenplan.types';

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

  async getStundenplanById(id: number): Promise<StundenplanEntry> {
    const response = await api.get<StundenplanEntry>(`/stundenplan/${id}`);
    return response.data;
  }

  async createStundenplanEntry(data: CreateStundenplanDto): Promise<StundenplanEntry> {
    console.log('Creating stundenplan entry:', data);
    
    // Ensure times are in correct format
    const formattedData = {
      ...data,
      startzeit: this.formatTime(data.startzeit),
      endzeit: this.formatTime(data.endzeit),
    };
    
    console.log('Formatted data for backend:', formattedData);
    
    const response = await api.post<StundenplanEntry>('/stundenplan', formattedData);
    return response.data;
  }

  async updateStundenplanEntry(id: number, data: Partial<CreateStundenplanDto>): Promise<StundenplanEntry> {
    console.log('Updating stundenplan entry:', id, data);
    
    // Format times if they exist
    const formattedData = { ...data };
    if (data.startzeit) {
      formattedData.startzeit = this.formatTime(data.startzeit);
    }
    if (data.endzeit) {
      formattedData.endzeit = this.formatTime(data.endzeit);
    }
    
    console.log('Formatted update data for backend:', formattedData);
    
    const response = await api.put<StundenplanEntry>(`/stundenplan/${id}`, formattedData);
    return response.data;
  }

  async deleteStundenplanEntry(id: number): Promise<void> {
    console.log('Deleting stundenplan entry:', id);
    await api.delete(`/stundenplan/${id}`);
  }

  // Get schedule entries by weekday
  async getStundenplanByWochentag(wochentag: string): Promise<StundenplanEntry[]> {
    const response = await api.get<StundenplanEntry[]>(`/stundenplan/wochentag/${wochentag}`);
    return response.data;
  }

  // Get all active schedule entries
  async getActiveStundenplan(): Promise<StundenplanEntry[]> {
    const response = await api.get<StundenplanEntry[]>('/stundenplan/aktiv');
    return response.data;
  }

  // Toggle active status
  async toggleStundenplanStatus(id: number, aktiv: boolean): Promise<StundenplanEntry> {
    const response = await api.patch<StundenplanEntry>(`/stundenplan/${id}/status`, { aktiv });
    return response.data;
  }

  // Helper method to format time for backend (ensure HH:MM:SS format)
  private formatTime(time: string): string {
    if (!time) return '';
    
    // If already in HH:MM:SS format, return as is
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return time;
    }
    
    // If in HH:MM format, add seconds
    if (time.match(/^\d{2}:\d{2}$/)) {
      return `${time}:00`;
    }
    
    // If in H:MM format, pad with zero
    if (time.match(/^\d{1}:\d{2}$/)) {
      return `0${time}:00`;
    }
    
    // Try to parse and format
    try {
      const [hours, minutes] = time.split(':');
      const paddedHours = hours.padStart(2, '0');
      const paddedMinutes = (minutes || '00').padStart(2, '0');
      return `${paddedHours}:${paddedMinutes}:00`;
    } catch (error) {
      console.warn('Time formatting error:', error);
      return time; // Return original if formatting fails
    }
  }

  // Helper method to validate schedule conflicts
  async checkScheduleConflicts(
    kursId: number, 
    wochentag: string, 
    startzeit: string, 
    endzeit: string,
    excludeId?: number
  ): Promise<StundenplanEntry[]> {
    const params = new URLSearchParams({
      kursId: kursId.toString(),
      wochentag,
      startzeit: this.formatTime(startzeit),
      endzeit: this.formatTime(endzeit),
    });
    
    if (excludeId) {
      params.append('excludeId', excludeId.toString());
    }
    
    const response = await api.get<StundenplanEntry[]>(`/stundenplan/conflicts?${params}`);
    return response.data;
  }
}

export default new StundenplanService();