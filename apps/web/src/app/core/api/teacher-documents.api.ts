import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type TeacherDocument = {
  _id: string;
  title: string;
  category: string;
  type: string;
  ownerId?: string;
  participantIds?: string[];
  version?: number;
  academicYearId?: string;
  originalName: string;
  createdAt?: string;
};

@Injectable({ providedIn: 'root' })
export class TeacherDocumentsApi {
  private readonly baseUrl = 'http://localhost:3000/api/teacher/documents';

  constructor(private readonly http: HttpClient) {}

  listMine() {
    return this.http.get<TeacherDocument[]>(`${this.baseUrl}`);
  }

  listTemplates() {
    return this.http.get<TeacherDocument[]>(`${this.baseUrl}/templates`);
  }

  listPv() {
    return this.http.get<TeacherDocument[]>(`${this.baseUrl}/pv`);
  }

  createExamSubject(payload: { title: string; academicYearId?: string; file: File }) {
    const fd = new FormData();
    fd.append('title', payload.title);
    if (payload.academicYearId) fd.append('academicYearId', payload.academicYearId);
    fd.append('file', payload.file);
    return this.http.post<TeacherDocument>(`${this.baseUrl}/exam-subjects`, fd);
  }

  createAttestation(payload?: { purpose?: string }) {
    return this.http.post<TeacherDocument>(`${this.baseUrl}/attestations`, payload ?? {});
  }

  downloadUrl(id: string) {
    return `${this.baseUrl}/${id}/download`;
  }

  remove(id: string) {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
  }
}
