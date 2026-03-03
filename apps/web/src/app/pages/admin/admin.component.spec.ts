import {TestBed} from '@angular/core/testing';
import {AdminComponent} from './admin.component';
import {AcademicApi} from '../../core/api/academic.api';
import {StudentsApi} from '../../core/api/students.api';
import {PaymentsApi} from '../../core/api/payments.api';
import {of} from 'rxjs';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

function buildMocks() {
  const academic = {
    listYears: jasmine.createSpy('listYears').and.returnValue(of({ items: [], total: 0, page: 1, limit: 50, skip: 0 })),
    listPrograms: jasmine.createSpy('listPrograms').and.returnValue(of({ items: [], total: 0, page: 1, limit: 50, skip: 0 })),
    listLevels: jasmine.createSpy('listLevels').and.returnValue(of({ items: [], total: 0, page: 1, limit: 50, skip: 0 })),
    listGroups: jasmine.createSpy('listGroups').and.returnValue(of({ items: [], total: 0, page: 1, limit: 50, skip: 0 })),
    createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
    updateYear: jasmine.createSpy('updateYear').and.returnValue(of({})),
    deleteYear: jasmine.createSpy('deleteYear').and.returnValue(of({})),
    createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
    updateProgram: jasmine.createSpy('updateProgram').and.returnValue(of({})),
    deleteProgram: jasmine.createSpy('deleteProgram').and.returnValue(of({})),
    createLevel: jasmine.createSpy('createLevel').and.returnValue(of({})),
    updateLevel: jasmine.createSpy('updateLevel').and.returnValue(of({})),
    deleteLevel: jasmine.createSpy('deleteLevel').and.returnValue(of({})),
    createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
    updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
    deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
  };

  const students = {
    listStudents: jasmine.createSpy('listStudents').and.returnValue(of({ items: [], total: 120, page: 1, limit: 50, skip: 0 })),
    createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    updateStudent: jasmine.createSpy('updateStudent').and.returnValue(of({})),
    deleteStudent: jasmine.createSpy('deleteStudent').and.returnValue(of({})),
    listStudentDocuments: jasmine.createSpy('listStudentDocuments').and.returnValue(of({ items: [], total: 0, page: 1, limit: 20, skip: 0 })),
    uploadStudentDocument: jasmine.createSpy('uploadStudentDocument').and.returnValue(of({})),
    downloadStudentDocument: jasmine.createSpy('downloadStudentDocument').and.returnValue('http://localhost/doc'),
    deleteStudentDocument: jasmine.createSpy('deleteStudentDocument').and.returnValue(of({})),
    updateStudentDocument: jasmine.createSpy('updateStudentDocument').and.returnValue(of({})),
  };

  const payments = {
    listPlans: jasmine.createSpy('listPlans').and.returnValue(of([])),
    listPayments: jasmine.createSpy('listPayments').and.returnValue(of([])),
    listUnpaid: jasmine.createSpy('listUnpaid').and.returnValue(of([])),
    receiptUrl: jasmine.createSpy('receiptUrl').and.returnValue('http://localhost/receipt'),
    createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
    updatePlan: jasmine.createSpy('updatePlan').and.returnValue(of({})),
    deletePlan: jasmine.createSpy('deletePlan').and.returnValue(of({})),
    createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
    updatePayment: jasmine.createSpy('updatePayment').and.returnValue(of({})),
    deletePayment: jasmine.createSpy('deletePayment').and.returnValue(of({})),
  };

  return { academic, students, payments };
}

function setupAdmin() {
  const { academic, students, payments } = buildMocks();
  TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, FormsModule],
    providers: [
      { provide: AcademicApi, useValue: academic },
      { provide: StudentsApi, useValue: students },
      { provide: PaymentsApi, useValue: payments },
    ],
  });
  const comp = TestBed.runInInjectionContext(() => new AdminComponent());
  return { comp, academic, students, payments };
}

describe('AdminComponent', () => {
  it('creates year and refreshes', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
      createLevel: jasmine.createSpy('createLevel').and.returnValue(of({})),
      createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
      updateYear: jasmine.createSpy('updateYear').and.returnValue(of({})),
      deleteYear: jasmine.createSpy('deleteYear').and.returnValue(of({})),
      updateProgram: jasmine.createSpy('updateProgram').and.returnValue(of({})),
      deleteProgram: jasmine.createSpy('deleteProgram').and.returnValue(of({})),
      updateLevel: jasmine.createSpy('updateLevel').and.returnValue(of({})),
      deleteLevel: jasmine.createSpy('deleteLevel').and.returnValue(of({})),
      updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
      deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      listUnpaid: () => of([]),
      receiptUrl: () => "",
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
      updatePlan: jasmine.createSpy('updatePlan').and.returnValue(of({})),
      deletePlan: jasmine.createSpy('deletePlan').and.returnValue(of({})),
      updatePayment: jasmine.createSpy('updatePayment').and.returnValue(of({})),
      deletePayment: jasmine.createSpy('deletePayment').and.returnValue(of({})),
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
      createLevel: jasmine.createSpy('createLevel').and.returnValue(of({})),
      createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
      updateYear: jasmine.createSpy('updateYear').and.returnValue(of({})),
      deleteYear: jasmine.createSpy('deleteYear').and.returnValue(of({})),
      updateProgram: jasmine.createSpy('updateProgram').and.returnValue(of({})),
      deleteProgram: jasmine.createSpy('deleteProgram').and.returnValue(of({})),
      updateLevel: jasmine.createSpy('updateLevel').and.returnValue(of({})),
      deleteLevel: jasmine.createSpy('deleteLevel').and.returnValue(of({})),
      updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
      deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      listUnpaid: () => of([]),
      receiptUrl: () => "",
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
      updatePlan: jasmine.createSpy('updatePlan').and.returnValue(of({})),
      deletePlan: jasmine.createSpy('deletePlan').and.returnValue(of({})),
      updatePayment: jasmine.createSpy('updatePayment').and.returnValue(of({})),
      deletePayment: jasmine.createSpy('deletePayment').and.returnValue(of({})),
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
      createLevel: jasmine.createSpy('createLevel').and.returnValue(of({})),
      createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
      updateYear: jasmine.createSpy('updateYear').and.returnValue(of({})),
      deleteYear: jasmine.createSpy('deleteYear').and.returnValue(of({})),
      updateProgram: jasmine.createSpy('updateProgram').and.returnValue(of({})),
      deleteProgram: jasmine.createSpy('deleteProgram').and.returnValue(of({})),
      updateLevel: jasmine.createSpy('updateLevel').and.returnValue(of({})),
      deleteLevel: jasmine.createSpy('deleteLevel').and.returnValue(of({})),
      updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
      deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      listUnpaid: () => of([]),
      receiptUrl: () => "",
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
      updatePlan: jasmine.createSpy('updatePlan').and.returnValue(of({})),
      deletePlan: jasmine.createSpy('deletePlan').and.returnValue(of({})),
      updatePayment: jasmine.createSpy('updatePayment').and.returnValue(of({})),
      deletePayment: jasmine.createSpy('deletePayment').and.returnValue(of({})),
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
    const year = new Date().getFullYear();
    comp.studentForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      studentNumber: `ML103DJ${year}`,
      gender: 'male',
      birthDate: '2004-03-15',
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
      createLevel: jasmine.createSpy('createLevel').and.returnValue(of({})),
      createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
      updateYear: jasmine.createSpy('updateYear').and.returnValue(of({})),
      deleteYear: jasmine.createSpy('deleteYear').and.returnValue(of({})),
      updateProgram: jasmine.createSpy('updateProgram').and.returnValue(of({})),
      deleteProgram: jasmine.createSpy('deleteProgram').and.returnValue(of({})),
      updateLevel: jasmine.createSpy('updateLevel').and.returnValue(of({})),
      deleteLevel: jasmine.createSpy('deleteLevel').and.returnValue(of({})),
      updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
      deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      listUnpaid: () => of([]),
      receiptUrl: () => "",
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
      updatePlan: jasmine.createSpy('updatePlan').and.returnValue(of({})),
      deletePlan: jasmine.createSpy('deletePlan').and.returnValue(of({})),
      updatePayment: jasmine.createSpy('updatePayment').and.returnValue(of({})),
      deletePayment: jasmine.createSpy('deletePayment').and.returnValue(of({})),
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

  it('updates year when editing', () => {
    const { comp, academic } = setupAdmin();
    spyOn(comp, 'refresh');
    spyOn(comp, 'cancelEditYear');
    comp.selectYearForEdit({ _id: 'y1', name: '2025-2026', startDate: '2025-09-01', endDate: '2026-07-15', isActive: true });
    comp.createYear();
    expect(academic.updateYear).toHaveBeenCalledWith('y1', jasmine.any(Object));
    expect(comp.cancelEditYear).toHaveBeenCalled();
    expect(comp.refresh).toHaveBeenCalled();
  });

  it('selects and cancels program edit', () => {
    const { comp } = setupAdmin();
    comp.selectProgramForEdit({ _id: 'p1', name: 'Info', code: 'INFO' });
    expect(comp.editingProgramId).toBe('p1');
    comp.cancelEditProgram();
    expect(comp.editingProgramId).toBeNull();
  });

  it('searchStudents resets page and reloads', () => {
    const { comp, students } = setupAdmin();
    comp.studentQuery = 'john';
    comp.studentPage = 3;
    comp.searchStudents();
    expect(comp.studentPage).toBe(1);
    expect(students.listStudents.calls.mostRecent().args).toEqual(['john', 1, 50]);
  });

  it('updates and deletes student', () => {
    const { comp, students } = setupAdmin();
    spyOn(comp, 'refresh');
    comp.updateStudentStatus('s1', 'suspended');
    comp.deleteStudent('s1');
    expect(students.updateStudent).toHaveBeenCalledWith('s1', { status: 'suspended' });
    expect(students.deleteStudent).toHaveBeenCalledWith('s1');
    expect(comp.refresh).toHaveBeenCalledTimes(2);
  });

  it('selects and saves student edit', () => {
    const { comp, students } = setupAdmin();
    spyOn(comp, 'refresh');
    comp.selectStudentForEdit({
      _id: 's1',
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      birthDate: '2004-03-15',
      status: 'active',
      email: 'john@school.tld',
      phone: '123',
      address: 'Dakar',
      groupId: 'g1',
      academicYearId: 'y1',
    });
    comp.saveStudentEdit();
    expect(students.updateStudent).toHaveBeenCalledWith('s1', jasmine.any(Object));
    expect(comp.editingStudentId).toBeNull();
    expect(comp.refresh).toHaveBeenCalled();
  });

  it('changeStudentPage respects bounds', () => {
    const { comp, students } = setupAdmin();
    comp.studentPage = 1;
    comp.studentTotal = 120;
    comp.changeStudentPage(-1);
    expect(comp.studentPage).toBe(1);
    comp.changeStudentPage(1);
    expect(comp.studentPage).toBe(2);
    expect(students.listStudents).toHaveBeenCalled();
  });

  it('plan installments and edit flow', () => {
    const { comp, payments } = setupAdmin();
    comp.addInstallment();
    expect(comp.installments.length).toBe(1);
    comp.removeInstallment(0);
    expect(comp.installments.length).toBe(0);

    comp.selectPlanForEdit({
      _id: 'p1',
      studentId: 's1',
      label: '2026',
      totalAmount: 100,
      currency: 'XOF',
      installments: [
        { amount: 50, dueDate: '2026-03-01', label: 'A' },
        { amount: 50, dueDate: '2026-04-01', label: 'B' },
      ],
    });
    expect(comp.installments.length).toBe(2);

    spyOn(comp, 'refresh');
    spyOn(comp, 'cancelEditPlan');
    comp.createPlan();
    expect(payments.updatePlan).toHaveBeenCalledWith('p1', jasmine.any(Object));
    expect(comp.cancelEditPlan).toHaveBeenCalled();
    expect(comp.refresh).toHaveBeenCalled();
  });

  it('payment edit flow and receipt url', () => {
    const { comp, payments } = setupAdmin();
    comp.selectPaymentForEdit({
      _id: 'pay1',
      studentId: 's1',
      planId: 'p1',
      amount: 10,
      currency: 'XOF',
      paidAt: '2026-03-01',
      reference: 'REF',
    });
    spyOn(comp, 'refresh');
    spyOn(comp, 'cancelEditPayment');
    comp.createPayment();
    expect(payments.updatePayment).toHaveBeenCalledWith('pay1', jasmine.any(Object));
    expect(comp.paymentReceiptUrl('pay1')).toBe('http://localhost/receipt');
    expect(comp.cancelEditPayment).toHaveBeenCalled();
    expect(comp.refresh).toHaveBeenCalled();
  });

  it('documents flow', () => {
    const { comp, students } = setupAdmin();
    const file = new File(['data'], 'doc.txt', { type: 'text/plain' });
    comp.onDocumentFileChange({ target: { files: [file] } } as any);
    expect(comp.documentFile).toBe(file);

    comp.loadDocuments();
    comp.documentForm.setValue({ studentId: 's1', label: 'Bulletin' });
    comp.uploadDocument();
    expect(students.uploadStudentDocument).toHaveBeenCalled();
    expect(comp.documentFile).toBeNull();

    comp.selectDocumentForEdit({ _id: 'd1', label: 'Old' } as any);
    expect(comp.editingDocumentId).toBe('d1');
    comp.saveDocumentEdit();
    expect(students.updateStudentDocument).toHaveBeenCalledWith('d1', jasmine.any(Object));

    comp.deleteDocument('d1');
    expect(students.deleteStudentDocument).toHaveBeenCalledWith('d1');
    expect(comp.documentDownloadUrl('d1')).toBe('http://localhost/doc');
  });

  it('does not create program when form invalid', () => {
    const academic = {
      listYears: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listPrograms: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listLevels: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createYear: jasmine.createSpy('createYear').and.returnValue(of({})),
      createProgram: jasmine.createSpy('createProgram').and.returnValue(of({})),
      createLevel: jasmine.createSpy('createLevel').and.returnValue(of({})),
      createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
      updateYear: jasmine.createSpy('updateYear').and.returnValue(of({})),
      deleteYear: jasmine.createSpy('deleteYear').and.returnValue(of({})),
      updateProgram: jasmine.createSpy('updateProgram').and.returnValue(of({})),
      deleteProgram: jasmine.createSpy('deleteProgram').and.returnValue(of({})),
      updateLevel: jasmine.createSpy('updateLevel').and.returnValue(of({})),
      deleteLevel: jasmine.createSpy('deleteLevel').and.returnValue(of({})),
      updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
      deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      listUnpaid: () => of([]),
      receiptUrl: () => "",
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
      updatePlan: jasmine.createSpy('updatePlan').and.returnValue(of({})),
      deletePlan: jasmine.createSpy('deletePlan').and.returnValue(of({})),
      updatePayment: jasmine.createSpy('updatePayment').and.returnValue(of({})),
      deletePayment: jasmine.createSpy('deletePayment').and.returnValue(of({})),
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
      createLevel: jasmine.createSpy('createLevel').and.returnValue(of({})),
      createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
      updateYear: jasmine.createSpy('updateYear').and.returnValue(of({})),
      deleteYear: jasmine.createSpy('deleteYear').and.returnValue(of({})),
      updateProgram: jasmine.createSpy('updateProgram').and.returnValue(of({})),
      deleteProgram: jasmine.createSpy('deleteProgram').and.returnValue(of({})),
      updateLevel: jasmine.createSpy('updateLevel').and.returnValue(of({})),
      deleteLevel: jasmine.createSpy('deleteLevel').and.returnValue(of({})),
      updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
      deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      listUnpaid: () => of([]),
      receiptUrl: () => "",
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
      updatePlan: jasmine.createSpy('updatePlan').and.returnValue(of({})),
      deletePlan: jasmine.createSpy('deletePlan').and.returnValue(of({})),
      updatePayment: jasmine.createSpy('updatePayment').and.returnValue(of({})),
      deletePayment: jasmine.createSpy('deletePayment').and.returnValue(of({})),
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
      gender: 'female',
      birthDate: '',
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
      createLevel: jasmine.createSpy('createLevel').and.returnValue(of({})),
      createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
      updateYear: jasmine.createSpy('updateYear').and.returnValue(of({})),
      deleteYear: jasmine.createSpy('deleteYear').and.returnValue(of({})),
      updateProgram: jasmine.createSpy('updateProgram').and.returnValue(of({})),
      deleteProgram: jasmine.createSpy('deleteProgram').and.returnValue(of({})),
      updateLevel: jasmine.createSpy('updateLevel').and.returnValue(of({})),
      deleteLevel: jasmine.createSpy('deleteLevel').and.returnValue(of({})),
      updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
      deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      listUnpaid: () => of([]),
      receiptUrl: () => "",
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
      updatePlan: jasmine.createSpy('updatePlan').and.returnValue(of({})),
      deletePlan: jasmine.createSpy('deletePlan').and.returnValue(of({})),
      updatePayment: jasmine.createSpy('updatePayment').and.returnValue(of({})),
      deletePayment: jasmine.createSpy('deletePayment').and.returnValue(of({})),
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
      installments: [],
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
      createLevel: jasmine.createSpy('createLevel').and.returnValue(of({})),
      createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
      updateYear: jasmine.createSpy('updateYear').and.returnValue(of({})),
      deleteYear: jasmine.createSpy('deleteYear').and.returnValue(of({})),
      updateProgram: jasmine.createSpy('updateProgram').and.returnValue(of({})),
      deleteProgram: jasmine.createSpy('deleteProgram').and.returnValue(of({})),
      updateLevel: jasmine.createSpy('updateLevel').and.returnValue(of({})),
      deleteLevel: jasmine.createSpy('deleteLevel').and.returnValue(of({})),
      updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
      deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
    };
    const students = {
      listStudents: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }),
      createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      listUnpaid: () => of([]),
      receiptUrl: () => "",
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
      updatePlan: jasmine.createSpy('updatePlan').and.returnValue(of({})),
      deletePlan: jasmine.createSpy('deletePlan').and.returnValue(of({})),
      updatePayment: jasmine.createSpy('updatePayment').and.returnValue(of({})),
      deletePayment: jasmine.createSpy('deletePayment').and.returnValue(of({})),
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
      createLevel: jasmine.createSpy('createLevel').and.returnValue(of({})),
      createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
      updateYear: jasmine.createSpy('updateYear').and.returnValue(of({})),
      deleteYear: jasmine.createSpy('deleteYear').and.returnValue(of({})),
      updateProgram: jasmine.createSpy('updateProgram').and.returnValue(of({})),
      deleteProgram: jasmine.createSpy('deleteProgram').and.returnValue(of({})),
      updateLevel: jasmine.createSpy('updateLevel').and.returnValue(of({})),
      deleteLevel: jasmine.createSpy('deleteLevel').and.returnValue(of({})),
      updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
      deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
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
      updateStudentDocument: jasmine.createSpy('updateStudentDocument').and.returnValue(of({})),
      downloadStudentDocument: jasmine.createSpy('downloadStudentDocument').and.returnValue(''),
    };
    const payments = {
      listPlans: () => of([]),
      listPayments: () => of([]),
      listUnpaid: () => of([]),
      receiptUrl: () => "",
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of({})),
      createPayment: jasmine.createSpy('createPayment').and.returnValue(of({})),
      updatePlan: jasmine.createSpy('updatePlan').and.returnValue(of({})),
      deletePlan: jasmine.createSpy('deletePlan').and.returnValue(of({})),
      updatePayment: jasmine.createSpy('updatePayment').and.returnValue(of({})),
      deletePayment: jasmine.createSpy('deletePayment').and.returnValue(of({})),
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
