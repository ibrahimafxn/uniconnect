import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Subject = {
  _id: string;
  name: string;
  code?: string;
  coefficient: number;
  levelId: string;
};

export type Evaluation = {
  _id: string;
  title: string;
  date: string;
  subjectId: string;
  groupId: string;
  maxScore: number;
  teacherId?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
};

export type NoteClaim = {
  _id: string;
  studentId: string;
  evaluationId: string;
  reason: string;
  requestedScore?: number;
  status: 'pending' | 'in_review' | 'accepted' | 'rejected';
  decisionNote?: string;
  deadlineAt?: string;
  handledBy?: string;
  handledAt?: string;
  createdAt?: string;
};

export type Grade = {
  _id: string;
  evaluationId: string;
  studentId: string;
  score: number;
  comment?: string;
};

@Injectable({ providedIn: 'root' })
export class NotesApi {
  private readonly baseUrl = 'http://localhost:3000/api/notes';

  constructor(private readonly http: HttpClient) {}

  listSubjects(levelId?: string): Observable<Subject[]> {
    const params = levelId ? new HttpParams().set('levelId', levelId) : undefined;
    return this.http.get<Subject[]>(`${this.baseUrl}/subjects`, { params });
  }

  createSubject(payload: Omit<Subject, '_id'>) {
    return this.http.post<Subject>(`${this.baseUrl}/subjects`, payload);
  }

  updateSubject(id: string, payload: Partial<Omit<Subject, '_id'>>) {
    return this.http.patch<Subject>(`${this.baseUrl}/subjects/${id}`, payload);
  }

  deleteSubject(id: string) {
    return this.http.delete<Subject>(`${this.baseUrl}/subjects/${id}`);
  }

  listEvaluations(groupId?: string, subjectId?: string): Observable<Evaluation[]> {
    let params = new HttpParams();
    if (groupId) params = params.set('groupId', groupId);
    if (subjectId) params = params.set('subjectId', subjectId);
    return this.http.get<Evaluation[]>(`${this.baseUrl}/evaluations`, { params });
  }

  listMyEvaluations(): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${this.baseUrl}/evaluations/me`);
  }

  createEvaluation(payload: Omit<Evaluation, '_id'>) {
    return this.http.post<Evaluation>(`${this.baseUrl}/evaluations`, payload);
  }

  updateEvaluation(id: string, payload: Partial<Omit<Evaluation, '_id'>>) {
    return this.http.patch<Evaluation>(`${this.baseUrl}/evaluations/${id}`, payload);
  }

  listGroupStudents(groupId: string) {
    return this.http.get<any[]>(`${this.baseUrl}/groups/${groupId}/students`);
  }

  listGrades(evaluationId: string): Observable<Grade[]> {
    return this.http.get<Grade[]>(`${this.baseUrl}/evaluations/${evaluationId}/grades`);
  }

  upsertGrades(evaluationId: string, grades: Array<{ studentId: string; score: number; comment?: string }>) {
    return this.http.post(`${this.baseUrl}/grades/bulk`, { evaluationId, grades });
  }

  studentSummary(studentId: string) {
    return this.http.get<any>(`${this.baseUrl}/students/${studentId}/summary`);
  }

  mySummary() {
    return this.http.get<any>(`${this.baseUrl}/students/me/summary`);
  }

  createClaim(payload: { evaluationId: string; reason: string; requestedScore?: number }) {
    return this.http.post<NoteClaim>(`${this.baseUrl}/claims`, payload);
  }

  listClaims(status?: NoteClaim['status']) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<NoteClaim[]>(`${this.baseUrl}/claims`, { params });
  }

  listMyClaims() {
    return this.http.get<NoteClaim[]>(`${this.baseUrl}/claims/me`);
  }

  updateClaim(id: string, payload: { status: NoteClaim['status']; decisionNote?: string }) {
    return this.http.patch<NoteClaim>(`${this.baseUrl}/claims/${id}`, payload);
  }

  exportClaims(status?: NoteClaim['status']) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get(`${this.baseUrl}/claims/export`, {
      params,
      responseType: 'blob',
    });
  }
}
