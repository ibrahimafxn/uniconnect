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
export type Semester = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
};

export type Program = { _id: string; name: string; code?: string };
export type Level = { _id: string; name: string };
export type Offer = { _id: string; programId: string; levelId: string; academicYearId: string; capacity: number };
export type Group = { _id: string; name: string; offerId: string; programId: string; levelId: string };
export type CreateGroupPayload = { name: string; offerId: string };

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

  listSemesters(page = 1, limit = 50) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Paginated<Semester>>(`${this.baseUrl}/semesters`, { params });
  }

  createSemester(payload: Omit<Semester, '_id'>) {
    return this.http.post<Semester>(`${this.baseUrl}/semesters`, payload);
  }

  updateSemester(id: string, payload: Partial<Omit<Semester, '_id'>>) {
    return this.http.patch<Semester>(`${this.baseUrl}/semesters/${id}`, payload);
  }

  deleteSemester(id: string) {
    return this.http.delete<Semester>(`${this.baseUrl}/semesters/${id}`);
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

  listOffers(page = 1, limit = 50) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Paginated<Offer>>(`${this.baseUrl}/offers`, { params });
  }

  createOffer(payload: Omit<Offer, '_id'>) {
    return this.http.post<Offer>(`${this.baseUrl}/offers`, payload);
  }

  updateOffer(id: string, payload: Partial<Omit<Offer, '_id'>>) {
    return this.http.patch<Offer>(`${this.baseUrl}/offers/${id}`, payload);
  }

  deleteOffer(id: string) {
    return this.http.delete<Offer>(`${this.baseUrl}/offers/${id}`);
  }

  listGroups(page = 1, limit = 50) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Paginated<Group>>(`${this.baseUrl}/groups`, { params });
  }

  createGroup(payload: CreateGroupPayload) {
    return this.http.post<Group>(`${this.baseUrl}/groups`, payload);
  }

  updateGroup(id: string, payload: Partial<Omit<Group, '_id'>> & { offerId?: string }) {
    return this.http.patch<Group>(`${this.baseUrl}/groups/${id}`, payload);
  }

  deleteGroup(id: string) {
    return this.http.delete<Group>(`${this.baseUrl}/groups/${id}`);
  }
}
