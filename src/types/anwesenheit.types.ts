// src/types/anwesenheit.types.ts
export interface Anwesenheit {
  id: number;
  teilnehmerId: number;
  teilnehmerName: string;
  kursId: number;
  kursName: string;
  datum: string;
  anwesend: boolean;
  entschuldigt: boolean;
  bemerkung?: string;
}

export interface AttendanceRecord {
  teilnehmerId: number;
  anwesend: boolean;
  entschuldigt: boolean;
  bemerkung?: string;
}

export interface BulkAnwesenheitDto {
  kursId: number;
  datum: string;
  attendanceRecords: AttendanceRecord[];
}

export interface AnwesenheitStatistik {
  totalDays: number;
  presentDays: number;
  excusedDays: number;
  unexcusedDays: number;
  attendanceRate: number;
}