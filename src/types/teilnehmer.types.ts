export interface Teilnehmer {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  telefon?: string;
  geburtsdatum?: string;
  geschlecht?: 'm' | 'w' | 'd';
  staatsangehoerigkeit?: string;
  muttersprache?: string;
  anmeldedatum: string;
  aktiv: boolean;
}

export interface CreateTeilnehmerDto {
  vorname: string;
  nachname: string;
  email: string;
  telefon?: string;
  geburtsdatum?: string;
  geschlecht?: 'm' | 'w' | 'd';
  staatsangehoerigkeit?: string;
  muttersprache?: string;
  aktiv?: boolean;
}