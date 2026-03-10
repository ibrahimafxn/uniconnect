import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  FormArray, FormBuilder, ReactiveFormsModule, Validators, FormsModule,
} from '@angular/forms';
import {Observable, of, tap, take, combineLatest, map, distinctUntilChanged, switchMap, startWith} from 'rxjs';
import {AcademicApi} from '../../core/api/academic.api';
import {StudentsApi} from '../../core/api/students.api';
import {Payment, PaymentPlan, PaymentsApi} from '../../core/api/payments.api';
import {UnlinkedProfile, UsersApi} from '../../core/api/users.api';
import {Paginated, StudentDocument} from '../../core/api/students.api';
import {AdminApi, AdminUser, ExecutiveDashboard, FinancialReport, SystemParams} from '../../core/api/admin.api';
import {ConfirmService, ConfirmOptions} from '../../core/confirm.service';
import {AnnouncementsApi, Announcement} from '../../core/api/announcements.api';

export type AdminTab = 'dashboard' | 'structure' | 'students' | 'teachers' | 'payments' | 'documents' | 'users' | 'announcements' | 'config';

type PaymentView = Payment & {
  installmentDueDate?: string;
  installmentLabel?: string;
  isEarly?: boolean;
  studentName?: string;
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
  studentName?: string;
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
  private readonly adminApi = inject(AdminApi);
  private readonly confirm = inject(ConfirmService);
  private readonly announcementsApi = inject(AnnouncementsApi);

  compactMode = this.loadCompactMode();
  ultraCompactMode = this.loadUltraCompactMode();

  // === TABS ===
  activeTab: AdminTab = 'dashboard';
  tabs: Array<{id: AdminTab; label: string; icon: string}> = [
    {id: 'dashboard', label: 'Tableau de bord', icon: '📊'},
    {id: 'structure', label: 'Structure', icon: '🏛️'},
    {id: 'students', label: 'Étudiants', icon: '🎓'},
    {id: 'teachers', label: 'Enseignants', icon: '👨‍🏫'},
    {id: 'payments', label: 'Paiements', icon: '💰'},
    {id: 'documents', label: 'Documents', icon: '📄'},
    {id: 'users', label: 'Comptes', icon: '👤'},
    {id: 'announcements', label: 'Annonces', icon: '📢'},
    {id: 'config', label: 'Configuration', icon: '⚙️'},
  ];

  // === DRAWER ===
  drawerOpen = false;
  drawerTitle = '';
  drawerMode: 'year' | 'semester' | 'program' | 'level' | 'offer' | 'group' | 'student' | 'plan' | 'payment' | 'user' | 'document' | 'teacher' | 'teacher-edit' | 'announcement' | null = null;

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

  saveCompactMode() {
    if (!this.compactMode) {
      this.ultraCompactMode = false;
      this.saveUltraCompactMode(false);
    }
    try {
      localStorage.setItem('ui.compactMode', String(!!this.compactMode));
    } catch {
      // ignore storage errors
    }
  }

  saveUltraCompactMode(forceValue?: boolean) {
    if (typeof forceValue === 'boolean') {
      this.ultraCompactMode = forceValue;
    }
    if (this.ultraCompactMode) {
      this.compactMode = true;
      try {
        localStorage.setItem('ui.compactMode', 'true');
      } catch {
        // ignore storage errors
      }
    }
    try {
      localStorage.setItem('ui.ultraCompactMode', String(!!this.ultraCompactMode));
    } catch {
      // ignore storage errors
    }
  }

  cancelAll() {
    this.cancelEditYear(); this.cancelEditProgram(); this.cancelEditLevel();
    this.cancelEditSemester(); this.cancelEditOffer(); this.cancelEditGroup(); this.cancelEditStudent(); this.cancelEditPlan();
    this.cancelEditPayment(); this.cancelEditDocument(); this.cancelEditUser();
    this.cancelEditAnnouncement(); this.cancelEditTeacher();
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
  allStudents$ = this.students.listStudents('', 1, 9999).pipe(map((r) => r.items));
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
    paymentMethod: ['espece', Validators.required],
  });

  // === Auto-display payment plan when student is selected ===
  studentPlans$ = this.paymentForm.get('studentId')!.valueChanges.pipe(
    startWith(this.paymentForm.get('studentId')!.value),
    distinctUntilChanged(),
    switchMap(studentId => {
      if (!studentId) return of(null);
      return this.plans$.pipe(
        map(plans => plans.filter(p => p.studentId === studentId))
      );
    })
  );

  // Auto-select plan if exactly one exists, and prepare installments display
  selectedPlan$ = this.studentPlans$.pipe(
    tap(plans => {
      if (plans && plans.length === 1) {
        this.paymentForm.patchValue({ planId: plans[0]._id }, { emitEvent: false });
      }
    }),
    map(plans => plans && plans.length > 0 ? plans[0] : null)
  );

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
        () => obs.subscribe(
          () => {
            this.cancelEditPlan();
            this.refreshPayments();
            this.closeDrawer();
            alert('✅ Plan modifié avec succès');
          },
          (err) => alert('❌ Erreur: ' + (err?.error?.message || 'Modification échouée'))
        ),
      );
      return;
    }
    obs.subscribe(
      () => {
        this.cancelEditPlan();
        this.refreshPayments();
        this.closeDrawer();
        alert('✅ Plan créé avec succès');
      },
      (err) => alert('❌ Erreur: ' + (err?.error?.message || 'Création échouée'))
    );
  }

  createPlanFromPayment() {
    const studentId = this.paymentForm.get('studentId')?.value;
    if (!studentId) {
      alert('⚠️ Veuillez d\'abord sélectionner un étudiant');
      return;
    }
    this.cancelEditPlan();
    this.planForm.patchValue({ studentId }, { emitEvent: false });
    this.openDrawer('plan', 'Créer un plan de paiement');
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
      () => this.payments.deletePlan(id).subscribe(
        () => {
          this.refreshPayments();
          alert('✅ Plan supprimé avec succès');
        },
        (err) => alert('❌ Erreur: ' + (err?.error?.message || 'Suppression échouée'))
      ),
    );
  }

  ngOnInit() {
    this.loadDashboard();
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
    this.paymentForm.setValue({studentId: p.studentId ?? '', planId: p.planId ?? '', installmentId: p.installmentId ?? '', amount: p.amount ?? 0, currency: p.currency ?? 'XOF', paidAt: this.fmtDate(p.paidAt), reference: p.reference ?? '', paymentMethod: p.paymentMethod ?? 'espece'});
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

  downloadPlanPdf(planId: string, planLabel: string) {
    const url = this.payments.exportPlanPdfUrl(planId);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan-${planLabel?.replace(/\s+/g, '_')}-${new Date().getTime()}.pdf`;
    link.click();
  }

  refreshPayments() {
    this.plans$ = this.payments.listPlans();
    this.payments$ = this.payments.listPayments();
    this.unpaid$ = this.payments.listUnpaid();
    this.plansView$ = this.buildPlansView(this.plans$, this.payments$, this.allStudents$);
    this.paymentsView$ = this.buildPaymentsView(this.plans$, this.payments$, this.allStudents$);
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

  // === TEACHERS ===
  teachers$: Observable<AdminUser[]> = this.loadTeachers();
  teacherCreateResult: {email: string; tempPassword: string} | null = null;

  teacherForm = this.fb.group({
    firstName:  ['', Validators.required],
    lastName:   ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    phone:      [''],
    specialty:  [''],
    grade:      ['autre'],
    bio:        [''],
    office:     [''],
  });

  private loadTeachers(): Observable<AdminUser[]> {
    return this.adminApi.listUsers({role: 'teacher', limit: 200}).pipe(map(r => r.items));
  }

  createTeacher() {
    if (this.teacherForm.invalid) return;
    const v = this.teacherForm.value as any;
    const body: any = {firstName: v.firstName, lastName: v.lastName, email: v.email};
    if (v.phone)     body.phone     = v.phone;
    if (v.specialty) body.specialty = v.specialty;
    if (v.grade)     body.grade     = v.grade;
    if (v.bio)       body.bio       = v.bio;
    if (v.office)    body.office    = v.office;
    this.adminApi.createTeacher(body).subscribe({
      next: (res) => {
        this.teacherCreateResult = {email: res.email, tempPassword: res.tempPassword};
        this.teacherForm.reset({grade: 'autre'});
        this.teachers$ = this.loadTeachers();
      },
      error: (err) => alert('❌ Erreur: ' + (err?.error?.message ?? 'Création échouée')),
    });
  }

  deleteTeacher(id: string) {
    this.confirmAndRun(
      {title: 'Supprimer enseignant', message: "Confirmer la suppression de cet enseignant ?", danger: true, confirmLabel: 'Supprimer'},
      () => this.usersApi.deleteUser(id).subscribe(() => { this.teachers$ = this.loadTeachers(); }),
    );
  }

  openCreateTeacher() {
    this.teacherCreateResult = null;
    this.teacherForm.reset();
    this.openDrawer('teacher', 'Ajouter un enseignant');
  }

  editingTeacherId: string | null = null;
  teacherEditForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    phone:     [''],
    specialty: [''],
    grade:     ['autre'],
    bio:       [''],
    office:    [''],
  });
  teacherEditError: string | null = null;

  selectTeacherForEdit(t: AdminUser) {
    this.editingTeacherId = t._id;
    this.teacherEditError = null;
    this.teacherEditForm.setValue({
      firstName: t.firstName ?? '',
      lastName:  t.lastName ?? '',
      email:     t.email ?? '',
      phone:     '',
      specialty: '',
      grade:     'autre',
      bio:       '',
      office:    '',
    });
    this.openDrawer('teacher-edit', 'Modifier l\'enseignant');
  }

  saveTeacherEdit() {
    if (!this.editingTeacherId || this.teacherEditForm.invalid) return;
    this.teacherEditError = null;
    const v = this.teacherEditForm.value as any;
    this.confirmAndRun(
      {title: 'Modifier enseignant', message: 'Confirmer la modification de cet enseignant ?'},
      () => this.usersApi.updateUser(this.editingTeacherId as string, {email: v.email}).subscribe({
        next: () => {
          this.editingTeacherId = null;
          this.teachers$ = this.loadTeachers();
          this.closeDrawer();
        },
        error: (err) => { this.teacherEditError = err?.error?.message ?? 'Erreur lors de la modification.'; },
      }),
    );
  }

  cancelEditTeacher() {
    this.editingTeacherId = null;
    this.teacherEditForm.reset({grade: 'autre'});
    this.teacherEditError = null;
  }

  // === DASHBOARD ===
  dashboard$: Observable<ExecutiveDashboard | null> = of(null);
  financialReport$: Observable<FinancialReport | null> = of(null);
  auditLogs: any[] = [];
  auditLogsTotal = 0;
  auditLogPage = 1;
  auditLogActionFilter = '';
  auditLogEntityFilter = '';

  loadDashboard() {
    this.dashboard$ = this.adminApi.getExecutiveDashboard();
    this.financialReport$ = this.adminApi.getFinancialReport();
    this.loadAuditLogs();
  }

  loadAuditLogs() {
    const skip = (this.auditLogPage - 1) * 20;
    this.adminApi.listAuditLogs({
      skip,
      limit: 20,
      action: this.auditLogActionFilter || undefined,
      entity: this.auditLogEntityFilter || undefined,
    }).subscribe(r => {
      this.auditLogs = r.items;
      this.auditLogsTotal = r.total;
    });
  }

  changeAuditLogPage(delta: number) {
    const next = this.auditLogPage + delta;
    if (next < 1) return;
    const max = Math.max(1, Math.ceil(this.auditLogsTotal / 20));
    if (next > max) return;
    this.auditLogPage = next;
    this.loadAuditLogs();
  }

  onTabChange(tab: AdminTab) {
    this.activeTab = tab;
    if (tab === 'dashboard') this.loadDashboard();
    if (tab === 'config') this.loadConfig();
    if (tab === 'announcements') this.loadAnnouncements();
  }

  // === ANNOUNCEMENTS ===
  announcements$: Observable<Announcement[]> = this.announcementsApi.list();
  editingAnnouncementId: string | null = null;
  announcementSaveError: string | null = null;

  announcementForm = this.fb.group({
    title:    ['', Validators.required],
    body:     ['', Validators.required],
    scope:    ['global'],
    category: ['general'],
  });

  loadAnnouncements() {
    this.announcements$ = this.announcementsApi.list();
  }

  openCreateAnnouncement() {
    this.editingAnnouncementId = null;
    this.announcementSaveError = null;
    this.announcementForm.reset({scope: 'global', category: 'general'});
    this.openDrawer('announcement', 'Nouvelle annonce');
  }

  selectAnnouncementForEdit(a: Announcement) {
    this.editingAnnouncementId = a._id;
    this.announcementSaveError = null;
    this.announcementForm.setValue({
      title:    a.title,
      body:     a.body,
      scope:    a.scope ?? 'global',
      category: a.category ?? 'general',
    });
    this.openDrawer('announcement', 'Modifier l\'annonce');
  }

  saveAnnouncement() {
    if (this.announcementForm.invalid) return;
    this.announcementSaveError = null;
    const v = this.announcementForm.value as any;
    const obs = this.editingAnnouncementId
      ? this.announcementsApi.update(this.editingAnnouncementId, v)
      : this.announcementsApi.create(v);
    obs.subscribe({
      next: () => {
        this.editingAnnouncementId = null;
        this.announcementForm.reset({scope: 'global', category: 'general'});
        this.loadAnnouncements();
        this.closeDrawer();
      },
      error: (err) => { this.announcementSaveError = err?.error?.message ?? 'Erreur lors de la sauvegarde.'; },
    });
  }

  deleteAnnouncement(id: string) {
    this.confirmAndRun(
      {title: 'Supprimer annonce', message: 'Confirmer la suppression de cette annonce ?', danger: true, confirmLabel: 'Supprimer'},
      () => this.announcementsApi.remove(id).subscribe(() => this.loadAnnouncements()),
    );
  }

  cancelEditAnnouncement() {
    this.editingAnnouncementId = null;
    this.announcementForm.reset({scope: 'global', category: 'general'});
    this.announcementSaveError = null;
  }

  // === CONFIG ===
  systemParams: SystemParams | null = null;
  configSaving = false;
  configSaveSuccess = false;
  configSaveError: string | null = null;

  configForm = this.fb.group({
    maxStudentsPerGroup: [30, Validators.required],
    paymentGraceDays:    [7,  Validators.required],
    supportEmail:        ['', Validators.email],
    maintenanceMode:     [false],
    maxUploadSizeMb:     [10, Validators.required],
  });

  loadConfig() {
    this.adminApi.getSystemParams().subscribe({
      next: (p) => {
        this.systemParams = p;
        this.configForm.setValue({
          maxStudentsPerGroup: p.maxStudentsPerGroup ?? 30,
          paymentGraceDays:    p.paymentGraceDays ?? 7,
          supportEmail:        p.supportEmail ?? '',
          maintenanceMode:     p.maintenanceMode ?? false,
          maxUploadSizeMb:     p.maxUploadSizeMb ?? 10,
        });
      },
      error: () => { /* params may not exist yet */ },
    });
  }

  saveConfig() {
    if (this.configForm.invalid) return;
    this.configSaving = true;
    this.configSaveSuccess = false;
    this.configSaveError = null;
    this.adminApi.updateSystemParams(this.configForm.value as any).subscribe({
      next: (p) => {
        this.systemParams = p;
        this.configSaving = false;
        this.configSaveSuccess = true;
        setTimeout(() => { this.configSaveSuccess = false; }, 3000);
      },
      error: (err) => {
        this.configSaving = false;
        this.configSaveError = err?.error?.message ?? 'Erreur lors de la sauvegarde.';
      },
    });
  }

  // === USERS ===
  users$ = this.usersApi.listAll();
  userCreateError: string | null = null;
  userCreateSuccess = false;
  editingUserId: string | null = null;

  unlinkedProfiles: UnlinkedProfile[] = [];
  profileSearchQuery = '';
  selectedProfile: UnlinkedProfile | null = null;

  userForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['teacher', Validators.required],
    profileId: [null as string | null],
  });

  openCreateUser() {
    this.editingUserId = null;
    this.setUserFormMode('create');
    this.userForm.reset({role: 'teacher'});
    this.userCreateError = null;
    this.userCreateSuccess = false;
    this.unlinkedProfiles = [];
    this.profileSearchQuery = '';
    this.selectedProfile = null;
    this.loadUnlinkedProfiles('teacher', '');
    this.openDrawer('user', 'Créer un utilisateur');
  }

  onRoleChange(role: string) {
    this.unlinkedProfiles = [];
    this.profileSearchQuery = '';
    this.selectedProfile = null;
    this.userForm.patchValue({ profileId: null });
    if (role === 'student' || role === 'teacher' || role === 'external') {
      this.loadUnlinkedProfiles(role, '');
    }
  }

  loadUnlinkedProfiles(role: string, q: string) {
    if (role === 'student') {
      this.usersApi.listUnlinkedStudents(q || undefined).subscribe(list => { this.unlinkedProfiles = list; });
    } else if (role === 'teacher' || role === 'external') {
      this.usersApi.listUnlinkedTeachers(q || undefined).subscribe(list => { this.unlinkedProfiles = list; });
    }
  }

  searchProfiles(q: string) {
    this.profileSearchQuery = q;
    const role = this.userForm.get('role')?.value ?? '';
    this.loadUnlinkedProfiles(role, q);
  }

  selectProfile(p: UnlinkedProfile) {
    this.selectedProfile = p;
    this.userForm.patchValue({ profileId: p._id });
    if (!this.userForm.get('email')?.value && p.email) {
      this.userForm.patchValue({ email: p.email });
    }
  }

  clearProfileSelection() {
    this.selectedProfile = null;
    this.userForm.patchValue({ profileId: null });
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

    const payload: any = { email: raw.email, password: raw.password, role: raw.role };
    if (raw.profileId) payload.profileId = raw.profileId;
    this.usersApi.createUser(payload).subscribe({
      next: () => {
        this.userCreateSuccess = true;
        this.userForm.reset({role: 'teacher'});
        this.selectedProfile = null;
        this.unlinkedProfiles = [];
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
    this.teachers$ = this.loadTeachers();
    this.refreshPayments();
    this.loadDocuments();
    this.users$ = this.usersApi.listAll();
    this.loadAnnouncements();
    if (this.activeTab === 'dashboard') this.loadDashboard();
    if (this.activeTab === 'config') this.loadConfig();
  }

  private fmtDate(value: string | Date | undefined): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  // Calculate installment payment status (paid, partial, unpaid)
  getInstallmentStatus(plan: any, installmentId: string): { status: 'paid' | 'partial' | 'unpaid'; paid: number } {
    const payments = (this.payments$ as any).value || [];
    const paid = payments
      .filter((p: any) => p.planId === plan._id && p.installmentId === installmentId)
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const installment = plan.installments?.find((i: any) => i._id === installmentId);
    const dueAmount = installment?.amount || 0;

    if (paid >= dueAmount) return { status: 'paid', paid };
    if (paid > 0) return { status: 'partial', paid };
    return { status: 'unpaid', paid };
  }

  plansView$ = this.buildPlansView(this.plans$, this.payments$, this.allStudents$);
  paymentsView$ = this.buildPaymentsView(this.plans$, this.payments$, this.allStudents$);

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
    students$: Observable<{_id: string; firstName: string; lastName: string}[]>,
  ): Observable<PaymentView[]> {
    return combineLatest([plans$, payments$, students$]).pipe(
      map(([plans, payments, students]) => {
        const planById = new Map(plans.map((p) => [p._id, p]));
        const studentById = new Map(students.map((s) => [s._id, s]));
        return payments.map((payment) => {
          const student = studentById.get(payment.studentId);
          const studentName = student ? `${student.lastName} ${student.firstName}` : undefined;
          if (!payment.planId || !payment.installmentId) return { ...payment, studentName };
          const plan = planById.get(payment.planId);
          const installment = plan?.installments?.find(
            (inst) => inst._id === payment.installmentId,
          );
          if (!installment) return { ...payment, studentName };
          const paidAt = new Date(payment.paidAt);
          const dueDate = new Date(installment.dueDate);
          return {
            ...payment,
            studentName,
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
    students$: Observable<{_id: string; firstName: string; lastName: string}[]>,
  ): Observable<PaymentPlanView[]> {
    return combineLatest([plans$, payments$, students$]).pipe(
      map(([plans, payments, students]) => {
        const studentById = new Map(students.map((s) => [s._id, s]));
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
          const student = studentById.get(plan.studentId);
          const studentName = student ? `${student.lastName} ${student.firstName}` : undefined;
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
          return { ...plan, studentName, installmentStatus };
        });
      }),
    );
  }

  private loadCompactMode(): boolean {
    try {
      const raw = localStorage.getItem('ui.compactMode') ?? localStorage.getItem('student.compactMode');
      return raw === 'true';
    } catch {
      return false;
    }
  }

  private loadUltraCompactMode(): boolean {
    try {
      const raw = localStorage.getItem('ui.ultraCompactMode') ?? localStorage.getItem('student.ultraCompactMode');
      return raw === 'true';
    } catch {
      return false;
    }
  }
}
