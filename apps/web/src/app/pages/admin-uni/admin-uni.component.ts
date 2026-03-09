import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {forkJoin} from 'rxjs';
import {
  AdminApi, AdminUser, CalendarEvent, EmailTemplate, ExecutiveDashboard,
  FeeExemption, FeeTemplate, FinancialReport, ImportResult, MesrsReport,
  SmtpConfig, SystemParams, XlsxParseResult,
} from '../../core/api/admin.api';
import {AcademicApi} from '../../core/api/academic.api';
import {StudentsApi} from '../../core/api/students.api';
import {ConfirmService} from '../../core/confirm.service';
import {Announcement, AnnouncementsApi} from '../../core/api/announcements.api';

export type AdminUniTab = 'dashboard' | 'users' | 'academic' | 'finance' | 'communication' | 'config';

type DrawerMode =
  | 'import-students'
  | 'assign-role'
  | 'reset-password-result'
  | 'init-year'
  | 'calendar-event'
  | 'fee-template'
  | 'apply-template'
  | 'exemption'
  | 'announce'
  | 'smtp-config'
  | 'email-template'
  | 'system-params'
  | null;

@Component({
  selector: 'app-admin-uni',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-uni.component.html',
  styleUrls: ['./admin-uni.component.scss'],
})
export class AdminUniComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly announcementsApi = inject(AnnouncementsApi);
  private readonly academic = inject(AcademicApi);
  private readonly studentsApi = inject(StudentsApi);
  private readonly confirm = inject(ConfirmService);

  // ── Tabs ────────────────────────────────────────────────────────────────────

  activeTab: AdminUniTab = 'dashboard';
  readonly tabs: {id: AdminUniTab; label: string; icon: string}[] = [
    {id: 'dashboard', label: 'Tableau de bord', icon: '📊'},
    {id: 'users', label: 'Utilisateurs', icon: '👤'},
    {id: 'academic', label: 'Année académique', icon: '🏛️'},
    {id: 'finance', label: 'Finances', icon: '💰'},
    {id: 'communication', label: 'Communication', icon: '📢'},
    {id: 'config', label: 'Configuration', icon: '⚙️'},
  ];

  setTab(tab: AdminUniTab) {
    this.activeTab = tab;
    if (tab === 'dashboard' && !this.dashboard) this.loadDashboard();
    if (tab === 'users' && this.users.length === 0) this.loadUsers();
    if (tab === 'academic') this.loadAcademicData();
    if (tab === 'finance') this.loadFinanceData();
    if (tab === 'config') this.loadConfigData();
  }

  // ── Drawer ──────────────────────────────────────────────────────────────────

  drawerOpen = false;
  drawerMode: DrawerMode = null;
  drawerTitle = '';

  openDrawer(mode: DrawerMode, title: string) {
    this.drawerMode = mode;
    this.drawerTitle = title;
    this.drawerOpen = true;
    this.drawerError = '';
    this.drawerLoading = false;
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.drawerMode = null;
    this.drawerTitle = '';
    this.drawerError = '';
    this.drawerLoading = false;
    this.importResult = null;
    this.resetPasswordResult = '';
    this.applyTemplateResult = null;
    this.announcementResult = null;
    this.editingAnnouncement = null;
    this.selectedUserId = '';
    this.selectedTemplateId = '';
  }

  drawerLoading = false;
  drawerError = '';

  // ── Dashboard ────────────────────────────────────────────────────────────────

  dashboard: ExecutiveDashboard | null = null;
  mesrsReport: MesrsReport | null = null;
  systemStatus: any = null;
  dashboardLoading = true;
  showMesrsReport = false;
  showSystemStatus = false;

  loadDashboard() {
    this.dashboardLoading = true;
    this.api.getExecutiveDashboard().subscribe({
      next: (d) => { this.dashboard = d; this.dashboardLoading = false; },
      error: () => { this.dashboardLoading = false; },
    });
  }

  loadMesrsReport() {
    this.showMesrsReport = true;
    this.api.getMesrsReport(this.dashboard?.activeAcademicYear?.id).subscribe({
      next: (r) => { this.mesrsReport = r; },
    });
  }

  loadSystemStatus() {
    this.showSystemStatus = true;
    this.api.getSystemStatus().subscribe({
      next: (s) => { this.systemStatus = s; },
    });
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  users: AdminUser[] = [];
  userTotal = 0;
  userPage = 0;
  readonly userLimit = 20;
  userLoading = false;
  userQ = '';
  userRoleFilter = '';
  userSuspendedFilter = '';

  loadUsers() {
    this.userLoading = true;
    const params: any = {skip: this.userPage * this.userLimit, limit: this.userLimit};
    if (this.userQ) params.q = this.userQ;
    if (this.userRoleFilter) params.role = this.userRoleFilter;
    if (this.userSuspendedFilter !== '') params.suspended = this.userSuspendedFilter === 'true';

    this.api.listUsers(params).subscribe({
      next: ({items, total}) => { this.users = items; this.userTotal = total; this.userLoading = false; },
      error: () => { this.userLoading = false; },
    });
  }

  searchUsers() { this.userPage = 0; this.loadUsers(); }
  userPagePrev() { if (this.userPage > 0) { this.userPage--; this.loadUsers(); } }
  userPageNext() { if ((this.userPage + 1) * this.userLimit < this.userTotal) { this.userPage++; this.loadUsers(); } }

  get userTotalPages() { return Math.ceil(this.userTotal / this.userLimit); }

  suspendUser(user: AdminUser) {
    const label = user.suspended ? 'Réactiver' : 'Suspendre';
    this.confirm.open({
      title: `${label} ${user.email} ?`,
      message: user.suspended ? 'Confirmer la réactivation du compte.' : 'Confirmer la suspension du compte.',
      confirmLabel: label,
      danger: !user.suspended,
    })
      .subscribe(ok => {
        if (!ok) return;
        const action = user.suspended ? this.api.reactivateUser(user._id) : this.api.suspendUser(user._id);
        action.subscribe({
          next: () => this.loadUsers(),
          error: () => alert('Erreur lors de l\'opération.'),
        });
      });
  }

  selectedUserId = '';
  resetPasswordResult = '';

  openResetPassword(user: AdminUser) {
    this.selectedUserId = user._id;
    this.openDrawer('reset-password-result', `Réinitialiser le mot de passe — ${user.email}`);
    this.drawerLoading = true;
    this.api.resetPassword(user._id).subscribe({
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
    this.api.assignRole(this.selectedUserId, this.roleForm.value.role!).subscribe({
      next: () => { this.closeDrawer(); this.loadUsers(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  // ── Bulk import ──────────────────────────────────────────────────────────────

  importResult: ImportResult | null = null;
  years: any[] = [];
  offers: any[] = [];
  groups: any[] = [];

  importForm = this.fb.group({
    offerId: ['', Validators.required],
    groupId: ['', Validators.required],
    csvText: ['', Validators.required],
  });

  openImport() {
    this.importResult = null;
    this.importForm.reset();
    if (this.years.length === 0) this.loadAcademicData();
    this.openDrawer('import-students', 'Import en masse d\'étudiants');
  }

  onImportOfferChange(offerId: string) {
    this.importForm.patchValue({groupId: ''});
    this.groups = [];
    if (!offerId) return;
    this.academic.listGroups().subscribe(g => {
      this.groups = (g.items ?? []).filter((x: any) => String(x.offerId) === offerId);
    });
  }

  submitImport() {
    if (this.importForm.invalid) return;
    const {offerId, groupId, csvText} = this.importForm.value as any;
    const rows = this.parseCsv(csvText);
    if (rows.length === 0) { this.drawerError = 'Aucune ligne valide trouvée dans le CSV.'; return; }

    this.drawerLoading = true;
    this.drawerError = '';
    this.api.importStudents(offerId, groupId, rows).subscribe({
      next: (result) => { this.importResult = result; this.drawerLoading = false; },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur lors de l\'import.'; this.drawerLoading = false; },
    });
  }

  private parseCsv(text: string): any[] {
    const lines = text.trim().split('\n').slice(1); // skip header row
    return lines
      .map((line, i) => {
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length < 4) return null;
        return {
          lastName: parts[0],
          firstName: parts[1],
          gender: parts[2]?.toLowerCase() === 'f' || parts[2]?.toLowerCase() === 'female' ? 'female' : 'male',
          birthDate: parts[3],
          email: parts[4] || undefined,
          phone: parts[5] || undefined,
        };
      })
      .filter(Boolean);
  }

  // ── Audit logs (inside users tab) ────────────────────────────────────────────

  auditLogs: any[] = [];
  auditTotal = 0;
  showAuditLogs = false;
  auditActionFilter = '';

  loadAuditLogs() {
    this.showAuditLogs = true;
    this.api.listAuditLogs({limit: 30, action: this.auditActionFilter || undefined}).subscribe({
      next: ({items, total}) => { this.auditLogs = items; this.auditTotal = total; },
    });
  }

  // ── Academic tab ─────────────────────────────────────────────────────────────

  programs: any[] = [];
  levels: any[] = [];
  calendarEvents: CalendarEvent[] = [];
  calendarYearId = '';
  academicOffers: any[] = [];
  academicYears: any[] = [];

  loadAcademicData() {
    forkJoin({
      years: this.academic.listYears(),
      programs: this.academic.listPrograms(),
      levels: this.academic.listLevels(),
      offers: this.academic.listOffers(),
    }).subscribe(({years, programs, levels, offers}) => {
      this.academicYears = years.items ?? [];
      this.years = years.items ?? [];
      this.programs = programs.items ?? [];
      this.levels = levels.items ?? [];
      this.academicOffers = offers.items ?? [];
      this.offers = offers.items ?? [];
    });
  }

  // Init year form ─────────────────────────────────────────────────────────────

  semesters = this.fb.array([
    this.fb.group({name: ['S1', Validators.required], startDate: ['', Validators.required], endDate: ['', Validators.required]}),
    this.fb.group({name: ['S2', Validators.required], startDate: ['', Validators.required], endDate: ['', Validators.required]}),
  ]);

  offerLines = this.fb.array<ReturnType<typeof this.newOfferLine>>([]);

  initYearForm = this.fb.group({
    name: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isActive: [false],
    semesters: this.semesters,
    offerLines: this.offerLines,
  });

  newOfferLine() {
    return this.fb.group({
      programId: ['', Validators.required],
      levelId: ['', Validators.required],
      capacity: [30, [Validators.required, Validators.min(1)]],
    });
  }

  addSemester() {
    this.semesters.push(this.fb.group({name: [''], startDate: [''], endDate: ['']}));
  }

  removeSemester(i: number) { this.semesters.removeAt(i); }

  addOfferLine() { this.offerLines.push(this.newOfferLine()); }
  removeOfferLine(i: number) { this.offerLines.removeAt(i); }

  submitInitYear() {
    if (this.initYearForm.invalid) return;
    const v = this.initYearForm.value as any;
    const semesters = this.semesters.value
      .map(s => ({
        name: (s?.name ?? '').trim(),
        startDate: s?.startDate ?? '',
        endDate: s?.endDate ?? '',
      }))
      .filter(s => s.name && s.startDate && s.endDate);
    const offers = this.offerLines.value
      .map(o => ({
        programId: o?.programId ?? '',
        levelId: o?.levelId ?? '',
        capacity: Number(o?.capacity ?? 0),
      }))
      .filter(o => o.programId && o.levelId && o.capacity);
    const body = {
      name: v.name,
      startDate: v.startDate,
      endDate: v.endDate,
      isActive: v.isActive,
      semesters,
      offers,
    };
    this.drawerLoading = true;
    this.api.initializeYear(body).subscribe({
      next: () => { this.closeDrawer(); this.loadAcademicData(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  closeYear(year: any) {
    this.confirm.open({
      title: `Clôturer l'année ${year.name} ?`,
      message: 'Cette action est irréversible. L\'année sera archivée.',
      confirmLabel: 'Clôturer',
      danger: true,
    }).subscribe(ok => {
      if (!ok) return;
      this.api.closeYear(year._id).subscribe({
        next: (r) => { alert(`Année ${r.closedYear} clôturée. ${r.archivedStudents} étudiants archivés.`); this.loadAcademicData(); },
        error: (e) => alert(e?.error?.message ?? 'Erreur.'),
      });
    });
  }

  // Calendar events ─────────────────────────────────────────────────────────────

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
    this.api.listCalendarEvents({academicYearId: this.calendarYearId}).subscribe({
      next: ({items}) => { this.calendarEvents = items; },
    });
  }

  submitCalEvent() {
    if (this.calEventForm.invalid) return;
    this.drawerLoading = true;
    this.api.createCalendarEvent(this.calEventForm.value as any).subscribe({
      next: () => { this.closeDrawer(); this.loadCalendarEvents(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  deleteCalEvent(event: CalendarEvent) {
    this.confirm.open({
      title: `Supprimer l'événement "${event.label}" ?`,
      message: 'Cette suppression est définitive.',
      danger: true,
    })
      .subscribe(ok => {
        if (!ok) return;
        this.api.deleteCalendarEvent(event._id).subscribe({next: () => this.loadCalendarEvents()});
      });
  }

  // Offer capacity editor ───────────────────────────────────────────────────────

  editingCapacityOfferId = '';
  editingCapacity = 30;

  startEditCapacity(offer: any) {
    this.editingCapacityOfferId = offer._id;
    this.editingCapacity = offer.capacity;
  }

  saveCapacity() {
    this.api.updateOfferCapacity(this.editingCapacityOfferId, this.editingCapacity).subscribe({
      next: () => { this.editingCapacityOfferId = ''; this.loadAcademicData(); },
      error: (e) => alert(e?.error?.message ?? 'Erreur.'),
    });
  }

  cancelCapacityEdit() { this.editingCapacityOfferId = ''; }

  // ── Finance tab ──────────────────────────────────────────────────────────────

  feeTemplates: FeeTemplate[] = [];
  exemptions: FeeExemption[] = [];
  financialReport: FinancialReport | null = null;
  financeLoading = false;
  financeYearId = '';

  loadFinanceData() {
    this.financeLoading = true;
    forkJoin({
      templates: this.api.listFeeTemplates(),
      report: this.api.getFinancialReport(),
      exemptions: this.api.listExemptions(),
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

  // Fee template form ───────────────────────────────────────────────────────────

  feeInstallments = this.fb.array<ReturnType<typeof this.newInstallmentLine>>([]);

  feeForm = this.fb.group({
    label: ['', Validators.required],
    offerId: ['', Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(1)]],
    currency: ['XOF'],
    acceptedMethods: this.fb.group({
      espece: [true],
      virement: [false],
      orange_money: [false],
      mtn_momo: [false],
      moov_money: [false],
    }),
    feeInstallments: this.feeInstallments,
  });

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
      label: v.label,
      offerId: v.offerId,
      totalAmount: Number(v.totalAmount),
      currency: v.currency || 'XOF',
      acceptedMethods: methods,
      installments: this.feeInstallments.value.map(i => ({
        amount: Number(i.amount),
        label: i.label ?? '',
        dueDate: i.dueDate ?? '',
      })),
    };
    this.drawerLoading = true;
    this.api.createFeeTemplate(body).subscribe({
      next: () => { this.closeDrawer(); this.loadFinanceData(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  // Apply template ──────────────────────────────────────────────────────────────

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
    this.api.applyFeeTemplate(this.selectedTemplateId, ids).subscribe({
      next: (r) => { this.applyTemplateResult = r; this.drawerLoading = false; },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  // Exemptions ──────────────────────────────────────────────────────────────────

  exemptionForm = this.fb.group({
    studentId: ['', Validators.required],
    academicYearId: ['', Validators.required],
    type: ['total', Validators.required],
    percentage: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    reason: ['', Validators.required],
  });

  openExemptionDrawer() {
    this.exemptionForm.reset({type: 'total', percentage: 100});
    if (this.years.length === 0) this.loadAcademicData();
    this.openDrawer('exemption', 'Nouvelle exonération');
  }

  onExemptionTypeChange(type: string) {
    if (type === 'total') this.exemptionForm.patchValue({percentage: 100});
  }

  submitExemption() {
    if (this.exemptionForm.invalid) return;
    this.drawerLoading = true;
    this.api.createExemption(this.exemptionForm.value as any).subscribe({
      next: () => { this.closeDrawer(); this.loadFinanceData(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  deleteExemption(ex: FeeExemption) {
    this.confirm.open({title: 'Supprimer cette exonération ?', message: 'Confirmer la suppression de cette exonération ?', danger: true})
      .subscribe(ok => {
        if (!ok) return;
        this.api.deleteExemption(ex._id).subscribe({next: () => this.loadFinanceData()});
      });
  }

  // ── Communication tab ─────────────────────────────────────────────────────────

  announceResult: {success: boolean; recipientCount: number; sentAt: string} | null = null;
  announcementResult: {success: boolean; message: string; savedAt: string} | null = null;
  announcements: Announcement[] = [];
  editingAnnouncement: Announcement | null = null;

  announceForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    content: ['', [Validators.required, Validators.maxLength(2000)]],
    targetAll: [true],
    targetStudent: [false],
    targetTeacher: [false],
    targetAdmin: [false],
  });

  get isEditingAnnouncement() {
    return !!this.editingAnnouncement;
  }

  openAnnounceDrawer(announcement?: Announcement) {
    if (announcement) {
      this.editingAnnouncement = announcement;
      this.announceForm.reset({
        title: announcement.title,
        content: announcement.body,
        ...this.targetsFromScope(announcement.scope),
      });
      this.announcementResult = null;
      this.openDrawer('announce', 'Modifier l\'annonce officielle');
      return;
    }

    this.editingAnnouncement = null;
    this.announceForm.reset({targetAll: true});
    this.announcementResult = null;
    this.openDrawer('announce', 'Nouvelle annonce officielle');
  }

  submitAnnounce() {
    if (this.announceForm.invalid) return;
    const v = this.announceForm.value as any;
    const scopeResult = this.resolveScope(v);
    if (!scopeResult.ok) {
      this.drawerError = scopeResult.error;
      return;
    }

    this.drawerLoading = true;
    const payload = {
      title: v.title,
      body: v.content,
      scope: scopeResult.scope,
      category: 'official',
    };

    const request$ = this.editingAnnouncement
      ? this.announcementsApi.update(this.editingAnnouncement._id, payload)
      : this.announcementsApi.create(payload);

    request$.subscribe({
      next: () => {
        this.announcementResult = {
          success: true,
          message: this.editingAnnouncement ? 'Annonce mise à jour.' : 'Annonce publiée.',
          savedAt: new Date().toISOString(),
        };
        this.drawerLoading = false;
        this.loadAnnouncements();
      },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  loadAnnouncements() {
    this.announcementsApi.list('official').subscribe({
      next: (items) => { this.announcements = items; },
    });
  }

  editAnnouncement(a: Announcement) {
    this.openAnnounceDrawer(a);
  }

  deleteAnnouncement(a: Announcement) {
    this.confirm.open({title: 'Supprimer cette annonce ?', message: 'Confirmer la suppression de cette annonce ?', danger: true})
      .subscribe(ok => {
        if (!ok) return;
        this.announcementsApi.remove(a._id).subscribe({
          next: () => this.loadAnnouncements(),
        });
      });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  formatNumber(n: number) {
    return new Intl.NumberFormat('fr-FR').format(Math.round(n));
  }

  formatDate(d: string) {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'});
  }

  announcementScopeLabel(scope?: string) {
    const map: Record<string, string> = {
      all: 'Toute la communauté',
      students: 'Étudiants',
      teachers: 'Enseignants',
      group: 'Groupe',
    };
    return map[scope ?? 'all'] ?? scope ?? '—';
  }

  programName(id: string) {
    return this.programs.find(p => p._id === id)?.name ?? id;
  }

  levelName(id: string) {
    return this.levels.find(l => l._id === id)?.name ?? id;
  }

  offerLabel(id: string) {
    const o = this.offers.find(x => x._id === id);
    if (!o) return id;
    return `${this.programName(String(o.programId))} — ${this.levelName(String(o.levelId))}`;
  }

  yearName(id: string) {
    return this.years.find(y => y._id === id)?.name ?? id;
  }

  roleBadgeClass(role: string) {
    return `role-${role?.replace('_', '-')}`;
  }

  roleLabel(role: string) {
    const map: Record<string, string> = {
      super_admin: 'Super Admin', admin: 'Admin',
      teacher: 'Enseignant', external: 'Vacataire', student: 'Étudiant',
    };
    return map[role] ?? role;
  }

  calEventTypeLabel(type: string) {
    return this.calEventTypes.find(t => t.value === type)?.label ?? type;
  }

  // ── Config tab (UC-A06) ───────────────────────────────────────────────────

  smtpConfig: SmtpConfig | null = null;
  systemParams: SystemParams | null = null;
  emailTemplates: EmailTemplate[] = [];
  configLoading = false;
  selectedTemplateKey = '';

  smtpForm = this.fb.group({
    host: ['', Validators.required],
    port: [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
    user: ['', Validators.required],
    from: ['', [Validators.required, Validators.email]],
    secure: [false],
  });

  systemParamsForm = this.fb.group({
    maxStudentsPerGroup: [40, [Validators.required, Validators.min(1)]],
    paymentGraceDays: [7, [Validators.required, Validators.min(0)]],
    supportEmail: ['', [Validators.required, Validators.email]],
    maintenanceMode: [false],
    maxUploadSizeMb: [20, [Validators.required, Validators.min(1)]],
  });

  emailTemplateForm = this.fb.group({
    subject: ['', Validators.required],
    body: ['', Validators.required],
  });

  loadConfigData() {
    this.configLoading = true;
    forkJoin({
      smtp: this.api.getSmtpConfig(),
      params: this.api.getSystemParams(),
      templates: this.api.listEmailTemplates(),
    }).subscribe({
      next: ({smtp, params, templates}) => {
        this.smtpConfig = smtp;
        this.systemParams = params;
        this.emailTemplates = templates;
        if (smtp) {
          this.smtpForm.patchValue(smtp);
        }
        this.systemParamsForm.patchValue(params);
        this.configLoading = false;
      },
      error: () => { this.configLoading = false; },
    });
  }

  openSmtpDrawer() {
    if (this.smtpConfig) this.smtpForm.patchValue(this.smtpConfig);
    this.openDrawer('smtp-config', 'Configuration SMTP');
  }

  submitSmtpConfig() {
    if (this.smtpForm.invalid) return;
    this.drawerLoading = true;
    this.api.updateSmtpConfig(this.smtpForm.value as SmtpConfig).subscribe({
      next: (cfg) => { this.smtpConfig = cfg; this.closeDrawer(); this.loadConfigData(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  openSystemParamsDrawer() {
    if (this.systemParams) this.systemParamsForm.patchValue(this.systemParams);
    this.openDrawer('system-params', 'Paramètres système');
  }

  submitSystemParams() {
    if (this.systemParamsForm.invalid) return;
    this.drawerLoading = true;
    this.api.updateSystemParams(this.systemParamsForm.value as Partial<SystemParams>).subscribe({
      next: (p) => { this.systemParams = p; this.closeDrawer(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  openEmailTemplateDrawer(tmpl?: EmailTemplate) {
    this.selectedTemplateKey = tmpl?.key ?? '';
    this.emailTemplateForm.setValue({
      subject: tmpl?.subject ?? '',
      body: tmpl?.body ?? '',
    });
    const title = tmpl ? `Modifier template — ${tmpl.key}` : 'Nouveau template email';
    this.openDrawer('email-template', title);
  }

  submitEmailTemplate() {
    if (this.emailTemplateForm.invalid || !this.selectedTemplateKey) return;
    this.drawerLoading = true;
    this.api.upsertEmailTemplate(this.selectedTemplateKey, this.emailTemplateForm.value as any).subscribe({
      next: () => { this.closeDrawer(); this.loadConfigData(); },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur.'; this.drawerLoading = false; },
    });
  }

  deleteEmailTemplate(key: string) {
    this.confirm.open({title: `Supprimer le template "${key}" ?`, message: 'Cette action est irréversible.', danger: true})
      .subscribe(ok => {
        if (!ok) return;
        this.api.deleteEmailTemplate(key).subscribe({
          next: () => this.loadConfigData(),
        });
      });
  }

  // ── XLSX import (UC-A02 upgrade) ──────────────────────────────────────────

  xlsxPreview: XlsxParseResult | null = null;
  xlsxLoading = false;

  onXlsxFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.xlsxLoading = true;
    this.xlsxPreview = null;
    this.drawerError = '';
    this.api.parseXlsxFile(file).subscribe({
      next: (result) => { this.xlsxPreview = result; this.xlsxLoading = false; },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur lors du parsing XLSX.'; this.xlsxLoading = false; },
    });
  }

  submitXlsxImport() {
    if (!this.xlsxPreview || this.xlsxPreview.rows.length === 0) return;
    const {offerId, groupId} = this.importForm.value as any;
    if (!offerId || !groupId) { this.drawerError = 'Sélectionnez une offre et un groupe.'; return; }
    this.drawerLoading = true;
    this.api.importStudents(offerId, groupId, this.xlsxPreview.rows).subscribe({
      next: (result) => { this.importResult = result; this.xlsxPreview = null; this.drawerLoading = false; },
      error: (e) => { this.drawerError = e?.error?.message ?? 'Erreur lors de l\'import.'; this.drawerLoading = false; },
    });
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  ngOnInit() {
    this.loadDashboard();
    this.loadAnnouncements();
  }

  private resolveScope(v: any): {ok: true; scope: string} | {ok: false; error: string} {
    if (this.editingAnnouncement) {
      return { ok: true, scope: this.editingAnnouncement.scope ?? 'all' };
    }

    const targetAll = !!v.targetAll;
    const targets = [
      v.targetStudent ? 'student' : null,
      v.targetTeacher ? 'teacher' : null,
      v.targetAdmin ? 'admin' : null,
    ].filter(Boolean) as string[];

    if (targetAll) return { ok: true, scope: 'all' };
    if (targets.length === 0) return { ok: false, error: 'Sélectionnez au moins un groupe cible.' };
    if (targets.length === 1) {
      if (targets[0] === 'student') return { ok: true, scope: 'students' };
      if (targets[0] === 'teacher') return { ok: true, scope: 'teachers' };
      return { ok: false, error: 'Les annonces du portail ne peuvent pas cibler uniquement les administrateurs.' };
    }
    return { ok: true, scope: 'all' };
  }

  private targetsFromScope(scope?: string) {
    if (scope === 'students') {
      return { targetAll: false, targetStudent: true, targetTeacher: false, targetAdmin: false };
    }
    if (scope === 'teachers') {
      return { targetAll: false, targetStudent: false, targetTeacher: true, targetAdmin: false };
    }
    return { targetAll: true, targetStudent: false, targetTeacher: false, targetAdmin: false };
  }
}
