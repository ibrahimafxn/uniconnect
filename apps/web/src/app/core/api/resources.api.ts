import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Resource = {
  _id: string;
  title: string;
  description?: string;
  groupId: string;
  subjectId?: string;
  sessionId?: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt?: string;
};

@Injectable({ providedIn: 'root' })
export class ResourcesApi {
  private readonly baseUrl = 'http://localhost:3000/api/resources';

  constructor(private readonly http: HttpClient) {}

  list(params?: { groupId?: string; subjectId?: string; sessionId?: string }): Observable<Resource[]> {
    let httpParams = new HttpParams();
    if (params?.groupId) httpParams = httpParams.set('groupId', params.groupId);
    if (params?.subjectId) httpParams = httpParams.set('subjectId', params.subjectId);
    if (params?.sessionId) httpParams = httpParams.set('sessionId', params.sessionId);
    return this.http.get<Resource[]>(`${this.baseUrl}`, { params: httpParams });
  }

  create(payload: { title: string; description?: string; groupId: string; subjectId?: string; sessionId?: string }, file: File) {
    const fd = new FormData();
    fd.append('title', payload.title);
    if (payload.description) fd.append('description', payload.description);
    fd.append('groupId', payload.groupId);
    if (payload.subjectId) fd.append('subjectId', payload.subjectId);
    if (payload.sessionId) fd.append('sessionId', payload.sessionId);
    fd.append('file', file);
    return this.http.post<Resource>(`${this.baseUrl}`, fd);
  }

  delete(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  downloadUrl(id: string) {
    return `${this.baseUrl}/${id}/download`;
  }
}
