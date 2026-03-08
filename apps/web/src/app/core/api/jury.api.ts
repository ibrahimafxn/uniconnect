import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type JuryDecision = {
  _id: string;
  studentId: string;
  groupId: string;
  session: string;
  decision: 'admis' | 'ajourne' | 'redoublant' | 'admis_avec_dettes';
  overallAverage?: number;
  ectsObtained: number;
  mention?: string;
  comment?: string;
};

export type JurySheet = {
  group: any;
  students: any[];
};

@Injectable({ providedIn: 'root' })
export class JuryApi {
  private readonly base = 'http://localhost:3000/api/jury';

  constructor(private readonly http: HttpClient) {}

  listDecisions(session?: string, groupId?: string): Observable<JuryDecision[]> {
    let params = new HttpParams();
    if (session) params = params.set('session', session);
    if (groupId) params = params.set('groupId', groupId);
    return this.http.get<JuryDecision[]>(`${this.base}/decisions`, { params });
  }

  prepareSheet(groupId: string): Observable<JurySheet> {
    return this.http.get<JurySheet>(`${this.base}/sheet`, { params: new HttpParams().set('groupId', groupId) });
  }

  upsertDecision(payload: Omit<JuryDecision, '_id' | 'ectsObtained'> & { ectsObtained?: number }) {
    return this.http.post<JuryDecision>(`${this.base}/decisions`, payload);
  }

  bulkDecisions(groupId: string, session: string, entries: any[]) {
    return this.http.post(`${this.base}/decisions/bulk`, { groupId, session, entries });
  }
}
