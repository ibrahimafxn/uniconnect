import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Application = {
  _id: string;
  trackingCode: string;
  firstName: string;
  lastName: string;
  gender: 'female' | 'male';
  birthDate: string;
  email: string;
  phone?: string;
  address?: string;
  programId: string;
  offerId: string;
  academicYearId: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  submittedAt?: string;
  decisionNote?: string;
};

export type ApplicationDocument = {
  _id: string;
  applicationId: string;
  label?: string;
  originalName: string;
  mimeType: string;
  size: number;
};

@Injectable({ providedIn: 'root' })
export class ApplicationsApi {
  private readonly baseUrl = 'http://localhost:3000/api/applications';

  constructor(private readonly http: HttpClient) {}

  createPublic(payload: Partial<Application> & { submit?: boolean }): Observable<Application> {
    return this.http.post<Application>(`${this.baseUrl}/public`, payload);
  }

  getPublic(code: string, email: string): Observable<Application> {
    const params = new HttpParams().set('email', email);
    return this.http.get<Application>(`${this.baseUrl}/public/${code}`, { params });
  }

  updatePublic(code: string, payload: Partial<Application> & { email: string; submit?: boolean }) {
    return this.http.patch<Application>(`${this.baseUrl}/public/${code}`, payload);
  }

  uploadPublicDocument(code: string, email: string, file: File, label?: string) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('email', email);
    if (label) fd.append('label', label);
    return this.http.post<ApplicationDocument>(`${this.baseUrl}/public/${code}/documents`, fd);
  }

  listMy(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.baseUrl}/me`);
  }

  listAll(status?: string): Observable<Application[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Application[]>(`${this.baseUrl}`, { params });
  }

  updateStatus(id: string, payload: { status: string; decisionNote?: string }) {
    return this.http.patch<Application>(`${this.baseUrl}/${id}/status`, payload);
  }

  listDocuments(id: string) {
    return this.http.get<ApplicationDocument[]>(`${this.baseUrl}/${id}/documents`);
  }

  downloadDocumentUrl(docId: string) {
    return `${this.baseUrl}/documents/${docId}/download`;
  }
}
