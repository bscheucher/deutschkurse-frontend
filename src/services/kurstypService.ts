// src/services/kurstypService.ts
import api from './api';

export interface Kurstyp {
  id: number;
  name: string;
  beschreibung?: string;
}

export interface Kursraum {
  id: number;
  name: string;
  kapazitaet?: number;
  ausstattung?: string;
}

class KurstypService {
  async getAllKurstypen(): Promise<Kurstyp[]> {
    try {
      const response = await api.get<Kurstyp[]>('/kurstypen');
      return response.data;
    } catch (error) {
      console.warn('Could not fetch kurstypen from backend, using defaults');
      // Fallback to default course types
      return [
        { id: 1, name: 'Alphabetisierung' },
        { id: 2, name: 'Deutsch A1' },
        { id: 3, name: 'Deutsch A2' },
        { id: 4, name: 'Deutsch B1' },
        { id: 5, name: 'Deutsch B2' },
        { id: 6, name: 'Deutsch C1' },
      ];
    }
  }

  async getAllKursraeume(): Promise<Kursraum[]> {
    try {
      const response = await api.get<Kursraum[]>('/kursraeume');
      return response.data;
    } catch (error) {
      console.warn('Could not fetch kursraeume from backend, using defaults');
      // Fallback to default rooms
      return [
        { id: 1, name: 'Raum A101' },
        { id: 2, name: 'Raum A102' },
        { id: 3, name: 'Raum A103' },
        { id: 4, name: 'Raum B201' },
        { id: 5, name: 'Raum B202' },
      ];
    }
  }

  // Helper method to extract unique course types from existing kurse data
  async getKurstypenFromKurse(): Promise<Kurstyp[]> {
    try {
      // Import here to avoid circular dependency
      const kursService = await import('./kursService');
      const kurse = await kursService.default.getAllKurse();
      
      const unique = new Map<number, Kurstyp>();
      kurse.forEach((kurs: any) => {
        if (!unique.has(kurs.kurstypId)) {
          unique.set(kurs.kurstypId, {
            id: kurs.kurstypId,
            name: kurs.kurstypName
          });
        }
      });
      
      return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.warn('Could not extract kurstypen from kurse data');
      return this.getAllKurstypen();
    }
  }

  // Helper method to extract unique rooms from existing kurse data
  async getKursrauemeFromKurse(): Promise<Kursraum[]> {
    try {
      // Import here to avoid circular dependency
      const kursService = await import('./kursService');
      const kurse = await kursService.default.getAllKurse();
      
      const unique = new Map<number, Kursraum>();
      kurse.forEach((kurs: any) => {
        if (!unique.has(kurs.kursraumId)) {
          unique.set(kurs.kursraumId, {
            id: kurs.kursraumId,
            name: kurs.kursraumName
          });
        }
      });
      
      return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.warn('Could not extract kursraeume from kurse data');
      return this.getAllKursraeume();
    }
  }
}

export default new KurstypService();