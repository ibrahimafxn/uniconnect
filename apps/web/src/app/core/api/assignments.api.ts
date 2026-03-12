import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Assignment = {
  _id: string;
  title: string;
  description?: string;
  groupId: string;
  subjectId?: string;
  sessionId?: string;
  dueDate: string;
  originalName?: string;
  createdAt?: string;
};

export type Submission = {
  _id: string;
  assignmentId: string;
  studentId: string;
  comment?: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'submitted' | 'reviewed' | 'late';
  score?: number;
  feedback?: string;
  createdAt?: string;
};

@Injectable({ providedIn: 'root' })
export class AssignmentsApi {
  private readonly baseUrl = 'http://localhost:3000/api/assignments';

  constructor(private readonly http: HttpClient) {}

  list(params?: { groupId?: string; subjectId?: string }): Observable<Assignment[]> {
    let httpParams = new HttpParams();
    if (params?.groupId) httpParams = httpParams.set('groupId', params.groupId);
    if (params?.subjectId) httpParams = httpParams.set('subjectId', params.subjectId);
    return this.http.get<Assignment[]>(`${this.baseUrl}`, { params: httpParams });
  }

  create(payload: { title: string; description?: string; groupId: string; subjectId?: string; sessionId?: string; dueDate: string }, file?: File) {
    const fd = new FormData();
    fd.append('title', payload.title);
    if (payload.description) fd.append('description', payload.description);
    fd.append('groupId', payload.groupId);
    if (payload.subjectId) fd.append('subjectId', payload.subjectId);
    if (payload.sessionId) fd.append('sessionId', payload.sessionId);
    fd.append('dueDate', payload.dueDate);
    if (file) fd.append('file', file);
    return this.http.post<Assignment>(`${this.baseUrl}`, fd);
  }

  update(id: string, payload: Partial<Pick<Assignment, 'title' | 'description' | 'groupId' | 'subjectId' | 'dueDate'>>) {
    return this.http.patch<Assignment>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<{ deleted: boolean }>(`${this.baseUrl}/${id}`);
  }

  submit(assignmentId: string, file: File, comment?: string) {
    const fd = new FormData();
    fd.append('file', file);
    if (comment) fd.append('comment', comment);
    return this.http.post<Submission>(`${this.baseUrl}/${assignmentId}/submissions`, fd);
  }

  listSubmissions(assignmentId: string) {
    return this.http.get<Submission[]>(`${this.baseUrl}/${assignmentId}/submissions`);
  }

  mySubmission(assignmentId: string) {
    return this.http.get<Submission>(`${this.baseUrl}/${assignmentId}/submissions/me`);
  }

  updateSubmission(submissionId: string, payload: Partial<Pick<Submission, 'status' | 'score' | 'feedback'>>) {
    return this.http.patch<Submission>(`${this.baseUrl}/submissions/${submissionId}`, payload);
  }

  downloadSubmissionUrl(submissionId: string) {
    return `${this.baseUrl}/submissions/${submissionId}/download`;
  }

  downloadAssignmentUrl(assignmentId: string) {
    return `${this.baseUrl}/${assignmentId}/download`;
  }
}
