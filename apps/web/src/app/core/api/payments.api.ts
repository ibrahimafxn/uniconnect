import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export type PaymentPlan = {
  _id: string;
  studentId: string;
  label: string;
  totalAmount: number;
  currency: string;
  installments?: PaymentInstallment[];
};

export type PaymentInstallment = {
  _id?: string;
  amount: number;
  dueDate: string;
  label?: string;
};

export type Payment = {
  _id: string;
  studentId: string;
  planId?: string;
  installmentId?: string;
  amount: number;
  currency: string;
  paidAt: string;
  reference?: string;
};

export type UnpaidItem = {
  planId: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  totalAmount: number;
  dueAmount: number;
  totalPaid: number;
  balanceDue: number;
  currency: string;
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

  listUnpaid(asOf?: string): Observable<UnpaidItem[]> {
    const params = asOf ? `?asOf=${encodeURIComponent(asOf)}` : '';
    return this.http.get<UnpaidItem[]>(`${this.baseUrl}/unpaid${params}`);
  }

  listPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}`);
  }

  createPayment(payload: Omit<Payment, '_id'>) {
    return this.http.post<Payment>(`${this.baseUrl}`, payload);
  }

  receiptUrl(paymentId: string) {
    return `${this.baseUrl}/${paymentId}/receipt`;
  }
}
