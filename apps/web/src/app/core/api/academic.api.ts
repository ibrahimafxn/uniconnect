import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

export type Paginated<T> = { items: T[]; total: number; page: number; limit: number; skip: number };

export type AcademicYear = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export type Program = { _id: string; name: string; code?: string };
export type Level = { _id: string; name: string; programId: string };
export type Group = { _id: string; name: string; levelId: string };

@Injectable({ providedIn: 'root' })
export class AcademicApi {
  private readonly baseUrl = 'http://localhost:3000/api/academic';

  constructor(private readonly http: HttpClient) {}

  listYears(page = 1, limit = 50): Observable<Paginated<AcademicYear>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Paginated<AcademicYear>>(`${this.baseUrl}/years`, { params });
  }

  createYear(payload: Omit<AcademicYear, '_id'>) {
    return this.http.post<AcademicYear>(`${this.baseUrl}/years`, payload);
  }

  updateYear(id: string, payload: Partial<Omit<AcademicYear, '_id'>>) {
    return this.http.patch<AcademicYear>(`${this.baseUrl}/years/${id}`, payload);
  }

  deleteYear(id: string) {
    return this.http.delete<AcademicYear>(`${this.baseUrl}/years/${id}`);
  }

  listPrograms(page = 1, limit = 50) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Paginated<Program>>(`${this.baseUrl}/programs`, { params });
  }

  createProgram(payload: Omit<Program, '_id'>) {
    return this.http.post<Program>(`${this.baseUrl}/programs`, payload);
  }

  updateProgram(id: string, payload: Partial<Omit<Program, '_id'>>) {
    return this.http.patch<Program>(`${this.baseUrl}/programs/${id}`, payload);
  }

  deleteProgram(id: string) {
    return this.http.delete<Program>(`${this.baseUrl}/programs/${id}`);
  }

  listLevels(page = 1, limit = 50) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Paginated<Level>>(`${this.baseUrl}/levels`, { params });
  }

  createLevel(payload: Omit<Level, '_id'>) {
    return this.http.post<Level>(`${this.baseUrl}/levels`, payload);
  }

  updateLevel(id: string, payload: Partial<Omit<Level, '_id'>>) {
    return this.http.patch<Level>(`${this.baseUrl}/levels/${id}`, payload);
  }

  deleteLevel(id: string) {
    return this.http.delete<Level>(`${this.baseUrl}/levels/${id}`);
  }

  listGroups(page = 1, limit = 50) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Paginated<Group>>(`${this.baseUrl}/groups`, { params });
  }

  createGroup(payload: Omit<Group, '_id'>) {
    return this.http.post<Group>(`${this.baseUrl}/groups`, payload);
  }

  updateGroup(id: string, payload: Partial<Omit<Group, '_id'>>) {
    return this.http.patch<Group>(`${this.baseUrl}/groups/${id}`, payload);
  }

  deleteGroup(id: string) {
    return this.http.delete<Group>(`${this.baseUrl}/groups/${id}`);
  }
}
