import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type DocumentRequest = {
  _id: string;
  studentId: string;
  type: string;
  status: 'recu' | 'en_cours' | 'disponible' | 'rejete';
  note?: string;
  documentId?: string;
  createdAt?: string;
};

@Injectable({ providedIn: 'root' })
export class DocumentRequestsApi {
  private readonly baseUrl = 'http://localhost:3000/api/documents/requests';

  constructor(private readonly http: HttpClient) {}

  create(type: string, note?: string) {
    return this.http.post<DocumentRequest>(`${this.baseUrl}`, { type, note });
  }

  listMine(): Observable<DocumentRequest[]> {
    return this.http.get<DocumentRequest[]>(`${this.baseUrl}/me`);
  }

  listAll(status?: string): Observable<DocumentRequest[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<DocumentRequest[]>(`${this.baseUrl}`, { params });
  }

  update(id: string, payload: { status: string; note?: string; documentId?: string }) {
    return this.http.patch<DocumentRequest>(`${this.baseUrl}/${id}`, payload);
  }
}
