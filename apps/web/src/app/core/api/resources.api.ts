import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Resource = {
  _id: string;
  title: string;
  description?: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  teacherId: string;
  sessionId?: string;
  groupId?: string;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class ResourcesApi {
  private readonly base = 'http://localhost:3000/api/resources';

  constructor(private readonly http: HttpClient) {}

  list(sessionId?: string, groupId?: string): Observable<Resource[]> {
    let params = new HttpParams();
    if (sessionId) params = params.set('sessionId', sessionId);
    if (groupId) params = params.set('groupId', groupId);
    return this.http.get<Resource[]>(this.base, { params });
  }

  upload(formData: FormData): Observable<Resource> {
    return this.http.post<Resource>(`${this.base}/upload`, formData);
  }

  getDownloadUrl(id: string): string {
    return `${this.base}/${id}/download`;
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
