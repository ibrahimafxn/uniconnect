import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type InterventionSheet = {
  _id: string;
  teacherId: string;
  period: string;
  hoursCM: number;
  hoursTD: number;
  hoursTP: number;
  hourlyRate: number;
  currency: string;
  totalAmount: number;
  status: 'draft' | 'submitted' | 'validated' | 'paid';
  comment?: string;
  adminComment?: string;
  validatedAt?: string;
  paidAt?: string;
};

@Injectable({ providedIn: 'root' })
export class InterventionApi {
  private readonly base = 'http://localhost:3000/api/interventions';

  constructor(private readonly http: HttpClient) {}

  list(status?: string): Observable<InterventionSheet[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<InterventionSheet[]>(this.base, { params });
  }

  create(payload: Omit<InterventionSheet, '_id' | 'totalAmount' | 'status' | 'teacherId'>) {
    return this.http.post<InterventionSheet>(this.base, payload);
  }

  submit(id: string) {
    return this.http.patch(`${this.base}/${id}/submit`, {});
  }

  validate(id: string, adminComment?: string) {
    return this.http.patch(`${this.base}/${id}/validate`, { adminComment });
  }

  markPaid(id: string) {
    return this.http.patch(`${this.base}/${id}/paid`, {});
  }
}
