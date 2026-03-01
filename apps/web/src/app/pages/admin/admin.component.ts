import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import {Observable, of, tap} from 'rxjs';
import {AcademicApi} from '../../core/api/academic.api';
import {StudentsApi} from '../../core/api/students.api';
import {PaymentsApi} from '../../core/api/payments.api';
import {Paginated, StudentDocument} from '../../core/api/students.api';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent {
  private readonly fb = inject(FormBuilder);
  private readonly academic = inject(AcademicApi);
  private readonly students = inject(StudentsApi);
  private readonly payments = inject(PaymentsApi);

  years$ = this.academic.listYears();
  programs$ = this.academic.listPrograms();
  levels$ = this.academic.listLevels();
  groups$ = this.academic.listGroups();
  studentQuery = '';
  studentPage = 1;
  studentLimit = 50;
  studentTotal = 0;
  editingStudentId: string | null = null;
  students$ = this.loadStudents();
  plans$ = this.payments.listPlans();
  payments$ = this.payments.listPayments();
  unpaid$ = this.payments.listUnpaid();
  documents$: Observable<Paginated<StudentDocument>> = of({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    skip: 0,
  });
  documentFile: File | null = null;

  yearForm = this.fb.group({
    name: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isActive: [false],
  });

  programForm = this.fb.group({
    name: ['', Validators.required],
    code: [''],
  });

  levelForm = this.fb.group({
    name: ['', Validators.required],
    programId: ['', Validators.required],
  });

  groupForm = this.fb.group({
    name: ['', Validators.required],
    levelId: ['', Validators.required],
  });

  studentForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    studentNumber: ['', Validators.required],
    status: ['active', Validators.required],
    email: [''],
    phone: [''],
    address: [''],
    groupId: ['', Validators.required],
    academicYearId: ['', Validators.required],
  });

  editStudentForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    status: ['active', Validators.required],
    email: [''],
    phone: [''],
    address: [''],
    groupId: ['', Validators.required],
    academicYearId: ['', Validators.required],
  });

  documentForm = this.fb.group({
    studentId: ['', Validators.required],
    label: [''],
  });

  planForm = this.fb.group({
    studentId: ['', Validators.required],
    label: ['', Validators.required],
    totalAmount: [0, Validators.required],
    currency: ['XOF', Validators.required],
    installments: this.fb.array([]),
  });

  paymentForm = this.fb.group({
    studentId: ['', Validators.required],
    planId: [''],
    amount: [0, Validators.required],
    currency: ['XOF', Validators.required],
    paidAt: ['', Validators.required],
    reference: [''],
  });

  private loadStudents() {
    return this.students
      .listStudents(this.studentQuery, this.studentPage, this.studentLimit)
      .pipe(tap((result) => (this.studentTotal = result.total ?? 0)));
  }

  refresh() {
    this.years$ = this.academic.listYears();
    this.programs$ = this.academic.listPrograms();
    this.levels$ = this.academic.listLevels();
    this.groups$ = this.academic.listGroups();
    this.students$ = this.loadStudents();
    this.plans$ = this.payments.listPlans();
    this.payments$ = this.payments.listPayments();
    this.unpaid$ = this.payments.listUnpaid();
  }

  createYear() {
    if (this.yearForm.invalid) return;
    this.academic.createYear(this.yearForm.value as any).subscribe(() => {
      this.yearForm.reset({ isActive: false });
      this.refresh();
    });
  }

  createProgram() {
    if (this.programForm.invalid) return;
    this.academic.createProgram(this.programForm.value as any).subscribe(() => {
      this.programForm.reset();
      this.refresh();
    });
  }

  createLevel() {
    if (this.levelForm.invalid) return;
    this.academic.createLevel(this.levelForm.value as any).subscribe(() => {
      this.levelForm.reset();
      this.refresh();
    });
  }

  createGroup() {
    if (this.groupForm.invalid) return;
    this.academic.createGroup(this.groupForm.value as any).subscribe(() => {
      this.groupForm.reset();
      this.refresh();
    });
  }

  createStudent() {
    if (this.studentForm.invalid) return;
    this.students.createStudent(this.studentForm.value as any).subscribe(() => {
      this.studentForm.reset({ status: 'active' });
      this.refresh();
    });
  }

  searchStudents() {
    this.studentPage = 1;
    this.students$ = this.loadStudents();
  }

  updateStudentStatus(studentId: string, status: 'active' | 'suspended' | 'graduated') {
    this.students.updateStudent(studentId, { status }).subscribe(() => {
      this.refresh();
    });
  }

  deleteStudent(studentId: string) {
    this.students.deleteStudent(studentId).subscribe(() => {
      this.refresh();
    });
  }

  selectStudentForEdit(student: any) {
    this.editingStudentId = student._id;
    this.editStudentForm.setValue({
      firstName: student.firstName ?? '',
      lastName: student.lastName ?? '',
      status: student.status ?? 'active',
      email: student.email ?? '',
      phone: student.phone ?? '',
      address: student.address ?? '',
      groupId: student.groupId ?? '',
      academicYearId: student.academicYearId ?? '',
    });
  }

  cancelEditStudent() {
    this.editingStudentId = null;
    this.editStudentForm.reset({ status: 'active' });
  }

  saveStudentEdit() {
    if (!this.editingStudentId || this.editStudentForm.invalid) return;
    this.students
      .updateStudent(this.editingStudentId, this.editStudentForm.value as any)
      .subscribe(() => {
        this.cancelEditStudent();
        this.refresh();
      });
  }

  changeStudentPage(delta: number) {
    const next = this.studentPage + delta;
    if (next < 1) return;
    const maxPage = Math.max(1, Math.ceil(this.studentTotal / this.studentLimit));
    if (next > maxPage) return;
    this.studentPage = next;
    this.students$ = this.loadStudents();
  }

  createPlan() {
    if (this.planForm.invalid) return;
    this.payments.createPlan(this.planForm.value as any).subscribe(() => {
      this.planForm.reset({ currency: 'XOF', totalAmount: 0 });
      this.installments.clear();
      this.refresh();
    });
  }

  createPayment() {
    if (this.paymentForm.invalid) return;
    this.payments.createPayment(this.paymentForm.value as any).subscribe(() => {
      this.paymentForm.reset({ currency: 'XOF', amount: 0 });
      this.refresh();
    });
  }

  get installments() {
    return this.planForm.get('installments') as FormArray;
  }

  addInstallment() {
    this.installments.push(
      this.fb.group({
        amount: [0, Validators.required],
        dueDate: ['', Validators.required],
        label: [''],
      }),
    );
  }

  removeInstallment(index: number) {
    this.installments.removeAt(index);
  }

  paymentReceiptUrl(paymentId: string) {
    return this.payments.receiptUrl(paymentId);
  }

  onDocumentFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.documentFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  loadDocuments() {
    const studentId = this.documentForm.value.studentId as string;
    if (!studentId) {
      this.documents$ = of({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        skip: 0,
      });
      return;
    }
    this.documents$ = this.students.listStudentDocuments(studentId, 1, 20);
  }

  uploadDocument() {
    if (this.documentForm.invalid || !this.documentFile) return;
    const { studentId, label } = this.documentForm.value as any;
    this.students.uploadStudentDocument(studentId, this.documentFile, label).subscribe(() => {
      this.documentForm.patchValue({ label: '' });
      this.documentFile = null;
      this.loadDocuments();
    });
  }

  documentDownloadUrl(docId: string) {
    return this.students.downloadStudentDocument(docId);
  }

  deleteDocument(docId: string) {
    this.students.deleteStudentDocument(docId).subscribe(() => {
      this.loadDocuments();
    });
  }
}
