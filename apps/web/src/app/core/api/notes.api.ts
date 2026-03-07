import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UE = {
  _id: string;
  name: string;
  code?: string;
  ects: number;
  levelId: string;
  semesterId?: string;
};

export type Subject = {
  _id: string;
  name: string;
  code?: string;
  coefficient: number;
  levelId: string;
  ueId?: string;
};

export type Evaluation = {
  _id: string;
  title: string;
  date: string;
  subjectId: string;
  groupId: string;
  maxScore: number;
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

  // ==================== UE ====================

  listUE(levelId?: string, semesterId?: string): Observable<UE[]> {
    let params = new HttpParams();
    if (levelId) params = params.set('levelId', levelId);
    if (semesterId) params = params.set('semesterId', semesterId);
    return this.http.get<UE[]>(`${this.baseUrl}/ue`, { params });
  }

  createUE(payload: Omit<UE, '_id'>) {
    return this.http.post<UE>(`${this.baseUrl}/ue`, payload);
  }

  updateUE(id: string, payload: Partial<Omit<UE, '_id'>>) {
    return this.http.patch<UE>(`${this.baseUrl}/ue/${id}`, payload);
  }

  deleteUE(id: string) {
    return this.http.delete<UE>(`${this.baseUrl}/ue/${id}`);
  }

  // ==================== Subjects (ECUE) ====================

  listSubjects(levelId?: string, ueId?: string): Observable<Subject[]> {
    let params = new HttpParams();
    if (ueId) params = params.set('ueId', ueId);
    else if (levelId) params = params.set('levelId', levelId);
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

  // ==================== Evaluations ====================

  listEvaluations(groupId?: string, subjectId?: string): Observable<Evaluation[]> {
    let params = new HttpParams();
    if (groupId) params = params.set('groupId', groupId);
    if (subjectId) params = params.set('subjectId', subjectId);
    return this.http.get<Evaluation[]>(`${this.baseUrl}/evaluations`, { params });
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
}
