import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Announcement = {
  _id: string;
  title: string;
  body: string;
  scope: string;
  category: string;
  groupId?: string;
  createdAt?: string;
};

@Injectable({ providedIn: 'root' })
export class AnnouncementsApi {
  private readonly baseUrl = 'http://localhost:3000/api/announcements';

  constructor(private readonly http: HttpClient) {}

  list(category?: string): Observable<Announcement[]> {
    const params = category ? new HttpParams().set('category', category) : undefined;
    return this.http.get<Announcement[]>(`${this.baseUrl}`, { params });
  }

  create(payload: { title: string; body: string; scope?: string; category?: string; groupId?: string }) {
    return this.http.post<Announcement>(`${this.baseUrl}`, payload);
  }
}
