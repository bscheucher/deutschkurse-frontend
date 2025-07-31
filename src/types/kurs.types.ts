export interface Kurs {
  id: number;
  kursName: string;
  kurstypId: number;
  kurstypName: string;
  kursraumId: number;
  kursraumName: string;
  trainerId: number;
  trainerName: string;
  startdatum: string;
  enddatum: string;
  maxTeilnehmer: number;
  aktuelleTeilnehmer: number;
  status: KursStatus;
  beschreibung: string;
}

export type KursStatus = 'geplant' | 'laufend' | 'abgeschlossen' | 'abgebrochen';

export interface CreateKursDto {
  kursName: string;
  kurstypId: number;
  kursraumId: number;
  trainerId: number;
  startdatum: string;
  enddatum: string;
  maxTeilnehmer: number;
  status: KursStatus;
  beschreibung?: string;
}