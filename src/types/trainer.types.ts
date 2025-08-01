// src/types/trainer.types.ts
export interface Trainer {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefon?: string;
  abteilungId: number;
  abteilungName?: string;
  status: TrainerStatus;
  qualifikationen?: string;
  einstellungsdatum?: string;
  aktiv: boolean;
}

export type TrainerStatus = 'verfuegbar' | 'im_einsatz' | 'abwesend';

export interface CreateTrainerDto {
  vorname: string;
  nachname: string;
  email: string;
  telefon?: string;
  abteilungId: number;
  status?: TrainerStatus;
  qualifikationen?: string;
  einstellungsdatum?: string;
  aktiv?: boolean;
}