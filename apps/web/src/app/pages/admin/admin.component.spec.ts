import {TestBed} from '@angular/core/testing';
import {AdminComponent} from './admin.component';
import {AcademicApi} from '../../core/api/academic.api';
import {StudentsApi} from '../../core/api/students.api';
import {PaymentsApi} from '../../core/api/payments.api';
import {of} from 'rxjs';

describe('AdminComponent', () => {
  it('creates year and refreshes', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AcademicApi, useValue: academic },
        { provide: StudentsApi, useValue: students },
        { provide: PaymentsApi, useValue: payments },
      ],
    });

    const fixture = TestBed.createComponent(AdminComponent);
    const comp = fixture.componentInstance;

    comp.yearForm.setValue({
      name: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-07-15',
      isActive: true,
    });

    comp.createYear();
    expect(academic.createYear).toHaveBeenCalled();
  });

  it('creates program', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AcademicApi, useValue: academic },
        { provide: StudentsApi, useValue: students },
        { provide: PaymentsApi, useValue: payments },
      ],
    });

    const fixture = TestBed.createComponent(AdminComponent);
    const comp = fixture.componentInstance;
    comp.programForm.setValue({ name: 'Info', code: 'INFO' });
    comp.createProgram();
    expect(academic.createProgram).toHaveBeenCalled();
  });

  it('creates student', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AcademicApi, useValue: academic },
        { provide: StudentsApi, useValue: students },
        { provide: PaymentsApi, useValue: payments },
      ],
    });

    const fixture = TestBed.createComponent(AdminComponent);
    const comp = fixture.componentInstance;
    comp.studentForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      studentNumber: 'S1',
      status: 'active',
      email: 'john@school.tld',
      phone: '+221700000000',
      address: 'Dakar',
      groupId: 'g1',
      academicYearId: 'y1',
    });
    comp.createStudent();
    expect(students.createStudent).toHaveBeenCalled();
  });

  it('does not create year when form invalid', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AcademicApi, useValue: academic },
        { provide: StudentsApi, useValue: students },
        { provide: PaymentsApi, useValue: payments },
      ],
    });

    const fixture = TestBed.createComponent(AdminComponent);
    const comp = fixture.componentInstance;
    comp.yearForm.setValue({ name: '', startDate: '', endDate: '', isActive: false });
    comp.createYear();
    expect(academic.createYear).not.toHaveBeenCalled();
  });

  it('does not create program when form invalid', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AcademicApi, useValue: academic },
        { provide: StudentsApi, useValue: students },
        { provide: PaymentsApi, useValue: payments },
      ],
    });

    const fixture = TestBed.createComponent(AdminComponent);
    const comp = fixture.componentInstance;
    comp.programForm.setValue({ name: '', code: '' });
    comp.createProgram();
    expect(academic.createProgram).not.toHaveBeenCalled();
  });

  it('does not create student when form invalid', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AcademicApi, useValue: academic },
        { provide: StudentsApi, useValue: students },
        { provide: PaymentsApi, useValue: payments },
      ],
    });

    const fixture = TestBed.createComponent(AdminComponent);
    const comp = fixture.componentInstance;
    comp.studentForm.setValue({
      firstName: '',
      lastName: '',
      studentNumber: '',
      status: 'active',
      email: '',
      phone: '',
      address: '',
      groupId: '',
      academicYearId: '',
    });
    comp.createStudent();
    expect(students.createStudent).not.toHaveBeenCalled();
  });

  it('creates payment plan', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AcademicApi, useValue: academic },
        { provide: StudentsApi, useValue: students },
        { provide: PaymentsApi, useValue: payments },
      ],
    });

    const fixture = TestBed.createComponent(AdminComponent);
    const comp = fixture.componentInstance;
    comp.planForm.setValue({
      studentId: 's1',
      label: 'Mensuel',
      totalAmount: 100000,
      currency: 'XOF',
    });
    comp.createPlan();
    expect(payments.createPlan).toHaveBeenCalled();
  });

  it('creates payment', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AcademicApi, useValue: academic },
        { provide: StudentsApi, useValue: students },
        { provide: PaymentsApi, useValue: payments },
      ],
    });

    const fixture = TestBed.createComponent(AdminComponent);
    const comp = fixture.componentInstance;
    comp.paymentForm.setValue({
      studentId: 's1',
      planId: 'p1',
      amount: 5000,
      currency: 'XOF',
      paidAt: '2026-02-24',
      reference: 'PAY-001',
    });
    comp.createPayment();
    expect(payments.createPayment).toHaveBeenCalled();
  });

  it('searches and manages students + documents', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
    };
    const students = {
      listStudents: jasmine
        .createSpy('listStudents')
        .and.returnValue(of({ items: [], total: 0, page: 1, limit: 50, skip: 0 })),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
      updateStudent: jasmine.createSpy('updateStudent').and.returnValue(of({})),
      deleteStudent: jasmine.createSpy('deleteStudent').and.returnValue(of({})),
      listStudentDocuments: jasmine
        .createSpy('listStudentDocuments')
        .and.returnValue(of({ items: [], total: 0, page: 1, limit: 20, skip: 0 })),
      uploadStudentDocument: jasmine.createSpy('uploadStudentDocument').and.returnValue(of({})),
      deleteStudentDocument: jasmine.createSpy('deleteStudentDocument').and.returnValue(of({})),
      downloadStudentDocument: jasmine.createSpy('downloadStudentDocument').and.returnValue(''),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
    };

    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AcademicApi, useValue: academic },
        { provide: StudentsApi, useValue: students },
        { provide: PaymentsApi, useValue: payments },
      ],
    });

    const fixture = TestBed.createComponent(AdminComponent);
    const comp = fixture.componentInstance;

    comp.studentQuery = 'john';
    comp.searchStudents();
    expect(students.listStudents).toHaveBeenCalledWith('john', 1, 50);

    comp.updateStudentStatus('s1', 'suspended');
    expect(students.updateStudent).toHaveBeenCalledWith('s1', { status: 'suspended' });

    comp.deleteStudent('s1');
    expect(students.deleteStudent).toHaveBeenCalledWith('s1');

    comp.documentForm.setValue({ studentId: 's1', label: 'Inscription' });
    comp.documentFile = new File(['hello'], 'doc.pdf', { type: 'application/pdf' });
    comp.uploadDocument();
    expect(students.uploadStudentDocument).toHaveBeenCalled();

    comp.loadDocuments();
    expect(students.listStudentDocuments).toHaveBeenCalledWith('s1', 1, 20);

    comp.deleteDocument('d1');
    expect(students.deleteStudentDocument).toHaveBeenCalledWith('d1');
  });
});
