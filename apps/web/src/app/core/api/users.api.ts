import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export type UserSummary = {
  id: string;
  email: string;
  role: string;
  createdAt?: string;
};

export type UnlinkedProfile = {
  _id: string;
  firstName: string;
  lastName: string;
  studentNumber?: string;
  specialty?: string;
  email?: string;
};

export type CreateUserPayload = {
  email: string;
  password: string;
  role: 'admin' | 'superadmin' | 'teacher' | 'external' | 'student';
  profileId?: string;
};
export type UpdateUserPayload = {
  email?: string;
  password?: string;
  role?: 'admin' | 'superadmin' | 'teacher' | 'external' | 'student';
};

@Injectable({providedIn: 'root'})
export class UsersApi {
  private readonly baseUrl = 'http://localhost:3000/api/users';

  constructor(private readonly http: HttpClient) {}

  listAll(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(this.baseUrl);
  }

  listTeachers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.baseUrl}/teachers`);
  }

  listUnlinkedStudents(q?: string): Observable<UnlinkedProfile[]> {
    return this.http.get<UnlinkedProfile[]>(`${this.baseUrl}/unlinked-students`, { params: q ? { q } : {} });
  }

  listUnlinkedTeachers(q?: string): Observable<UnlinkedProfile[]> {
    return this.http.get<UnlinkedProfile[]>(`${this.baseUrl}/unlinked-teachers`, { params: q ? { q } : {} });
  }

  createUser(payload: CreateUserPayload): Observable<UserSummary> {
    return this.http.post<UserSummary>(this.baseUrl, payload);
  }

  updateUser(id: string, payload: UpdateUserPayload): Observable<UserSummary> {
    return this.http.patch<UserSummary>(`${this.baseUrl}/${id}`, payload);
  }

  deleteUser(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
  }
}
