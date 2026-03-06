import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export type UserSummary = {
  id: string;
  email: string;
  role: string;
  createdAt?: string;
};

export type CreateUserPayload = {
  email: string;
  password: string;
  role: 'admin' | 'superadmin' | 'teacher' | 'external' | 'student';
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

  createUser(payload: CreateUserPayload): Observable<UserSummary> {
    return this.http.post<UserSummary>(this.baseUrl, payload);
  }
}
