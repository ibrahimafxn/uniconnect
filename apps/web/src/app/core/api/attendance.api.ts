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

export type AbsenceJustification = {
  _id: string;
  studentId: string;
  sessionId?: string;
  absenceDate: string;
  reason: string;
  status: 'submitted' | 'accepted' | 'rejected';
  decisionNote?: string;
  originalName?: string;
  createdAt?: string;
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

  listMyJustifications() {
    return this.http.get<AbsenceJustification[]>(`${this.baseUrl}/justifications/me`);
  }

  listJustifications(status?: string, groupId?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (groupId) params = params.set('groupId', groupId);
    return this.http.get<AbsenceJustification[]>(`${this.baseUrl}/justifications`, { params });
  }

  createJustification(payload: { absenceDate: string; reason: string; sessionId?: string }, file?: File) {
    const fd = new FormData();
    fd.append('absenceDate', payload.absenceDate);
    fd.append('reason', payload.reason);
    if (payload.sessionId) fd.append('sessionId', payload.sessionId);
    if (file) fd.append('file', file);
    return this.http.post<AbsenceJustification>(`${this.baseUrl}/justifications`, fd);
  }

  downloadJustificationUrl(id: string) {
    return `${this.baseUrl}/justifications/${id}/download`;
  }
}
