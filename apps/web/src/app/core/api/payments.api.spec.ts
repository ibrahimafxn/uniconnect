import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {PaymentsApi} from './payments.api';

describe('PaymentsApi', () => {
  let api: PaymentsApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PaymentsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listPlans calls API', () => {
    api.listPlans().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/payments/plans');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createPlan posts payload', () => {
    api.createPlan({ studentId: 's1', label: '2026', totalAmount: 100, currency: 'XOF' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/payments/plans');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'p1' });
  });

  it('updatePlan patches payload', () => {
    api.updatePlan('p1', { label: '2026-2027' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/payments/plans/p1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 'p1' });
  });

  it('deletePlan deletes by id', () => {
    api.deletePlan('p1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/payments/plans/p1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('listUnpaid can include asOf', () => {
    api.listUnpaid('2026-03-01').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/payments/unpaid?asOf=2026-03-01');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listUnpaid without asOf', () => {
    api.listUnpaid().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/payments/unpaid');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listPayments calls API', () => {
    api.listPayments().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/payments');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createPayment posts payload', () => {
    api
      .createPayment({
        studentId: 's1',
        amount: 50,
        currency: 'XOF',
        paidAt: '2026-03-01',
      })
      .subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/payments');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'pay1' });
  });

  it('updatePayment patches payload', () => {
    api.updatePayment('pay1', { reference: 'R1' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/payments/pay1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 'pay1' });
  });

  it('deletePayment deletes by id', () => {
    api.deletePayment('pay1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/payments/pay1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('receiptUrl builds path', () => {
    expect(api.receiptUrl('pay1')).toBe('http://localhost:3000/api/payments/pay1/receipt');
  });
});
