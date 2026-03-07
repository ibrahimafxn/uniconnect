import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  FormArray, FormBuilder, ReactiveFormsModule, Validators, FormsModule,
} from '@angular/forms';
import {Observable, of, tap, take, combineLatest, map} from 'rxjs';
import {AcademicApi} from '../../core/api/academic.api';
import {StudentsApi} from '../../core/api/students.api';
import {Payment, PaymentPlan, PaymentsApi} from '../../core/api/payments.api';
import {UsersApi} from '../../core/api/users.api';
import {Paginated, StudentDocument} from '../../core/api/students.api';
import {ConfirmService, ConfirmOptions} from '../../core/confirm.service';

export type AdminTab = 'structure' | 'students' | 'payments' | 'users' | 'documents';

type PaymentView = Payment & {
  installmentDueDate?: string;
  installmentLabel?: string;
  isEarly?: boolean;
};

type InstallmentStatus = {
  _id?: string;
  amount: number;
  dueDate: string;
  label?: string;
  paid: number;
  remaining: number;
};

type PaymentPlanView = PaymentPlan & {
  installmentStatus?: InstallmentStatus[];
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly academic = inject(AcademicApi);
  private readonly students = inject(StudentsApi);
  private readonly payments = inject(PaymentsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly confirm = inject(ConfirmService);

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
  drawerMode: 'year' | 'semester' | 'program' | 'level' | 'offer' | 'group' | 'student' | 'plan' | 'payment' | 'user' | 'document' | null = null;

  openDrawer(mode: typeof this.drawerMode, title: string) {
    this.drawerMode = mode;
    this.drawerTitle = title;
    this.drawerOpen = true;
    if (mode === 'student' && !this.editingStudentId) {
      this.applyActiveYearDefault(this.studentForm);
    }
    if (mode === 'semester' && !this.editingSemesterId) {
      this.applyActiveYearDefault(this.semesterForm);
    }
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.drawerMode = null;
    this.cancelAll();
  }

  cancelAll() {
    this.cancelEditYear(); this.cancelEditProgram(); this.cancelEditLevel();
    this.cancelEditSemester(); this.cancelEditOffer(); this.cancelEditGroup(); this.cancelEditStudent(); this.cancelEditPlan();
    this.cancelEditPayment(); this.cancelEditDocument(); this.cancelEditUser();
  }

  // === ACADEMIC ===
  years$ = this.academic.listYears();
  semesters$ = this.academic.listSemesters();
  programs$ = this.academic.listPrograms();
  levels$ = this.academic.listLevels();
  offers$ = this.academic.listOffers();
  groups$ = this.academic.listGroups();

  yearForm = this.fb.group({
    name: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isActive: [false],
  });
  editingYearId: string | null = null;

  semesterForm = this.fb.group({
    name: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    academicYearId: ['', Validators.required],
  });
  editingSemesterId: string | null = null;

  programForm = this.fb.group({ name: ['', Validators.required], code: [''] });
  editingProgramId: string | null = null;

  levelForm = this.fb.group({
    name: ['', Validators.required],
  });
  editingLevelId: string | null = null;

  offerForm = this.fb.group({
    programId: ['', Validators.required],
    levelId: ['', Validators.required],
    academicYearId: ['', Validators.required],
    capacity: [0, Validators.required],
  });
  editingOfferId: string | null = null;

  groupForm = this.fb.group({
    name: ['', Validators.required],
    offerId: ['', Validators.required],
  });
  editingGroupId: string | null = null;

  createYear() {
    if (this.yearForm.invalid) return;
    const obs = this.editingYearId
      ? this.academic.updateYear(this.editingYearId, this.yearForm.value as any)
      : this.academic.createYear(this.yearForm.value as any);
    if (this.editingYearId) {
      this.confirmAndRun(
        { title: 'Modifier année', message: "Confirmer la modification de l'année académique ?" },
        () => obs.subscribe(() => { this.cancelEditYear(); this.refreshAcademic(); this.closeDrawer(); }),
      );
      return;
    }
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
  deleteYear(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer année', message: "Confirmer la suppression de l'année académique ?", danger: true, confirmLabel: 'Supprimer' },
      () => this.academic.deleteYear(id).subscribe(() => this.refreshAcademic()),
    );
  }

  createSemester() {
    if (this.semesterForm.invalid) return;
    const obs = this.editingSemesterId
      ? this.academic.updateSemester(this.editingSemesterId, this.semesterForm.value as any)
      : this.academic.createSemester(this.semesterForm.value as any);
    if (this.editingSemesterId) {
      this.confirmAndRun(
        { title: 'Modifier semestre', message: 'Confirmer la modification du semestre ?' },
        () => obs.subscribe(() => { this.cancelEditSemester(); this.refreshAcademic(); this.closeDrawer(); }),
      );
      return;
    }
    obs.subscribe(() => { this.cancelEditSemester(); this.refreshAcademic(); this.closeDrawer(); });
  }

  selectSemesterForEdit(s: any) {
    this.editingSemesterId = s._id;
    this.semesterForm.setValue({
      name: s.name ?? '',
      startDate: this.fmtDate(s.startDate),
      endDate: this.fmtDate(s.endDate),
      academicYearId: s.academicYearId ?? '',
    });
    this.openDrawer('semester', 'Modifier le semestre');
  }

  cancelEditSemester() { this.editingSemesterId = null; this.semesterForm.reset(); }

  deleteSemester(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer semestre', message: 'Confirmer la suppression du semestre ?', danger: true, confirmLabel: 'Supprimer' },
      () => this.academic.deleteSemester(id).subscribe(() => this.refreshAcademic()),
    );
  }

  createProgram() {
    if (this.programForm.invalid) return;
    const obs = this.editingProgramId
      ? this.academic.updateProgram(this.editingProgramId, this.programForm.value as any)
      : this.academic.createProgram(this.programForm.value as any);
    if (this.editingProgramId) {
      this.confirmAndRun(
        { title: 'Modifier filière', message: 'Confirmer la modification de la filière ?' },
        () => obs.subscribe(() => { this.cancelEditProgram(); this.refreshAcademic(); this.closeDrawer(); }),
      );
      return;
    }
    obs.subscribe(() => { this.cancelEditProgram(); this.refreshAcademic(); this.closeDrawer(); });
  }

  selectProgramForEdit(p: any) {
    this.editingProgramId = p._id;
    this.programForm.setValue({name: p.name ?? '', code: p.code ?? ''});
    this.openDrawer('program', 'Modifier la filière');
  }

  cancelEditProgram() { this.editingProgramId = null; this.programForm.reset(); }
  deleteProgram(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer filière', message: 'Confirmer la suppression de la filière ?', danger: true, confirmLabel: 'Supprimer' },
      () => this.academic.deleteProgram(id).subscribe(() => this.refreshAcademic()),
    );
  }

  createLevel() {
    if (this.levelForm.invalid) return;
    const obs = this.editingLevelId
      ? this.academic.updateLevel(this.editingLevelId, this.levelForm.value as any)
      : this.academic.createLevel(this.levelForm.value as any);
    if (this.editingLevelId) {
      this.confirmAndRun(
        { title: 'Modifier niveau', message: 'Confirmer la modification du niveau ?' },
        () => obs.subscribe(() => { this.cancelEditLevel(); this.refreshAcademic(); this.closeDrawer(); }),
      );
      return;
    }
    obs.subscribe(() => { this.cancelEditLevel(); this.refreshAcademic(); this.closeDrawer(); });
  }

  selectLevelForEdit(l: any) {
    this.editingLevelId = l._id;
    this.levelForm.setValue({name: l.name ?? ''});
    this.openDrawer('level', 'Modifier le niveau');
  }

  cancelEditLevel() { this.editingLevelId = null; this.levelForm.reset(); }
  deleteLevel(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer niveau', message: 'Confirmer la suppression du niveau ?', danger: true, confirmLabel: 'Supprimer' },
      () => this.academic.deleteLevel(id).subscribe(() => this.refreshAcademic()),
    );
  }

  createOffer() {
    if (this.offerForm.invalid) return;
    const obs = this.editingOfferId
      ? this.academic.updateOffer(this.editingOfferId, this.offerForm.value as any)
      : this.academic.createOffer(this.offerForm.value as any);
    if (this.editingOfferId) {
      this.confirmAndRun(
        { title: 'Modifier offre', message: "Confirmer la modification de l'offre ?" },
        () => obs.subscribe(() => { this.cancelEditOffer(); this.refreshAcademic(); this.closeDrawer(); }),
      );
      return;
    }
    obs.subscribe(() => { this.cancelEditOffer(); this.refreshAcademic(); this.closeDrawer(); });
  }

  selectOfferForEdit(o: any) {
    this.editingOfferId = o._id;
    this.offerForm.setValue({
      programId: o.programId ?? '',
      levelId: o.levelId ?? '',
      academicYearId: o.academicYearId ?? '',
      capacity: o.capacity ?? 0,
    });
    this.openDrawer('offer', "Modifier l'offre");
  }

  cancelEditOffer() { this.editingOfferId = null; this.offerForm.reset({capacity: 0}); }

  deleteOffer(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer offre', message: "Confirmer la suppression de l'offre ?", danger: true, confirmLabel: 'Supprimer' },
      () => this.academic.deleteOffer(id).subscribe(() => this.refreshAcademic()),
    );
  }

  createGroup() {
    if (this.groupForm.invalid) return;
    const obs = this.editingGroupId
      ? this.academic.updateGroup(this.editingGroupId, this.groupForm.value as any)
      : this.academic.createGroup(this.groupForm.value as any);
    if (this.editingGroupId) {
      this.confirmAndRun(
        { title: 'Modifier groupe', message: 'Confirmer la modification du groupe ?' },
        () => obs.subscribe(() => { this.cancelEditGroup(); this.refreshAcademic(); this.closeDrawer(); }),
      );
      return;
    }
    obs.subscribe(() => { this.cancelEditGroup(); this.refreshAcademic(); this.closeDrawer(); });
  }

  selectGroupForEdit(g: any) {
    this.editingGroupId = g._id;
    this.groupForm.setValue({
      name: g.name ?? '',
      offerId: g.offerId ?? '',
    });
    this.openDrawer('group', 'Modifier le groupe');
  }

  cancelEditGroup() { this.editingGroupId = null; this.groupForm.reset(); }
  deleteGroup(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer groupe', message: 'Confirmer la suppression du groupe ?', danger: true, confirmLabel: 'Supprimer' },
      () => this.academic.deleteGroup(id).subscribe(() => this.refreshAcademic()),
    );
  }

  refreshAcademic() {
    this.years$ = this.academic.listYears();
    this.semesters$ = this.academic.listSemesters();
    this.programs$ = this.academic.listPrograms();
    this.levels$ = this.academic.listLevels();
    this.offers$ = this.academic.listOffers();
    this.groups$ = this.academic.listGroups();
  }

  levelName(levels: any[] | null, id: string): string {
    return levels?.find((l) => l._id === id)?.name ?? id;
  }

  programName(programs: any[] | null, id: string): string {
    return programs?.find((p) => p._id === id)?.name ?? id;
  }

  yearName(years: any[] | null, id: string): string {
    return years?.find((y) => y._id === id)?.name ?? id;
  }

  groupLabel(groups: any[] | null, levels: any[] | null, id: string): string {
    const group = groups?.find((g) => g._id === id);
    if (!group) return id;
    const level = this.levelName(levels, group.levelId);
    return level ? `${group.name} — ${level}` : group.name;
  }

  groupProgramName(groups: any[] | null, programs: any[] | null, id: string): string {
    const group = groups?.find((g) => g._id === id);
    if (!group) return id;
    return this.programName(programs, group.programId);
  }

  offerLabel(
    offers: any[] | null,
    programs: any[] | null,
    levels: any[] | null,
    years: any[] | null,
    id: string,
  ): string {
    const offer = offers?.find((o) => o._id === id);
    if (!offer) return id;
    const program = this.programName(programs, offer.programId);
    const level = this.levelName(levels, offer.levelId);
    const year = years?.find((y) => y._id === offer.academicYearId)?.name ?? '';
    return [level, program, year].filter(Boolean).join(' — ');
  }

  filterGroups(groups: any[] | null, offerId?: string) {
    if (!groups) return [];
    if (!offerId) return groups;
    return groups.filter((g) => g.offerId === offerId);
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
    gender: ['female', Validators.required], birthDate: ['', Validators.required],
    status: ['active', Validators.required], email: [''], phone: [''],
    address: [''], offerId: ['', Validators.required], programId: [''], groupId: ['', Validators.required],
    academicYearId: ['', Validators.required],
  });

  editStudentForm = this.fb.group({
    firstName: ['', Validators.required], lastName: ['', Validators.required],
    gender: ['female', Validators.required], birthDate: ['', Validators.required],
    status: ['active', Validators.required], email: [''], phone: [''],
    address: [''], offerId: ['', Validators.required], programId: [''], groupId: ['', Validators.required],
    academicYearId: ['', Validators.required],
  });

  private loadStudents() {
    return this.students
      .listStudents(this.studentQuery, this.studentPage, this.studentLimit)
      .pipe(tap((r) => (this.studentTotal = r.total ?? 0)));
  }

  private applyActiveYearDefault(form: any) {
    const control = form.get('academicYearId');
    if (!control || control.value) return;
    this.years$.pipe(take(1)).subscribe((res) => {
      const active = res?.items?.find((y) => y.isActive);
      if (active && !control.value) {
        control.setValue(active._id);
      }
    });
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
      offerId: s.offerId ?? '', programId: s.programId ?? '', groupId: s.groupId ?? '', academicYearId: s.academicYearId ?? '',
    });
    if (!s.offerId) this.setStudentOfferFromGroup(s.groupId ?? '', 'edit');
    if (s.offerId) this.onStudentOfferChange(s.offerId, 'edit');
    this.applyActiveYearDefault(this.editStudentForm);
    this.openDrawer('student', 'Modifier l\'étudiant');
  }

  cancelEditStudent() {
    this.editingStudentId = null;
    this.editStudentForm.reset({status: 'active', gender: 'female'});
  }

  saveStudentEdit() {
    if (!this.editingStudentId || this.editStudentForm.invalid) return;
    this.confirmAndRun(
      { title: 'Modifier étudiant', message: "Confirmer la modification de l'étudiant ?" },
      () => this.students.updateStudent(this.editingStudentId as string, this.editStudentForm.value as any).subscribe(() => {
        this.cancelEditStudent(); this.students$ = this.loadStudents(); this.closeDrawer();
      }),
    );
  }

  onStudentOfferChange(offerId: string, mode: 'create' | 'edit') {
    const form = (mode === 'edit' ? this.editStudentForm : this.studentForm) as any;
    if (offerId) {
      this.offers$.pipe(take(1)).subscribe((res) => {
        const offer = res?.items?.find((o) => o._id === offerId);
        if (offer) {
          form.get('programId')?.setValue(offer.programId);
          form.get('academicYearId')?.setValue(offer.academicYearId);
        }
      });
    }
    const groupId = form.get('groupId')?.value;
    if (!groupId) return;
    this.groups$.pipe(take(1)).subscribe((res) => {
      const group = res?.items?.find((g) => g._id === groupId);
      if (!group || (offerId && group.offerId !== offerId)) {
        form.get('groupId')?.setValue('');
      }
    });
  }

  private setStudentOfferFromGroup(groupId: string, mode: 'create' | 'edit') {
    if (!groupId) return;
    this.groups$.pipe(take(1)).subscribe((res) => {
      const group = res?.items?.find((g) => g._id === groupId);
      const offerId = group?.offerId ?? '';
      const form = (mode === 'edit' ? this.editStudentForm : this.studentForm) as any;
      if (offerId && !form.get('offerId')?.value) {
        form.get('offerId')?.setValue(offerId);
        this.onStudentOfferChange(offerId, mode);
      }
    });
  }

  updateStudentStatus(id: string, status: string) {
    this.confirm
      .open({ title: 'Modifier statut', message: "Confirmer la modification du statut de l'étudiant ?" })
      .pipe(take(1))
      .subscribe((ok) => {
        if (!ok) { this.students$ = this.loadStudents(); return; }
        this.students.updateStudent(id, {status} as any).subscribe(() => { this.students$ = this.loadStudents(); });
      });
  }

  deleteStudent(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer étudiant', message: "Confirmer la suppression de l'étudiant ?", danger: true, confirmLabel: 'Supprimer' },
      () => this.students.deleteStudent(id).subscribe(() => { this.students$ = this.loadStudents(); }),
    );
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
    this.confirmAndRun(
      { title: 'Modifier document', message: 'Confirmer la modification du document ?' },
      () => this.students.updateStudentDocument(this.editingDocumentId as string, this.editDocumentForm.value as any).subscribe(() => {
        this.cancelEditDocument(); this.loadDocuments(); this.closeDrawer();
      }),
    );
  }

  deleteDocument(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer document', message: 'Confirmer la suppression du document ?', danger: true, confirmLabel: 'Supprimer' },
      () => this.students.deleteStudentDocument(id).subscribe(() => this.loadDocuments()),
    );
  }
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
    installmentId: [''],
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
    if (this.editingPlanId) {
      this.confirmAndRun(
        { title: 'Modifier plan', message: 'Confirmer la modification du plan de paiement ?' },
        () => obs.subscribe(() => { this.cancelEditPlan(); this.refreshPayments(); this.closeDrawer(); }),
      );
      return;
    }
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
  deletePlan(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer plan', message: 'Confirmer la suppression du plan de paiement ?', danger: true, confirmLabel: 'Supprimer' },
      () => this.payments.deletePlan(id).subscribe(() => this.refreshPayments()),
    );
  }

  ngOnInit() {
    this.paymentForm.get('planId')?.valueChanges.subscribe((planId) => {
      const installmentCtrl = this.paymentForm.get('installmentId');
      if (!installmentCtrl) return;
      if (planId) {
        installmentCtrl.setValidators([Validators.required]);
      } else {
        installmentCtrl.clearValidators();
        installmentCtrl.setValue('');
      }
      installmentCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  createPayment() {
    if (this.paymentForm.invalid) return;
    const obs = this.editingPaymentId
      ? this.payments.updatePayment(this.editingPaymentId, this.paymentForm.value as any)
      : this.payments.createPayment(this.paymentForm.value as any);
    if (this.editingPaymentId) {
      this.confirmAndRun(
        { title: 'Modifier paiement', message: 'Confirmer la modification du paiement ?' },
        () => obs.subscribe(() => { this.cancelEditPayment(); this.refreshPayments(); this.closeDrawer(); }),
      );
      return;
    }
    obs.subscribe(() => { this.cancelEditPayment(); this.refreshPayments(); this.closeDrawer(); });
  }

  selectPaymentForEdit(p: any) {
    this.editingPaymentId = p._id;
    this.paymentForm.setValue({studentId: p.studentId ?? '', planId: p.planId ?? '', installmentId: p.installmentId ?? '', amount: p.amount ?? 0, currency: p.currency ?? 'XOF', paidAt: this.fmtDate(p.paidAt), reference: p.reference ?? ''});
    this.openDrawer('payment', 'Modifier le paiement');
  }

  cancelEditPayment() { this.editingPaymentId = null; this.paymentForm.reset({currency: 'XOF', amount: 0}); }
  deletePayment(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer paiement', message: 'Confirmer la suppression du paiement ?', danger: true, confirmLabel: 'Supprimer' },
      () => this.payments.deletePayment(id).subscribe(() => this.refreshPayments()),
    );
  }
  receiptUrl(id: string) { return this.payments.receiptUrl(id); }

  refreshPayments() {
    this.plans$ = this.payments.listPlans();
    this.payments$ = this.payments.listPayments();
    this.unpaid$ = this.payments.listUnpaid();
    this.plansView$ = this.buildPlansView(this.plans$, this.payments$);
    this.paymentsView$ = this.buildPaymentsView(this.plans$, this.payments$);
    // Refresh KPIs with new payment data
    this.kpis$ = combineLatest([this.plans$, this.payments$]).pipe(
      map(([plans, payments]) => {
        // Calculate total paid for each plan/installment
        const paidByPlanInst = new Map<string, Map<string, number>>();
        payments.forEach((payment) => {
          if (!payment.planId || !payment.installmentId) return;
          if (!paidByPlanInst.has(payment.planId)) {
            paidByPlanInst.set(payment.planId, new Map());
          }
          const byInst = paidByPlanInst.get(payment.planId)!;
          byInst.set(
            payment.installmentId,
            (byInst.get(payment.installmentId) ?? 0) + (payment.amount ?? 0),
          );
        });

        // Calculate totals from plans
        let totalDue = 0;
        plans.forEach((plan) => {
          const byInst = paidByPlanInst.get(plan._id) ?? new Map();
          (plan.installments ?? []).forEach((inst) => {
            const paid = byInst.get(inst._id ?? '') ?? 0;
            const remaining = Math.max(0, (inst.amount ?? 0) - paid);
            totalDue += remaining;
          });
        });

        const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const grandTotal = totalCollected + totalDue;
        const paymentRate = grandTotal > 0 ? (totalCollected / grandTotal) * 100 : 0;
        
        return {
          totalCollected,
          totalDue,
          paymentRate: Math.round(paymentRate * 10) / 10,
        };
      }),
    );
  }

  // === USERS ===
  users$ = this.usersApi.listAll();
  userCreateError: string | null = null;
  userCreateSuccess = false;
  editingUserId: string | null = null;

  userForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['teacher', Validators.required],
  });

  openCreateUser() {
    this.editingUserId = null;
    this.setUserFormMode('create');
    this.userForm.reset({role: 'teacher'});
    this.userCreateError = null;
    this.userCreateSuccess = false;
    this.openDrawer('user', 'Créer un utilisateur');
  }

  selectUserForEdit(u: any) {
    this.editingUserId = u.id;
    this.setUserFormMode('edit');
    this.userForm.setValue({email: u.email ?? '', password: '', role: u.role ?? 'teacher'});
    this.userCreateError = null;
    this.userCreateSuccess = false;
    this.openDrawer('user', 'Modifier l\'utilisateur');
  }

  cancelEditUser() {
    this.editingUserId = null;
    this.setUserFormMode('create');
    this.userForm.reset({role: 'teacher'});
    this.userCreateError = null;
    this.userCreateSuccess = false;
  }

  createUser() {
    if (this.userForm.invalid) return;
    this.userCreateError = null;
    const raw = this.userForm.value as any;
    if (this.editingUserId) {
      const payload: any = { email: raw.email, role: raw.role };
      if (raw.password) payload.password = raw.password;
      this.confirmAndRun(
        { title: 'Modifier utilisateur', message: "Confirmer la modification de cet utilisateur ?" },
        () => this.usersApi.updateUser(this.editingUserId as string, payload).subscribe({
          next: () => {
            this.userCreateSuccess = true;
            this.cancelEditUser();
            this.users$ = this.usersApi.listAll();
            this.closeDrawer();
          },
          error: (err) => {
            this.userCreateError = err?.error?.message ?? 'Erreur lors de la mise à jour.';
          },
        }),
      );
      return;
    }

    this.usersApi.createUser(raw).subscribe({
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

  deleteUser(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer utilisateur', message: "Confirmer la suppression de cet utilisateur ?", danger: true, confirmLabel: 'Supprimer' },
      () => this.usersApi.deleteUser(id).subscribe(() => {
        this.users$ = this.usersApi.listAll();
      }),
    );
  }

  private confirmAndRun(options: ConfirmOptions, action: () => void) {
    this.confirm.open(options).pipe(take(1)).subscribe((ok) => {
      if (ok) action();
    });
  }

  private setUserFormMode(mode: 'create' | 'edit') {
    const ctrl = this.userForm.get('password');
    if (!ctrl) return;
    if (mode === 'create') {
      ctrl.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      ctrl.setValidators([Validators.minLength(6)]);
    }
    ctrl.updateValueAndValidity();
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

  plansView$ = this.buildPlansView(this.plans$, this.payments$);
  paymentsView$ = this.buildPaymentsView(this.plans$, this.payments$);

  // KPI Observables - Synchronized with real data
  kpis$ = combineLatest([this.plans$, this.payments$]).pipe(
    map(([plans, payments]) => {
      // Calculate total paid for each plan/installment
      const paidByPlanInst = new Map<string, Map<string, number>>();
      payments.forEach((payment) => {
        if (!payment.planId || !payment.installmentId) return;
        if (!paidByPlanInst.has(payment.planId)) {
          paidByPlanInst.set(payment.planId, new Map());
        }
        const byInst = paidByPlanInst.get(payment.planId)!;
        byInst.set(
          payment.installmentId,
          (byInst.get(payment.installmentId) ?? 0) + (payment.amount ?? 0),
        );
      });

      // Calculate totals from plans
      let totalDue = 0;
      plans.forEach((plan) => {
        const byInst = paidByPlanInst.get(plan._id) ?? new Map();
        (plan.installments ?? []).forEach((inst) => {
          const paid = byInst.get(inst._id ?? '') ?? 0;
          const remaining = Math.max(0, (inst.amount ?? 0) - paid);
          totalDue += remaining;
        });
      });

      const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const grandTotal = totalCollected + totalDue;
      const paymentRate = grandTotal > 0 ? (totalCollected / grandTotal) * 100 : 0;
      
      return {
        totalCollected,
        totalDue,
        paymentRate: Math.round(paymentRate * 10) / 10,
      };
    }),
  );

  getPlanInstallments(plans: PaymentPlan[] | null | undefined, planId: string | null | undefined) {
    if (!plans || !planId) return [];
    return plans.find((p) => p._id === planId)?.installments ?? [];
  }

  private buildPaymentsView(
    plans$: Observable<PaymentPlan[]>,
    payments$: Observable<Payment[]>,
  ): Observable<PaymentView[]> {
    return combineLatest([plans$, payments$]).pipe(
      map(([plans, payments]) => {
        const planById = new Map(plans.map((p) => [p._id, p]));
        return payments.map((payment) => {
          if (!payment.planId || !payment.installmentId) return payment;
          const plan = planById.get(payment.planId);
          const installment = plan?.installments?.find(
            (inst) => inst._id === payment.installmentId,
          );
          if (!installment) return payment;
          const paidAt = new Date(payment.paidAt);
          const dueDate = new Date(installment.dueDate);
          return {
            ...payment,
            installmentDueDate: installment.dueDate,
            installmentLabel: installment.label,
            isEarly: paidAt.getTime() < dueDate.getTime(),
          };
        });
      }),
    );
  }

  private buildPlansView(
    plans$: Observable<PaymentPlan[]>,
    payments$: Observable<Payment[]>,
  ): Observable<PaymentPlanView[]> {
    return combineLatest([plans$, payments$]).pipe(
      map(([plans, payments]) => {
        const paidByPlanInst = new Map<string, Map<string, number>>();
        payments.forEach((payment) => {
          if (!payment.planId || !payment.installmentId) return;
          if (!paidByPlanInst.has(payment.planId)) {
            paidByPlanInst.set(payment.planId, new Map());
          }
          const byInst = paidByPlanInst.get(payment.planId)!;
          byInst.set(
            payment.installmentId,
            (byInst.get(payment.installmentId) ?? 0) + (payment.amount ?? 0),
          );
        });

        return plans.map((plan) => {
          const byInst = paidByPlanInst.get(plan._id) ?? new Map();
          const installmentStatus = (plan.installments ?? []).map((inst) => {
            const paid = byInst.get(inst._id ?? '') ?? 0;
            const remaining = Math.max(0, (inst.amount ?? 0) - paid);
            return {
              _id: inst._id,
              amount: inst.amount,
              dueDate: inst.dueDate,
              label: inst.label,
              paid,
              remaining,
            };
          });
          return { ...plan, installmentStatus };
        });
      }),
    );
  }
}
