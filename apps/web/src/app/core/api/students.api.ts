import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

export type Paginated<T> = { items: T[]; total: number; page: number; limit: number; skip: number };

export type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  gender: 'female' | 'male';
  birthDate: string;
  status?: 'active' | 'suspended' | 'graduated';
  email?: string;
  groupId: string;
  offerId: string;
  programId: string;
  academicYearId: string;
};

export type Enrollment = {
  _id: string;
  studentId: string;
  academicYearId: string;
  status: string;
};

export type StudentDocument = {
  _id: string;
  studentId: string;
  label?: string;
  originalName: string;
  fileName: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt?: string;
};

@Injectable({ providedIn: 'root' })
export class StudentsApi {
  private readonly baseUrl = 'http://localhost:3000/api/students';

  constructor(private readonly http: HttpClient) {}

  listStudents(q = '', page = 1, limit = 50): Observable<Paginated<Student>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (q) params = params.set('q', q);
    return this.http.get<Paginated<Student>>(`${this.baseUrl}`, { params });
  }

  createStudent(payload: Omit<Student, '_id'>) {
    return this.http.post<Student>(`${this.baseUrl}`, payload);
  }

  updateStudent(id: string, payload: Partial<Omit<Student, '_id'>>) {
    return this.http.patch<Student>(`${this.baseUrl}/${id}`, payload);
  }

  deleteStudent(id: string) {
    return this.http.delete<Student>(`${this.baseUrl}/${id}`);
  }

  listEnrollments(page = 1, limit = 50) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Paginated<Enrollment>>(`${this.baseUrl}/enrollments`, { params });
  }

  createEnrollment(payload: Omit<Enrollment, '_id'>) {
    return this.http.post<Enrollment>(`${this.baseUrl}/enrollments`, payload);
  }

  listStudentDocuments(studentId: string, page = 1, limit = 20) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Paginated<StudentDocument>>(
      `${this.baseUrl}/${studentId}/documents`,
      { params },
    );
  }

  uploadStudentDocument(studentId: string, file: File, label?: string) {
    const payload = new FormData();
    payload.append('file', file);
    if (label) payload.append('label', label);
    return this.http.post<StudentDocument>(`${this.baseUrl}/${studentId}/documents`, payload);
  }

  downloadStudentDocument(docId: string) {
    return `${this.baseUrl}/documents/${docId}/download`;
  }

  deleteStudentDocument(docId: string) {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/documents/${docId}`);
  }

  updateStudentDocument(docId: string, payload: { label?: string }) {
    return this.http.patch<StudentDocument>(`${this.baseUrl}/documents/${docId}`, payload);
  }
}
