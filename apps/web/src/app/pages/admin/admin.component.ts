import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  FormArray, FormBuilder, ReactiveFormsModule, Validators, FormsModule,
} from '@angular/forms';
import {Observable, of, tap} from 'rxjs';
import {AcademicApi} from '../../core/api/academic.api';
import {StudentsApi} from '../../core/api/students.api';
import {PaymentsApi} from '../../core/api/payments.api';
import {UsersApi} from '../../core/api/users.api';
import {Paginated, StudentDocument} from '../../core/api/students.api';

export type AdminTab = 'structure' | 'students' | 'payments' | 'users' | 'documents';

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
  private readonly usersApi = inject(UsersApi);

  // === TABS ===
  activeTab: AdminTab = 'structure';
  tabs: Array<{id: AdminTab; label: string; icon: string}> = [
    {id: 'structure', label: 'Structure', icon: '🏛️'},
    {id: 'students', label: 'Étudiants', icon: '🎓'},
    {id: 'payments', label: 'Paiements', icon: '💰'},
    {id: 'documents', label: 'Documents', icon: '📄'},
    {id: 'users', label: 'Utilisateurs', icon: '👤'},
  ];

  // === DRAWER ===
  drawerOpen = false;
  drawerTitle = '';
  drawerMode: 'year' | 'program' | 'level' | 'group' | 'student' | 'plan' | 'payment' | 'user' | 'document' | null = null;

  openDrawer(mode: typeof this.drawerMode, title: string) {
    this.drawerMode = mode;
    this.drawerTitle = title;
    this.drawerOpen = true;
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.drawerMode = null;
    this.cancelAll();
  }

  cancelAll() {
    this.cancelEditYear(); this.cancelEditProgram(); this.cancelEditLevel();
    this.cancelEditGroup(); this.cancelEditStudent(); this.cancelEditPlan();
    this.cancelEditPayment(); this.cancelEditDocument(); this.cancelEditUser();
  }

  // === ACADEMIC ===
  years$ = this.academic.listYears();
  programs$ = this.academic.listPrograms();
  levels$ = this.academic.listLevels();
  groups$ = this.academic.listGroups();

  yearForm = this.fb.group({
    name: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isActive: [false],
  });
  editingYearId: string | null = null;

  programForm = this.fb.group({ name: ['', Validators.required], code: [''] });
  editingProgramId: string | null = null;

  levelForm = this.fb.group({
    name: ['', Validators.required], programId: ['', Validators.required],
  });
  editingLevelId: string | null = null;

  groupForm = this.fb.group({
    name: ['', Validators.required], levelId: ['', Validators.required],
  });
  editingGroupId: string | null = null;

  createYear() {
    if (this.yearForm.invalid) return;
    const obs = this.editingYearId
      ? this.academic.updateYear(this.editingYearId, this.yearForm.value as any)
      : this.academic.createYear(this.yearForm.value as any);
    obs.subscribe(() => { this.cancelEditYear(); this.refreshAcademic(); this.closeDrawer(); });
  }

  selectYearForEdit(year: any) {
    this.editingYearId = year._id;
    this.yearForm.setValue({
      name: year.name ?? '', startDate: this.fmtDate(year.startDate),
      endDate: this.fmtDate(year.endDate), isActive: !!year.isActive,
    });
    this.openDrawer('year', 'Modifier l\'année');
  }

  cancelEditYear() { this.editingYearId = null; this.yearForm.reset({isActive: false}); }
  deleteYear(id: string) { this.academic.deleteYear(id).subscribe(() => this.refreshAcademic()); }

  createProgram() {
    if (this.programForm.invalid) return;
    const obs = this.editingProgramId
      ? this.academic.updateProgram(this.editingProgramId, this.programForm.value as any)
      : this.academic.createProgram(this.programForm.value as any);
    obs.subscribe(() => { this.cancelEditProgram(); this.refreshAcademic(); this.closeDrawer(); });
  }

  selectProgramForEdit(p: any) {
    this.editingProgramId = p._id;
    this.programForm.setValue({name: p.name ?? '', code: p.code ?? ''});
    this.openDrawer('program', 'Modifier la filière');
  }

  cancelEditProgram() { this.editingProgramId = null; this.programForm.reset(); }
  deleteProgram(id: string) { this.academic.deleteProgram(id).subscribe(() => this.refreshAcademic()); }

  createLevel() {
    if (this.levelForm.invalid) return;
    const obs = this.editingLevelId
      ? this.academic.updateLevel(this.editingLevelId, this.levelForm.value as any)
      : this.academic.createLevel(this.levelForm.value as any);
    obs.subscribe(() => { this.cancelEditLevel(); this.refreshAcademic(); this.closeDrawer(); });
  }

  selectLevelForEdit(l: any) {
    this.editingLevelId = l._id;
    this.levelForm.setValue({name: l.name ?? '', programId: l.programId ?? ''});
    this.openDrawer('level', 'Modifier le niveau');
  }

  cancelEditLevel() { this.editingLevelId = null; this.levelForm.reset(); }
  deleteLevel(id: string) { this.academic.deleteLevel(id).subscribe(() => this.refreshAcademic()); }

  createGroup() {
    if (this.groupForm.invalid) return;
    const obs = this.editingGroupId
      ? this.academic.updateGroup(this.editingGroupId, this.groupForm.value as any)
      : this.academic.createGroup(this.groupForm.value as any);
    obs.subscribe(() => { this.cancelEditGroup(); this.refreshAcademic(); this.closeDrawer(); });
  }

  selectGroupForEdit(g: any) {
    this.editingGroupId = g._id;
    this.groupForm.setValue({name: g.name ?? '', levelId: g.levelId ?? ''});
    this.openDrawer('group', 'Modifier le groupe');
  }

  cancelEditGroup() { this.editingGroupId = null; this.groupForm.reset(); }
  deleteGroup(id: string) { this.academic.deleteGroup(id).subscribe(() => this.refreshAcademic()); }

  refreshAcademic() {
    this.years$ = this.academic.listYears();
    this.programs$ = this.academic.listPrograms();
    this.levels$ = this.academic.listLevels();
    this.groups$ = this.academic.listGroups();
  }

  programName(programs: any[] | null, id: string): string {
    return programs?.find((p) => p._id === id)?.name ?? id;
  }

  levelName(levels: any[] | null, id: string): string {
    return levels?.find((l) => l._id === id)?.name ?? id;
  }

  // === STUDENTS ===
  studentQuery = '';
  studentPage = 1;
  studentLimit = 20;
  studentTotal = 0;
  editingStudentId: string | null = null;
  students$ = this.loadStudents();

  studentForm = this.fb.group({
    firstName: ['', Validators.required], lastName: ['', Validators.required],
    studentNumber: ['', [Validators.required, Validators.pattern(/^(ML)[01](0[1-9]|1[0-2])[A-Z]{2}\d{4}$/i)]],
    gender: ['female', Validators.required], birthDate: ['', Validators.required],
    status: ['active', Validators.required], email: [''], phone: [''],
    address: [''], groupId: ['', Validators.required], academicYearId: ['', Validators.required],
  });

  editStudentForm = this.fb.group({
    firstName: ['', Validators.required], lastName: ['', Validators.required],
    gender: ['female', Validators.required], birthDate: ['', Validators.required],
    status: ['active', Validators.required], email: [''], phone: [''],
    address: [''], groupId: ['', Validators.required], academicYearId: ['', Validators.required],
  });

  private loadStudents() {
    return this.students
      .listStudents(this.studentQuery, this.studentPage, this.studentLimit)
      .pipe(tap((r) => (this.studentTotal = r.total ?? 0)));
  }

  searchStudents() { this.studentPage = 1; this.students$ = this.loadStudents(); }

  createStudent() {
    if (this.studentForm.invalid) return;
    this.students.createStudent(this.studentForm.value as any).subscribe(() => {
      this.studentForm.reset({status: 'active', gender: 'female'});
      this.students$ = this.loadStudents();
      this.closeDrawer();
    });
  }

  selectStudentForEdit(s: any) {
    this.editingStudentId = s._id;
    this.editStudentForm.setValue({
      firstName: s.firstName ?? '', lastName: s.lastName ?? '', gender: s.gender ?? 'female',
      birthDate: this.fmtDate(s.birthDate), status: s.status ?? 'active',
      email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '',
      groupId: s.groupId ?? '', academicYearId: s.academicYearId ?? '',
    });
    this.openDrawer('student', 'Modifier l\'étudiant');
  }

  cancelEditStudent() { this.editingStudentId = null; this.editStudentForm.reset({status: 'active', gender: 'female'}); }

  saveStudentEdit() {
    if (!this.editingStudentId || this.editStudentForm.invalid) return;
    this.students.updateStudent(this.editingStudentId, this.editStudentForm.value as any).subscribe(() => {
      this.cancelEditStudent(); this.students$ = this.loadStudents(); this.closeDrawer();
    });
  }

  updateStudentStatus(id: string, status: string) {
    this.students.updateStudent(id, {status} as any).subscribe(() => { this.students$ = this.loadStudents(); });
  }

  deleteStudent(id: string) {
    this.students.deleteStudent(id).subscribe(() => { this.students$ = this.loadStudents(); });
  }

  changeStudentPage(delta: number) {
    const next = this.studentPage + delta;
    if (next < 1) return;
    const max = Math.max(1, Math.ceil(this.studentTotal / this.studentLimit));
    if (next > max) return;
    this.studentPage = next;
    this.students$ = this.loadStudents();
  }

  // === DOCUMENTS ===
  documentStudentId = '';
  documentFile: File | null = null;
  editingDocumentId: string | null = null;
  documents$: Observable<Paginated<StudentDocument>> = of({items: [], total: 0, page: 1, limit: 20, skip: 0});

  documentForm = this.fb.group({ studentId: ['', Validators.required], label: [''] });
  editDocumentForm = this.fb.group({ label: [''] });

  onDocumentFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.documentFile = input.files?.length ? input.files[0] : null;
  }

  loadDocuments() {
    if (!this.documentStudentId) { this.documents$ = of({items: [], total: 0, page: 1, limit: 20, skip: 0}); return; }
    this.documents$ = this.students.listStudentDocuments(this.documentStudentId, 1, 20);
  }

  uploadDocument() {
    if (!this.documentFile || !this.documentStudentId) return;
    const label = this.documentForm.value.label as string;
    this.students.uploadStudentDocument(this.documentStudentId, this.documentFile, label).subscribe(() => {
      this.documentFile = null; this.documentForm.patchValue({label: ''});
      this.loadDocuments(); this.closeDrawer();
    });
  }

  selectDocumentForEdit(doc: StudentDocument) {
    this.editingDocumentId = doc._id;
    this.editDocumentForm.setValue({label: doc.label ?? ''});
    this.openDrawer('document', 'Modifier le document');
  }

  cancelEditDocument() { this.editingDocumentId = null; this.editDocumentForm.reset(); }

  saveDocumentEdit() {
    if (!this.editingDocumentId) return;
    this.students.updateStudentDocument(this.editingDocumentId, this.editDocumentForm.value as any).subscribe(() => {
      this.cancelEditDocument(); this.loadDocuments(); this.closeDrawer();
    });
  }

  deleteDocument(id: string) { this.students.deleteStudentDocument(id).subscribe(() => this.loadDocuments()); }
  documentDownloadUrl(id: string) { return this.students.downloadStudentDocument(id); }

  // === PAYMENTS ===
  plans$ = this.payments.listPlans();
  payments$ = this.payments.listPayments();
  unpaid$ = this.payments.listUnpaid();
  editingPlanId: string | null = null;
  editingPaymentId: string | null = null;

  planForm = this.fb.group({
    studentId: ['', Validators.required], label: ['', Validators.required],
    totalAmount: [0, Validators.required], currency: ['XOF', Validators.required],
    installments: this.fb.array([]),
  });

  paymentForm = this.fb.group({
    studentId: ['', Validators.required], planId: [''],
    amount: [0, Validators.required], currency: ['XOF', Validators.required],
    paidAt: ['', Validators.required], reference: [''],
  });

  get installments() { return this.planForm.get('installments') as FormArray; }

  addInstallment() {
    this.installments.push(this.fb.group({
      amount: [0, Validators.required], dueDate: ['', Validators.required], label: [''],
    }));
  }

  removeInstallment(i: number) { this.installments.removeAt(i); }

  createPlan() {
    if (this.planForm.invalid) return;
    const obs = this.editingPlanId
      ? this.payments.updatePlan(this.editingPlanId, this.planForm.value as any)
      : this.payments.createPlan(this.planForm.value as any);
    obs.subscribe(() => { this.cancelEditPlan(); this.refreshPayments(); this.closeDrawer(); });
  }

  selectPlanForEdit(p: any) {
    this.editingPlanId = p._id;
    this.planForm.patchValue({studentId: p.studentId ?? '', label: p.label ?? '', totalAmount: p.totalAmount ?? 0, currency: p.currency ?? 'XOF'});
    this.installments.clear();
    (p.installments ?? []).forEach((inst: any) =>
      this.installments.push(this.fb.group({amount: [inst.amount ?? 0, Validators.required], dueDate: [this.fmtDate(inst.dueDate), Validators.required], label: [inst.label ?? '']}))
    );
    this.openDrawer('plan', 'Modifier le plan');
  }

  cancelEditPlan() { this.editingPlanId = null; this.planForm.reset({currency: 'XOF', totalAmount: 0}); this.installments.clear(); }
  deletePlan(id: string) { this.payments.deletePlan(id).subscribe(() => this.refreshPayments()); }

  createPayment() {
    if (this.paymentForm.invalid) return;
    const obs = this.editingPaymentId
      ? this.payments.updatePayment(this.editingPaymentId, this.paymentForm.value as any)
      : this.payments.createPayment(this.paymentForm.value as any);
    obs.subscribe(() => { this.cancelEditPayment(); this.refreshPayments(); this.closeDrawer(); });
  }

  selectPaymentForEdit(p: any) {
    this.editingPaymentId = p._id;
    this.paymentForm.setValue({studentId: p.studentId ?? '', planId: p.planId ?? '', amount: p.amount ?? 0, currency: p.currency ?? 'XOF', paidAt: this.fmtDate(p.paidAt), reference: p.reference ?? ''});
    this.openDrawer('payment', 'Modifier le paiement');
  }

  cancelEditPayment() { this.editingPaymentId = null; this.paymentForm.reset({currency: 'XOF', amount: 0}); }
  deletePayment(id: string) { this.payments.deletePayment(id).subscribe(() => this.refreshPayments()); }
  receiptUrl(id: string) { return this.payments.receiptUrl(id); }

  refreshPayments() {
    this.plans$ = this.payments.listPlans();
    this.payments$ = this.payments.listPayments();
    this.unpaid$ = this.payments.listUnpaid();
  }

  // === USERS ===
  users$ = this.usersApi.listAll();
  userCreateError: string | null = null;
  userCreateSuccess = false;

  userForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['teacher', Validators.required],
  });

  cancelEditUser() { this.userForm.reset({role: 'teacher'}); this.userCreateError = null; this.userCreateSuccess = false; }

  createUser() {
    if (this.userForm.invalid) return;
    this.userCreateError = null;
    this.usersApi.createUser(this.userForm.value as any).subscribe({
      next: () => {
        this.userCreateSuccess = true;
        this.userForm.reset({role: 'teacher'});
        this.users$ = this.usersApi.listAll();
        this.closeDrawer();
      },
      error: (err) => {
        this.userCreateError = err?.error?.message ?? 'Erreur lors de la création.';
      },
    });
  }

  roleBadge(role: string): string {
    const map: Record<string, string> = {
      admin: 'Admin', superadmin: 'Super Admin', teacher: 'Enseignant',
      external: 'Vacataire', student: 'Étudiant',
    };
    return map[role] ?? role;
  }

  // === SHARED ===
  refresh() {
    this.refreshAcademic();
    this.students$ = this.loadStudents();
    this.refreshPayments();
    this.loadDocuments();
    this.users$ = this.usersApi.listAll();
  }

  private fmtDate(value: string | Date | undefined): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }
}
