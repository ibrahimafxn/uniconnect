import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserSummary = {
  id: string;
  email: string;
  role: string;
};

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly baseUrl = 'http://localhost:3000/api/users';

  constructor(private readonly http: HttpClient) {}

  listTeachers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.baseUrl}/teachers`);
  }
}
