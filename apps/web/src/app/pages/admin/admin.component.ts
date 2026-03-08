import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  FormArray, FormBuilder, ReactiveFormsModule, Validators, FormsModule,
} from '@angular/forms';
import {Observable, of, tap, take, combineLatest, map, distinctUntilChanged, switchMap, startWith, forkJoin} from 'rxjs';
import {AcademicApi} from '../../core/api/academic.api';
import {StudentsApi} from '../../core/api/students.api';
import {Payment, PaymentPlan, PaymentsApi} from '../../core/api/payments.api';
import {UsersApi} from '../../core/api/users.api';
import {Paginated, StudentDocument} from '../../core/api/students.api';
import {ConfirmService, ConfirmOptions} from '../../core/confirm.service';
import {
  AdminApi, AdminUser, CalendarEvent, ExecutiveDashboard,
  FeeExemption, FeeTemplate, FinancialReport, ImportResult, MesrsReport,
} from '../../core/api/admin.api';

export type AdminTab =
  | 'dashboard'
  | 'structure'
  | 'students'
  | 'payments'
  | 'documents'
  | 'users'
  | 'academic'
  | 'finance'
  | 'communication';

type DrawerMode =
  | 'year' | 'semester' | 'program' | 'level' | 'offer' | 'group'
  | 'student' | 'plan' | 'payment' | 'user' | 'document'
  | 'import-students' | 'assign-role' | 'reset-password-result'
  | 'init-year' | 'calendar-event' | 'fee-template' | 'apply-template'
  | 'exemption' | 'announce'
  | null;

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
  private readonly confirm = inject(ConfirmService);
  private readonly adminApi = inject(AdminApi);

  compactMode = this.loadCompactMode();
  ultraCompactMode = this.loadUltraCompactMode();

  // === TABS ===
  activeTab: AdminTab = 'dashboard';
  tabs: Array<{id: AdminTab; label: string; icon: string}> = [
    {id: 'dashboard', label: 'Tableau de bord', icon: '📊'},
    {id: 'structure', label: 'Structure', icon: '🏛️'},
    {id: 'students', label: 'Étudiants', icon: '🎓'},
    {id: 'payments', label: 'Paiements', icon: '💰'},
    {id: 'documents', label: 'Documents', icon: '📄'},
    {id: 'users', label: 'Utilisateurs', icon: '👤'},
    {id: 'academic', label: 'Année académique', icon: '📅'},
    {id: 'finance', label: 'Finances', icon: '💳'},
    {id: 'communication', label: 'Communication', icon: '📢'},
  ];

  setTab(tab: AdminTab) {
    this.activeTab = tab;
    if (tab === 'dashboard' && !this.dashboard) this.loadDashboard();
    if (tab === 'users' && this.uniUsers.length === 0) this.loadUniUsers();
    if (tab === 'academic') this.loadAcademicDataUni();
    if (tab === 'finance') this.loadFinanceData();
    if (tab === 'communication' && this.announceHistory.length === 0) this.loadAnnounceHistory();
  }

  // === DRAWER ===
  drawerOpen = false;
  drawerTitle = '';
  drawerMode: DrawerMode = null;
  drawerLoading = false;
  drawerError = '';

  openDrawer(mode: DrawerMode, title: string) {
    this.drawerMode = mode;
    this.drawerTitle = title;
    this.drawerOpen = true;
    this.drawerError = '';
    this.drawerLoading = false;
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
    this.drawerError = '';
    this.drawerLoading = false;
    this.cancelAll();
    // admin-uni specific resets
    this.importResult = null;
    this.resetPasswordResult = '';
    this.applyTemplateResult = null;
    this.announcementResult = null;
    this.selectedUserId = '';
    this.selectedTemplateId = '';
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
    this.cancelEditSemester(); this.cancelEditOffer(); this.cancelEditGroup();
    this.cancelEditStudent(); this.cancelEditPlan();
    this.cancelEditPayment(); this.cancelEditDocument(); this.cancelEditUser();
  }

  // ============================================================
  // === DASHBOARD (admin-uni) ===================================
  // ============================================================

  dashboard: ExecutiveDashboard | null = null;
  mesrsReport: MesrsReport | null = null;
  systemStatus: any = null;
  dashboardLoading = true;
  showMesrsReport = false;
  showSystemStatus = false;

  loadDashboard() {
    this.dashboardLoading = true;
    this.adminApi.getExecutiveDashboard().subscribe({
      next: (d) => { this.dashboard = d; this.dashboardLoading = false; },
      error: () => { this.dashboardLoading = false; },
    });
  }

  loadMesrsReport() {
    this.showMesrsReport = true;
    this.adminApi.getMesrsReport(this.dashboard?.activeAcademicYear?.id).subscribe({
      next: (r) => { this.mesrsReport = r; },
    });
  }

  loadSystemStatus() {
    this.showSystemStatus = true;
    this.adminApi.getSystemStatus().subscribe({
      next: (s) => { this.systemStatus = s; },
    });
  }

  // ============================================================
  // === ACADEMIC STRUCTURE (admin) ==============================
  // ============================================================

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

  levelForm = this.fb.group({ name: ['', Validators.required] });
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
    this.openDrawer('year', "Modifier l'année");
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
      name: s.name ?? '', startDate: this.fmtDate(s.startDate),
      endDate: this.fmtDate(s.endDate), academicYearId: s.academicYearId ?? '',
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
      programId: o.programId ?? '', levelId: o.levelId ?? '',
      academicYearId: o.academicYearId ?? '', capacity: o.capacity ?? 0,
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
    this.groupForm.setValue({name: g.name ?? '', offerId: g.offerId ?? ''});
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

  // ============================================================
  // === STUDENTS ================================================
  // ============================================================

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
      if (active && !control.value) control.setValue(active._id);
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
      offerId: s.offerId ?? '', programId: s.programId ?? '', groupId: s.groupId ?? '',
      academicYearId: s.academicYearId ?? '',
    });
    if (!s.offerId) this.setStudentOfferFromGroup(s.groupId ?? '', 'edit');
    if (s.offerId) this.onStudentOfferChange(s.offerId, 'edit');
    this.applyActiveYearDefault(this.editStudentForm);
    this.openDrawer('student', "Modifier l'étudiant");
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
      if (!group || (offerId && group.offerId !== offerId)) form.get('groupId')?.setValue('');
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

  // ============================================================
  // === DOCUMENTS ===============================================
  // ============================================================

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
    if (!this.documentStudentId) {
      this.documents$ = of({items: [], total: 0, page: 1, limit: 20, skip: 0});
      return;
    }
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

  // ============================================================
  // === PAYMENTS ================================================
  // ============================================================

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

  studentPlans$ = this.paymentForm.get('studentId')!.valueChanges.pipe(
    startWith(this.paymentForm.get('studentId')!.value),
    distinctUntilChanged(),
    switchMap(studentId => {
      if (!studentId) return of(null);
      return this.plans$.pipe(map(plans => plans.filter(p => p.studentId === studentId)));
    }),
  );

  selectedPlan$ = this.studentPlans$.pipe(
    tap(plans => {
      if (plans && plans.length === 1) {
        this.paymentForm.patchValue({ planId: plans[0]._id }, { emitEvent: false });
      }
    }),
    map(plans => plans && plans.length > 0 ? plans[0] : null),
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
          () => { this.cancelEditPlan(); this.refreshPayments(); this.closeDrawer(); alert('✅ Plan modifié avec succès'); },
          (err) => alert('❌ Erreur: ' + (err?.error?.message || 'Modification échouée')),
        ),
      );
      return;
    }
    obs.subscribe(
      () => { this.cancelEditPlan(); this.refreshPayments(); this.closeDrawer(); alert('✅ Plan créé avec succès'); },
      (err) => alert('❌ Erreur: ' + (err?.error?.message || 'Création échouée')),
    );
  }

  createPlanFromPayment() {
    const studentId = this.paymentForm.get('studentId')?.value;
    if (!studentId) { alert("⚠️ Veuillez d'abord sélectionner un étudiant"); return; }
    this.cancelEditPlan();
    this.planForm.patchValue({ studentId }, { emitEvent: false });
    this.openDrawer('plan', 'Créer un plan de paiement');
  }

  selectPlanForEdit(p: any) {
    this.editingPlanId = p._id;
    this.planForm.patchValue({studentId: p.studentId ?? '', label: p.label ?? '', totalAmount: p.totalAmount ?? 0, currency: p.currency ?? 'XOF'});
    this.installments.clear();
    (p.installments ?? []).forEach((inst: any) =>
      this.installments.push(this.fb.group({
        amount: [inst.amount ?? 0, Validators.required],
        dueDate: [this.fmtDate(inst.dueDate), Validators.required],
        label: [inst.label ?? ''],
      })),
    );
    this.openDrawer('plan', 'Modifier le plan');
  }

  cancelEditPlan() { this.editingPlanId = null; this.planForm.reset({currency: 'XOF', totalAmount: 0}); this.installments.clear(); }

  deletePlan(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer plan', message: 'Confirmer la suppression du plan de paiement ?', danger: true, confirmLabel: 'Supprimer' },
      () => this.payments.deletePlan(id).subscribe(
        () => { this.refreshPayments(); alert('✅ Plan supprimé avec succès'); },
        (err) => alert('❌ Erreur: ' + (err?.error?.message || 'Suppression échouée')),
      ),
    );
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
    this.paymentForm.setValue({
      studentId: p.studentId ?? '', planId: p.planId ?? '', installmentId: p.installmentId ?? '',
      amount: p.amount ?? 0, currency: p.currency ?? 'XOF', paidAt: this.fmtDate(p.paidAt),
      reference: p.reference ?? '', paymentMethod: p.paymentMethod ?? 'espece',
    });
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
    this.kpis$ = combineLatest([this.plans$, this.payments$]).pipe(
      map(([plans, payments]) => this.calcKpis(plans, payments)),
    );
  }

  plansView$ = this.buildPlansView(this.plans$, this.payments$, this.allStudents$);
  paymentsView$ = this.buildPaymentsView(this.plans$, this.payments$, this.allStudents$);

  kpis$ = combineLatest([this.plans$, this.payments$]).pipe(
    map(([plans, payments]) => this.calcKpis(plans, payments)),
  );

  private calcKpis(plans: PaymentPlan[], payments: Payment[]) {
    const paidByPlanInst = new Map<string, Map<string, number>>();
    payments.forEach((payment) => {
      if (!payment.planId || !payment.installmentId) return;
      if (!paidByPlanInst.has(payment.planId)) paidByPlanInst.set(payment.planId, new Map());
      const byInst = paidByPlanInst.get(payment.planId)!;
      byInst.set(payment.installmentId, (byInst.get(payment.installmentId) ?? 0) + (payment.amount ?? 0));
    });
    let totalDue = 0;
    plans.forEach((plan) => {
      const byInst = paidByPlanInst.get(plan._id) ?? new Map();
      (plan.installments ?? []).forEach((inst) => {
        const paid = byInst.get(inst._id ?? '') ?? 0;
        totalDue += Math.max(0, (inst.amount ?? 0) - paid);
      });
    });
    const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const grandTotal = totalCollected + totalDue;
    const paymentRate = grandTotal > 0 ? (totalCollected / grandTotal) * 100 : 0;
    return { totalCollected, totalDue, paymentRate: Math.round(paymentRate * 10) / 10 };
  }

  getPlanInstallments(plans: PaymentPlan[] | null | undefined, planId: string | null | undefined) {
    if (!plans || !planId) return [];
    return plans.find((p) => p._id === planId)?.installments ?? [];
  }

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
          const installment = plan?.installments?.find((inst) => inst._id === payment.installmentId);
          if (!installment) return { ...payment, studentName };
          const paidAt = new Date(payment.paidAt);
          const dueDate = new Date(installment.dueDate);
          return {
            ...payment, studentName,
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
          if (!paidByPlanInst.has(payment.planId)) paidByPlanInst.set(payment.planId, new Map());
          const byInst = paidByPlanInst.get(payment.planId)!;
          byInst.set(payment.installmentId, (byInst.get(payment.installmentId) ?? 0) + (payment.amount ?? 0));
        });
        return plans.map((plan) => {
          const student = studentById.get(plan.studentId);
          const studentName = student ? `${student.lastName} ${student.firstName}` : undefined;
          const byInst = paidByPlanInst.get(plan._id) ?? new Map();
          const installmentStatus = (plan.installments ?? []).map((inst) => {
            const paid = byInst.get(inst._id ?? '') ?? 0;
            const remaining = Math.max(0, (inst.amount ?? 0) - paid);
            return { _id: inst._id, amount: inst.amount, dueDate: inst.dueDate, label: inst.label, paid, remaining };
          });
          return { ...plan, studentName, installmentStatus };
        });
      }),
    );
  }

  // ============================================================
  // === USERS (basic — UsersApi) ================================
  // ============================================================

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
    this.openDrawer('user', "Modifier l'utilisateur");
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
          next: () => { this.userCreateSuccess = true; this.cancelEditUser(); this.users$ = this.usersApi.listAll(); this.closeDrawer(); },
          error: (err) => { this.userCreateError = err?.error?.message ?? 'Erreur lors de la mise à jour.'; },
        }),
      );
      return;
    }
    this.usersApi.createUser(raw).subscribe({
      next: () => { this.userCreateSuccess = true; this.userForm.reset({role: 'teacher'}); this.users$ = this.usersApi.listAll(); this.closeDrawer(); },
      error: (err) => { this.userCreateError = err?.error?.message ?? 'Erreur lors de la création.'; },
    });
  }

  deleteUser(id: string) {
    this.confirmAndRun(
      { title: 'Supprimer utilisateur', message: "Confirmer la suppression de cet utilisateur ?", danger: true, confirmLabel: 'Supprimer' },
      () => this.usersApi.deleteUser(id).subscribe(() => { this.users$ = this.usersApi.listAll(); }),
    );
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

  // ============================================================
  // === USERS (advanced — AdminApi) =============================
  // ============================================================

  uniUsers: AdminUser[] = [];
  userTotal = 0;
  userPage = 0;
  readonly userLimit = 20;
  userLoading = false;
  userQ = '';
  userRoleFilter = '';
  userSuspendedFilter = '';

  loadUniUsers() {
    this.userLoading = true;
    const params: any = {skip: this.userPage * this.userLimit, limit: this.userLimit};
    if (this.userQ) params.q = this.userQ;
    if (this.userRoleFilter) params.role = this.userRoleFilter;
    if (this.userSuspendedFilter !== '') params.suspended = this.userSuspendedFilter === 'true';
    this.adminApi.listUsers(params).subscribe({
      next: ({items, total}) => { this.uniUsers = items; this.userTotal = total; this.userLoading = false; },
      error: () => { this.userLoading = false; },
    });
  }

  searchUniUsers() { this.userPage = 0; this.loadUniUsers(); }
  userPagePrev() { if (this.userPage > 0) { this.userPage--; this.loadUniUsers(); } }
  userPageNext() { if ((this.userPage + 1) * this.userLimit < this.userTotal) { this.userPage++; this.loadUniUsers(); } }
  get userTotalPages() { return Math.ceil(this.userTotal / this.userLimit); }

  suspendUser(user: AdminUser) {
    const label = user.suspended ? 'Réactiver' : 'Suspendre';
    this.confirm.open({title: `${label} ${user.email} ?`, confirmLabel: label, danger: !user.suspended})
      .subscribe(ok => {
        if (!ok) return;
        const action = user.suspended ? this.adminApi.reactivateUser(user._id) : this.adminApi.suspendUser(user._id);
        action.subscribe({
          next: () => this.loadUniUsers(),
          error: () => alert("Erreur lors de l'opération."),
        });
      });
  }

  selectedUserId = '';
  resetPasswordResult = '';

  openResetPassword(user: AdminUser) {
    this.selectedUserId = user._id;
    this.openDrawer('reset-password-result', `Réinitialiser le mot de passe — ${user.email}`);
    this.drawerLoading = true;
    this.adminApi.resetPassword(user._id).subscribe({
      next: ({tempPassword}) => { this.resetPasswordResult = tempPassword; this.drawerLoading = false; },
      error: () => { this.drawerError = 'Erreur lors de la réinitialisation.'; this.drawerLoading = false; },
    });
  }

  roleForm = this.fb.group({ role: ['', Validators.required] });
  readonly roleOptions = [
    {value: 'admin', label: 'Administrateur'},
    {value: 'teacher', label: 'Enseignant permanent'},
    {value: 'external', label: 'Enseignant vacataire'},
    {value: 'student', label: 'Étudiant'},
  ];

  openAssignRole(user: AdminUser) {
    this.selectedUserId = user._id;
    this.roleForm.setValue({role: user.role});
    this.openDrawer('assign-role', `Modifier le rôle — ${user.email}`);
  }

  submitAssignRole() {
    if (this.roleForm.invalid || !this.selectedUserId) return;
    this.drawerLoading = true;
    this.adminApi.assignRole(this.selectedUserId, this.roleForm.value.role!).subscribe({
      next: () => { this.closeDrawer(); this.loadUniUsers(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  // Bulk import
  importResult: ImportResult | null = null;
  uniYears: any[] = [];
  uniOffers: any[] = [];
  uniGroups: any[] = [];

  importForm = this.fb.group({
    offerId: ['', Validators.required],
    groupId: ['', Validators.required],
    csvText: ['', Validators.required],
  });

  openImport() {
    this.importResult = null;
    this.importForm.reset();
    if (this.uniYears.length === 0) this.loadAcademicDataUni();
    this.openDrawer('import-students', "Import en masse d'étudiants");
  }

  onImportOfferChange(offerId: string) {
    this.importForm.patchValue({groupId: ''});
    this.uniGroups = [];
    if (!offerId) return;
    this.academic.listGroups().subscribe(g => {
      this.uniGroups = (g.items ?? []).filter((x: any) => String(x.offerId) === offerId);
    });
  }

  submitImport() {
    if (this.importForm.invalid) return;
    const {offerId, groupId, csvText} = this.importForm.value as any;
    const rows = this.parseCsv(csvText);
    if (rows.length === 0) { this.drawerError = 'Aucune ligne valide trouvée dans le CSV.'; return; }
    this.drawerLoading = true;
    this.drawerError = '';
    this.adminApi.importStudents(offerId, groupId, rows).subscribe({
      next: (result) => { this.importResult = result; this.drawerLoading = false; },
      error: (e) => { this.drawerError = e?.error?.message ?? "Erreur lors de l'import."; this.drawerLoading = false; },
    });
  }

  private parseCsv(text: string): any[] {
    const lines = text.trim().split('\n').slice(1);
    return lines
      .map((line) => {
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length < 4) return null;
        return {
          lastName: parts[0], firstName: parts[1],
          gender: parts[2]?.toLowerCase() === 'f' || parts[2]?.toLowerCase() === 'female' ? 'female' : 'male',
          birthDate: parts[3], email: parts[4] || undefined, phone: parts[5] || undefined,
        };
      })
      .filter(Boolean);
  }

  // Audit logs
  auditLogs: any[] = [];
  auditTotal = 0;
  showAuditLogs = false;
  auditActionFilter = '';

  loadAuditLogs() {
    this.showAuditLogs = true;
    this.adminApi.listAuditLogs({limit: 30, action: this.auditActionFilter || undefined}).subscribe({
      next: ({items, total}) => { this.auditLogs = items; this.auditTotal = total; },
    });
  }

  // ============================================================
  // === ACADEMIC TAB (admin-uni) ================================
  // ============================================================

  uniPrograms: any[] = [];
  uniLevels: any[] = [];
  calendarEvents: CalendarEvent[] = [];
  calendarYearId = '';
  academicOffers: any[] = [];
  academicYears: any[] = [];

  loadAcademicDataUni() {
    forkJoin({
      years: this.academic.listYears(),
      programs: this.academic.listPrograms(),
      levels: this.academic.listLevels(),
      offers: this.academic.listOffers(),
    }).subscribe(({years, programs, levels, offers}) => {
      this.academicYears = years.items ?? [];
      this.uniYears = years.items ?? [];
      this.uniPrograms = programs.items ?? [];
      this.uniLevels = levels.items ?? [];
      this.academicOffers = offers.items ?? [];
      this.uniOffers = offers.items ?? [];
    });
  }

  // Init year form
  initYearForm = this.fb.group({
    name: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isActive: [false],
  });

  semesters = this.fb.array([
    this.fb.group({name: ['S1', Validators.required], startDate: ['', Validators.required], endDate: ['', Validators.required]}),
    this.fb.group({name: ['S2', Validators.required], startDate: ['', Validators.required], endDate: ['', Validators.required]}),
  ]);

  offerLines = this.fb.array<ReturnType<typeof this.newOfferLine>>([]);

  newOfferLine() {
    return this.fb.group({
      programId: ['', Validators.required],
      levelId: ['', Validators.required],
      capacity: [30, [Validators.required, Validators.min(1)]],
    });
  }

  addSemester() { this.semesters.push(this.fb.group({name: [''], startDate: [''], endDate: ['']})); }
  removeSemester(i: number) { this.semesters.removeAt(i); }
  addOfferLine() { this.offerLines.push(this.newOfferLine()); }
  removeOfferLine(i: number) { this.offerLines.removeAt(i); }

  submitInitYear() {
    if (this.initYearForm.invalid) return;
    const v = this.initYearForm.value as any;
    const body = {
      name: v.name, startDate: v.startDate, endDate: v.endDate, isActive: v.isActive,
      semesters: this.semesters.value.filter(s => s.name && s.startDate && s.endDate),
      offers: this.offerLines.value.filter(o => o.programId && o.levelId && o.capacity),
    };
    this.drawerLoading = true;
    this.adminApi.initializeYear(body).subscribe({
      next: () => { this.closeDrawer(); this.loadAcademicDataUni(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  closeYear(year: any) {
    this.confirm.open({
      title: `Clôturer l'année ${year.name} ?`,
      message: "Cette action est irréversible. L'année sera archivée.",
      confirmLabel: 'Clôturer', danger: true,
    }).subscribe(ok => {
      if (!ok) return;
      this.adminApi.closeYear(year._id).subscribe({
        next: (r) => { alert(`Année ${r.closedYear} clôturée. ${r.archivedStudents} étudiants archivés.`); this.loadAcademicDataUni(); },
        error: (e) => alert(e?.error?.message ?? 'Erreur.'),
      });
    });
  }

  // Calendar events
  calEventForm = this.fb.group({
    academicYearId: ['', Validators.required],
    type: ['examens', Validators.required],
    label: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  readonly calEventTypes = [
    {value: 'rentree', label: 'Rentrée'},
    {value: 'vacances', label: 'Vacances'},
    {value: 'examens', label: 'Examens'},
    {value: 'deliberations', label: 'Délibérations'},
    {value: 'rattrapage', label: 'Rattrapage'},
    {value: 'autre', label: 'Autre'},
  ];

  openCalEventDrawer() {
    this.calEventForm.reset({type: 'examens'});
    this.openDrawer('calendar-event', 'Ajouter un événement');
  }

  loadCalendarEvents() {
    if (!this.calendarYearId) return;
    this.adminApi.listCalendarEvents({academicYearId: this.calendarYearId}).subscribe({
      next: ({items}) => { this.calendarEvents = items; },
    });
  }

  submitCalEvent() {
    if (this.calEventForm.invalid) return;
    this.drawerLoading = true;
    this.adminApi.createCalendarEvent(this.calEventForm.value as any).subscribe({
      next: () => { this.closeDrawer(); this.loadCalendarEvents(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  deleteCalEvent(event: CalendarEvent) {
    this.confirm.open({title: `Supprimer l'événement "${event.label}" ?`, danger: true})
      .subscribe(ok => {
        if (!ok) return;
        this.adminApi.deleteCalendarEvent(event._id).subscribe({next: () => this.loadCalendarEvents()});
      });
  }

  // Offer capacity editor
  editingCapacityOfferId = '';
  editingCapacity = 30;

  startEditCapacity(offer: any) { this.editingCapacityOfferId = offer._id; this.editingCapacity = offer.capacity; }
  saveCapacity() {
    this.adminApi.updateOfferCapacity(this.editingCapacityOfferId, this.editingCapacity).subscribe({
      next: () => { this.editingCapacityOfferId = ''; this.loadAcademicDataUni(); },
      error: (e) => alert(e?.error?.message ?? 'Erreur.'),
    });
  }
  cancelCapacityEdit() { this.editingCapacityOfferId = ''; }

  // ============================================================
  // === FINANCE TAB (admin-uni) =================================
  // ============================================================

  feeTemplates: FeeTemplate[] = [];
  exemptions: FeeExemption[] = [];
  financialReport: FinancialReport | null = null;
  financeLoading = false;

  loadFinanceData() {
    this.financeLoading = true;
    forkJoin({
      templates: this.adminApi.listFeeTemplates(),
      report: this.adminApi.getFinancialReport(),
      exemptions: this.adminApi.listExemptions(),
    }).subscribe({
      next: ({templates, report, exemptions}) => {
        this.feeTemplates = templates.items;
        this.financialReport = report;
        this.exemptions = exemptions.items;
        this.financeLoading = false;
      },
      error: () => { this.financeLoading = false; },
    });
  }

  // Fee template form
  feeForm = this.fb.group({
    label: ['', Validators.required],
    offerId: ['', Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(1)]],
    currency: ['XOF'],
    acceptedMethods: this.fb.group({
      espece: [true], virement: [false], orange_money: [false], mtn_momo: [false], moov_money: [false],
    }),
  });

  feeInstallments = this.fb.array<ReturnType<typeof this.newInstallmentLine>>([]);

  newInstallmentLine() {
    return this.fb.group({
      label: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      dueDate: ['', Validators.required],
    });
  }

  addInstallmentLine() { this.feeInstallments.push(this.newInstallmentLine()); }
  removeInstallmentLine(i: number) { this.feeInstallments.removeAt(i); }

  openFeeTemplateDrawer() {
    this.feeForm.reset({currency: 'XOF', acceptedMethods: {espece: true}});
    this.feeInstallments.clear();
    this.addInstallmentLine();
    this.openDrawer('fee-template', 'Nouveau modèle de frais');
  }

  get installmentTotal() {
    return this.feeInstallments.value.reduce((s, i) => s + Number(i.amount || 0), 0);
  }

  submitFeeTemplate() {
    if (this.feeForm.invalid) return;
    const v = this.feeForm.value as any;
    const methods = Object.keys(v.acceptedMethods).filter(k => v.acceptedMethods[k]);
    const body = {
      label: v.label, offerId: v.offerId, totalAmount: Number(v.totalAmount),
      currency: v.currency || 'XOF', acceptedMethods: methods,
      installments: this.feeInstallments.value.map(i => ({...i, amount: Number(i.amount)})),
    };
    this.drawerLoading = true;
    this.adminApi.createFeeTemplate(body).subscribe({
      next: () => { this.closeDrawer(); this.loadFinanceData(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  // Apply template
  selectedTemplateId = '';
  applyTemplateStudentIds = '';
  applyTemplateResult: {applied: number; skipped: number} | null = null;

  openApplyTemplate(template: FeeTemplate) {
    this.selectedTemplateId = template._id;
    this.applyTemplateStudentIds = '';
    this.applyTemplateResult = null;
    this.openDrawer('apply-template', `Appliquer "${template.label}"`);
  }

  submitApplyTemplate() {
    if (!this.selectedTemplateId || !this.applyTemplateStudentIds.trim()) return;
    const ids = this.applyTemplateStudentIds.split('\n').map(s => s.trim()).filter(Boolean);
    this.drawerLoading = true;
    this.adminApi.applyFeeTemplate(this.selectedTemplateId, ids).subscribe({
      next: (r) => { this.applyTemplateResult = r; this.drawerLoading = false; },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  // Exemptions
  exemptionForm = this.fb.group({
    studentId: ['', Validators.required],
    academicYearId: ['', Validators.required],
    type: ['total', Validators.required],
    percentage: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    reason: ['', Validators.required],
  });

  openExemptionDrawer() {
    this.exemptionForm.reset({type: 'total', percentage: 100});
    if (this.uniYears.length === 0) this.loadAcademicDataUni();
    this.openDrawer('exemption', 'Nouvelle exonération');
  }

  onExemptionTypeChange(type: string) {
    if (type === 'total') this.exemptionForm.patchValue({percentage: 100});
  }

  submitExemption() {
    if (this.exemptionForm.invalid) return;
    this.drawerLoading = true;
    this.adminApi.createExemption(this.exemptionForm.value as any).subscribe({
      next: () => { this.closeDrawer(); this.loadFinanceData(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  deleteExemption(ex: FeeExemption) {
    this.confirm.open({title: 'Supprimer cette exonération ?', danger: true})
      .subscribe(ok => {
        if (!ok) return;
        this.adminApi.deleteExemption(ex._id).subscribe({next: () => this.loadFinanceData()});
      });
  }

  // ============================================================
  // === COMMUNICATION TAB (admin-uni) ===========================
  // ============================================================

  announcementResult: {success: boolean; recipientCount: number; sentAt: string} | null = null;
  announceHistory: any[] = [];

  announceForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    content: ['', [Validators.required, Validators.maxLength(2000)]],
    targetAll: [true],
    targetStudent: [false],
    targetTeacher: [false],
    targetAdmin: [false],
  });

  openAnnounceDrawer() {
    this.announceForm.reset({targetAll: true});
    this.announcementResult = null;
    this.openDrawer('announce', 'Nouvelle annonce officielle');
  }

  submitAnnounce() {
    if (this.announceForm.invalid) return;
    const v = this.announceForm.value as any;
    const targetRoles: string[] = [];
    if (v.targetAll) {
      targetRoles.push('student', 'teacher', 'admin');
    } else {
      if (v.targetStudent) targetRoles.push('student');
      if (v.targetTeacher) targetRoles.push('teacher');
      if (v.targetAdmin) targetRoles.push('admin');
    }
    if (targetRoles.length === 0) { this.drawerError = 'Sélectionnez au moins un groupe cible.'; return; }
    this.drawerLoading = true;
    this.adminApi.broadcastAnnouncement({title: v.title, content: v.content, targetRoles}).subscribe({
      next: (r) => { this.announcementResult = r; this.drawerLoading = false; this.loadAnnounceHistory(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  loadAnnounceHistory() {
    this.adminApi.listAuditLogs({action: 'BROADCAST_ANNOUNCEMENT', limit: 10}).subscribe({
      next: ({items}) => { this.announceHistory = items; },
    });
  }

  // ============================================================
  // === HELPERS =================================================
  // ============================================================

  // Helpers using array properties (admin-uni tabs: academic, finance)
  uniProgramName(id: string) { return this.uniPrograms.find(p => p._id === id)?.name ?? id; }
  uniLevelName(id: string) { return this.uniLevels.find(l => l._id === id)?.name ?? id; }
  uniYearName(id: string) { return this.uniYears.find(y => y._id === id)?.name ?? id; }
  uniOfferLabel(id: string) {
    const o = this.uniOffers.find(x => x._id === id);
    if (!o) return id;
    return `${this.uniProgramName(String(o.programId))} — ${this.uniLevelName(String(o.levelId))}`;
  }

  calEventTypeLabel(type: string) { return this.calEventTypes.find(t => t.value === type)?.label ?? type; }

  roleBadgeClass(role: string) { return `role-${role?.replace('_', '-')}`; }

  roleLabel(role: string) {
    const map: Record<string, string> = {
      super_admin: 'Super Admin', admin: 'Admin',
      teacher: 'Enseignant', external: 'Vacataire', student: 'Étudiant',
    };
    return map[role] ?? role;
  }

  formatNumber(n: number) { return new Intl.NumberFormat('fr-FR').format(Math.round(n)); }
  formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'});
  }

  // ============================================================
  // === SHARED ==================================================
  // ============================================================

  refresh() {
    this.refreshAcademic();
    this.students$ = this.loadStudents();
    this.refreshPayments();
    this.loadDocuments();
    this.users$ = this.usersApi.listAll();
  }

  private confirmAndRun(options: ConfirmOptions, action: () => void) {
    this.confirm.open(options).pipe(take(1)).subscribe((ok) => { if (ok) action(); });
  }

  private fmtDate(value: string | Date | undefined): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  private loadCompactMode(): boolean {
    try {
      const raw = localStorage.getItem('ui.compactMode') ?? localStorage.getItem('student.compactMode');
      return raw === 'true';
    } catch { return false; }
  }

  private loadUltraCompactMode(): boolean {
    try {
      const raw = localStorage.getItem('ui.ultraCompactMode') ?? localStorage.getItem('student.ultraCompactMode');
      return raw === 'true';
    } catch { return false; }
  }

  ngOnInit() {
    // Payment form: installmentId required only when planId set
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
    // Load dashboard on init (default tab)
    this.loadDashboard();
  }
}
