import {TestBed} from '@angular/core/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {of} from 'rxjs';
import {AdminComponent} from './admin.component';
import {AcademicApi} from '../../core/api/academic.api';
import {StudentsApi} from '../../core/api/students.api';
import {PaymentsApi} from '../../core/api/payments.api';
import {UsersApi} from '../../core/api/users.api';
import {ConfirmService} from '../../core/confirm.service';

const confirm = { open: () => of(true) };

function buildMocks() {
  const academic = {
    listYears: jasmine.createSpy('listYears').and.returnValue(of({ items: [], total: 0, page: 1, limit: 50, skip: 0 })),
    listSemesters: jasmine.createSpy('listSemesters').and.returnValue(of({ items: [], total: 0, page: 1, limit: 50, skip: 0 })),
    listPrograms: jasmine.createSpy('listPrograms').and.returnValue(of({ items: [], total: 0, page: 1, limit: 50, skip: 0 })),
    listLevels: jasmine.createSpy('listLevels').and.returnValue(of({ items: [], total: 0, page: 1, limit: 50, skip: 0 })),
    listOffers: jasmine.createSpy('listOffers').and.returnValue(of({ items: [], total: 0, page: 1, limit: 50, skip: 0 })),
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
    createOffer: jasmine.createSpy('createOffer').and.returnValue(of({})),
    updateOffer: jasmine.createSpy('updateOffer').and.returnValue(of({})),
    deleteOffer: jasmine.createSpy('deleteOffer').and.returnValue(of({})),
    createGroup: jasmine.createSpy('createGroup').and.returnValue(of({})),
    updateGroup: jasmine.createSpy('updateGroup').and.returnValue(of({})),
    deleteGroup: jasmine.createSpy('deleteGroup').and.returnValue(of({})),
  };

  const students = {
    listStudents: jasmine.createSpy('listStudents').and.returnValue(of({ items: [], total: 120, page: 1, limit: 20, skip: 0 })),
    createStudent: jasmine.createSpy('createStudent').and.returnValue(of({})),
    updateStudent: jasmine.createSpy('updateStudent').and.returnValue(of({})),
    deleteStudent: jasmine.createSpy('deleteStudent').and.returnValue(of({})),
    listStudentDocuments: jasmine
      .createSpy('listStudentDocuments')
      .and.returnValue(of({ items: [], total: 0, page: 1, limit: 20, skip: 0 })),
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

  const users = {
    listAll: jasmine.createSpy('listAll').and.returnValue(of([])),
    createUser: jasmine.createSpy('createUser').and.returnValue(of({})),
    updateUser: jasmine.createSpy('updateUser').and.returnValue(of({})),
    deleteUser: jasmine.createSpy('deleteUser').and.returnValue(of({})),
  };

  return { academic, students, payments, users };
}

function setupAdmin() {
  const { academic, students, payments, users } = buildMocks();
  TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, FormsModule],
    providers: [
      { provide: AcademicApi, useValue: academic },
      { provide: StudentsApi, useValue: students },
      { provide: PaymentsApi, useValue: payments },
      { provide: UsersApi, useValue: users },
      { provide: ConfirmService, useValue: confirm },
    ],
  });

  const comp = TestBed.runInInjectionContext(() => new AdminComponent());
  return { comp, academic, students, payments, users };
}

describe('AdminComponent', () => {
  it('creates year when form valid', () => {
    const { comp, academic } = setupAdmin();
    comp.yearForm.setValue({
      name: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-07-15',
      isActive: true,
    });
    comp.createYear();
    expect(academic.createYear).toHaveBeenCalled();
  });

  it('does not create year when form invalid', () => {
    const { comp, academic } = setupAdmin();
    comp.yearForm.setValue({ name: '', startDate: '', endDate: '', isActive: false });
    comp.createYear();
    expect(academic.createYear).not.toHaveBeenCalled();
  });

  it('creates program when form valid', () => {
    const { comp, academic } = setupAdmin();
    comp.programForm.setValue({ name: 'Info', code: 'INFO' });
    comp.createProgram();
    expect(academic.createProgram).toHaveBeenCalled();
  });

  it('creates student when form valid', () => {
    const { comp, students } = setupAdmin();
    comp.studentForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      birthDate: '2004-03-15',
      status: 'active',
      email: 'john@school.tld',
      phone: '+221700000000',
      address: 'Dakar',
      offerId: 'o1',
      programId: 'p1',
      groupId: 'g1',
      academicYearId: 'y1',
    });
    comp.createStudent();
    expect(students.createStudent).toHaveBeenCalled();
  });

  it('does not create student when form invalid', () => {
    const { comp, students } = setupAdmin();
    comp.studentForm.setValue({
      firstName: '',
      lastName: '',
      gender: 'female',
      birthDate: '',
      status: 'active',
      email: '',
      phone: '',
      address: '',
      offerId: '',
      programId: '',
      groupId: '',
      academicYearId: '',
    });
    comp.createStudent();
    expect(students.createStudent).not.toHaveBeenCalled();
  });

  it('searchStudents resets page and reloads', () => {
    const { comp, students } = setupAdmin();
    comp.studentQuery = 'john';
    comp.studentPage = 3;
    comp.studentLimit = 20;
    comp.searchStudents();
    expect(comp.studentPage).toBe(1);
    expect(students.listStudents.calls.mostRecent().args).toEqual(['john', 1, 20]);
  });

  it('updates and deletes student', () => {
    const { comp, students } = setupAdmin();
    comp.updateStudentStatus('s1', 'suspended');
    comp.deleteStudent('s1');
    expect(students.updateStudent).toHaveBeenCalledWith('s1', { status: 'suspended' });
    expect(students.deleteStudent).toHaveBeenCalledWith('s1');
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

  it('plan edit flow updates plan', () => {
    const { comp, payments } = setupAdmin();
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
    comp.createPlan();
    expect(payments.updatePlan).toHaveBeenCalledWith('p1', jasmine.any(Object));
  });

  it('payment edit flow and receipt url', () => {
    const { comp, payments } = setupAdmin();
    comp.selectPaymentForEdit({
      _id: 'pay1',
      studentId: 's1',
      planId: 'p1',
      installmentId: 'i1',
      amount: 10,
      currency: 'XOF',
      paidAt: '2026-03-01',
      reference: 'REF',
      paymentMethod: 'espece',
    });
    comp.createPayment();
    expect(payments.updatePayment).toHaveBeenCalledWith('pay1', jasmine.any(Object));
    expect(comp.receiptUrl('pay1')).toBe('http://localhost/receipt');
  });

  it('documents flow', () => {
    const { comp, students } = setupAdmin();
    const file = new File(['data'], 'doc.txt', { type: 'text/plain' });
    comp.documentStudentId = 's1';
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
});
