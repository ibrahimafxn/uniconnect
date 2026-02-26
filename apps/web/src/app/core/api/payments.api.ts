import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export type PaymentPlan = {
  _id: string;
  studentId: string;
  label: string;
  totalAmount: number;
  currency: string;
};

export type Payment = {
  _id: string;
  studentId: string;
  planId?: string;
  amount: number;
  currency: string;
  paidAt: string;
  reference?: string;
};

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private readonly baseUrl = 'http://localhost:3000/api/payments';

  constructor(private readonly http: HttpClient) {}

  listPlans(): Observable<PaymentPlan[]> {
    return this.http.get<PaymentPlan[]>(`${this.baseUrl}/plans`);
  }

  createPlan(payload: Omit<PaymentPlan, '_id'>) {
    return this.http.post<PaymentPlan>(`${this.baseUrl}/plans`, payload);
  }

  listPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}`);
  }

  createPayment(payload: Omit<Payment, '_id'>) {
    return this.http.post<Payment>(`${this.baseUrl}`, payload);
  }
}
