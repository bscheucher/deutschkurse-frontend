// src/types/stundenplan.types.ts
export interface Stundenplan {
  id: number;
  kursId: number;
  kursName: string;
  wochentag: 'Montag' | 'Dienstag' | 'Mittwoch' | 'Donnerstag' | 'Freitag';
  startzeit: string; // Format: "HH:MM:SS"
  endzeit: string;   // Format: "HH:MM:SS"
  bemerkungen?: string | null;
  aktiv: boolean;
  validTimeRange: boolean;
}

export interface CreateStundenplanDto {
  kursId: number;
  wochentag: 'Montag' | 'Dienstag' | 'Mittwoch' | 'Donnerstag' | 'Freitag';
  startzeit: string; // Format: "HH:MM:SS"
  endzeit: string;   // Format: "HH:MM:SS"
  bemerkungen?: string;
  aktiv?: boolean;
}

export interface StundenplanWithCourseDetails extends Stundenplan {
  status: string;
  kurstypName: string;
  trainerName: string;
  kursraumName: string;
}