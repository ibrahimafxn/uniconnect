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
  paymentMethod?: 'carte_bancaire' | 'espece' | 'mobile_money';
  status?: 'pending' | 'confirmed' | 'failed';
  provider?: string;
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

export type PlanStats = {
  plan: PaymentPlan;
  installmentStats: Record<string, { paid: number; status: 'paid' | 'partial' | 'unpaid' }>;
  student: { _id: string; firstName: string; lastName: string; studentNumber: string };
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

  updatePlan(id: string, payload: Partial<Omit<PaymentPlan, '_id'>>) {
    return this.http.patch<PaymentPlan>(`${this.baseUrl}/plans/${id}`, payload);
  }

  deletePlan(id: string) {
    return this.http.delete<PaymentPlan>(`${this.baseUrl}/plans/${id}`);
  }

  listUnpaid(asOf?: string): Observable<UnpaidItem[]> {
    const params = asOf ? `?asOf=${encodeURIComponent(asOf)}` : '';
    return this.http.get<UnpaidItem[]>(`${this.baseUrl}/unpaid${params}`);
  }

  listPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}`);
  }

  listMyPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/me`);
  }

  getMyPlan(): Observable<PlanStats | null> {
    return this.http.get<PlanStats | null>(`${this.baseUrl}/me/plan`);
  }

  createMyPayment(payload: { planId?: string; installmentId?: string; amount: number; currency: string; reference?: string; provider?: string }) {
    return this.http.post<Payment>(`${this.baseUrl}/me`, payload);
  }

  createPayment(payload: Omit<Payment, '_id'>) {
    return this.http.post<Payment>(`${this.baseUrl}`, payload);
  }

  updatePayment(id: string, payload: Partial<Omit<Payment, '_id'>>) {
    return this.http.patch<Payment>(`${this.baseUrl}/${id}`, payload);
  }

  deletePayment(id: string) {
    return this.http.delete<Payment>(`${this.baseUrl}/${id}`);
  }

  receiptUrl(paymentId: string) {
    return `${this.baseUrl}/${paymentId}/receipt`;
  }

  exportPlanPdfUrl(planId: string) {
    return `${this.baseUrl}/plans/${planId}/export-pdf`;
  }
}
