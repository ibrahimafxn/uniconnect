import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export type AttendanceEntry = {
  studentId: string;
  firstName: string;
  lastName: string;
  studentNumber?: string;
  status: AttendanceStatus | null;
  note: string | null;
};

export type AttendanceSummary = {
  studentId: string;
  firstName: string;
  lastName: string;
  studentNumber?: string;
  total: number;
  present: number;
  absent: number;
  excused: number;
  rate: number | null;
};

@Injectable({providedIn: 'root'})
export class AttendanceApi {
  private readonly baseUrl = 'http://localhost:3000/api/attendance';

  constructor(private readonly http: HttpClient) {}

  getSessionAttendance(sessionId: string): Observable<AttendanceEntry[]> {
    return this.http.get<AttendanceEntry[]>(`${this.baseUrl}/sessions/${sessionId}`);
  }

  upsertAttendance(
    sessionId: string,
    entries: Array<{studentId: string; status: AttendanceStatus; note?: string}>,
  ) {
    return this.http.post(`${this.baseUrl}/sessions/${sessionId}`, {entries});
  }

  getGroupSummary(groupId: string): Observable<AttendanceSummary[]> {
    return this.http.get<AttendanceSummary[]>(`${this.baseUrl}/groups/${groupId}/summary`);
  }

  getStudentSummary(studentId: string) {
    return this.http.get<any>(`${this.baseUrl}/students/${studentId}/summary`);
  }

  /** UC-E04 — Étudiants en difficulté (taux d'absence > seuil) */
  getAbsenceAlerts(groupId: string, threshold = 30) {
    const params = new HttpParams().set('threshold', threshold);
    return this.http.get<(AttendanceSummary & { absenceRate: number })[]>(
      `${this.baseUrl}/groups/${groupId}/alerts`,
      { params },
    );
  }
}
