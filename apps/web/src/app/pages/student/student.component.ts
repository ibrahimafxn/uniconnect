import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { StudentsApi } from '../../core/api/students.api';
import { PlanningApi } from '../../core/api/planning.api';
import { AcademicApi } from '../../core/api/academic.api';
import { NotesApi } from '../../core/api/notes.api';
import { AttendanceApi } from '../../core/api/attendance.api';
import { PaymentsApi } from '../../core/api/payments.api';
import type { PlanStats, PaymentInstallment } from '../../core/api/payments.api';
import { ResourcesApi } from '../../core/api/resources.api';
import { AssignmentsApi } from '../../core/api/assignments.api';
import { DocumentRequestsApi } from '../../core/api/document-requests.api';
import { AnnouncementsApi } from '../../core/api/announcements.api';

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss'],
})
export class StudentComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly students = inject(StudentsApi);
  private readonly planning = inject(PlanningApi);
  private readonly academic = inject(AcademicApi);
  private readonly notes = inject(NotesApi);
  private readonly attendance = inject(AttendanceApi);
  private readonly payments = inject(PaymentsApi);
  private readonly resources = inject(ResourcesApi);
  private readonly assignments = inject(AssignmentsApi);
  private readonly docRequests = inject(DocumentRequestsApi);
  private readonly announcements = inject(AnnouncementsApi);
  private readonly paymentsRefresh$ = new BehaviorSubject<void>(undefined);

  readonly me$ = this.students.getMe();
  readonly notesSummary$ = this.notes.mySummary();
  readonly plan$ = this.paymentsRefresh$.pipe(
    switchMap(() => this.payments.getMyPlan()),
  );
  readonly payments$ = this.paymentsRefresh$.pipe(
    switchMap(() => this.payments.listMyPayments()),
  );
  readonly resources$ = this.resources.list();
  readonly assignments$ = this.assignments.list();
  readonly announcements$ = this.announcements.list();
  readonly calendarEvents$ = this.students.listMyCalendarEvents({
    dateFrom: this.dateShift(-14),
    dateTo: this.dateShift(120),
    limit: 8,
  });
  readonly documents$ = this.students.listMyDocuments(1, 20);
  readonly docRequests$ = this.docRequests.listMine();
  readonly justifications$ = this.attendance.listMyJustifications();

  readonly attendanceSummary$ = this.me$.pipe(
    switchMap((me) => me?._id ? this.attendance.getStudentSummary(me._id) : of(null)),
  );

  readonly sessions$ = this.planning.listSessions({
    dateFrom: this.dateShift(-3),
    dateTo: this.dateShift(14),
  });
  readonly groups$ = this.academic.listGroups();

  planningFilterForm = this.fb.group({
    query: [''],
    dateFrom: [''],
    dateTo: [''],
    groupId: [''],
  });

  planningFiltersOpen = false;
  planningExportsOpen = false;

  calendarFilterForm = this.fb.group({
    type: [''],
  });

  readonly filteredCalendarEvents$ = this.calendarFilterForm.valueChanges.pipe(
    startWith(this.calendarFilterForm.value),
    switchMap((filter) => this.students.listMyCalendarEvents({
      dateFrom: this.dateShift(-14),
      dateTo: this.dateShift(120),
      limit: 8,
      type: (filter.type || undefined) as any,
    })),
  );

  readonly upcomingSessions$ = this.sessions$.pipe(
    map((sessions) => sessions.filter((s) => new Date(s.date).getTime() >= this.today().getTime())),
  );

  readonly todaySessions$ = this.sessions$.pipe(
    map((sessions) => sessions.filter((s) => this.isToday(s.date))),
  );

  readonly filteredSessions$ = combineLatest([
    this.sessions$,
    this.planningFilterForm.valueChanges.pipe(startWith(this.planningFilterForm.value)),
  ]).pipe(
    map(([sessions, filter]) => {
      const query = (filter.query ?? '').toLowerCase().trim();
      const groupId = filter.groupId ?? '';
      const from = filter.dateFrom ? new Date(filter.dateFrom) : null;
      const to = filter.dateTo ? new Date(filter.dateTo) : null;
      return sessions.filter((s) => {
        if (query && !(`${s.label ?? ''}`.toLowerCase().includes(query))) return false;
        if (groupId && s.groupId !== groupId) return false;
        const d = new Date(s.date);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }),
  );

  readonly weekDays = this.buildWeek();
  readonly agendaStartHour = 7;
  readonly agendaEndHour = 21;
  readonly agendaHourHeight = 56;
  readonly agendaHours = Array.from(
    { length: this.agendaEndHour - this.agendaStartHour + 1 },
    (_, i) => this.agendaStartHour + i,
  );
  showNowLine = false;
  nowLineOffset = 0;
  private nowLineTimer: ReturnType<typeof setInterval> | null = null;

  readonly weekSessions$ = this.filteredSessions$.pipe(
    map((sessions) => {
      return this.weekDays.map((day) => ({
        date: day,
        sessions: sessions.filter((s) => this.isSameDate(s.date, day)),
      }));
    }),
  );

  readonly nextSession$ = this.upcomingSessions$.pipe(
    map((sessions) => {
      const sorted = [...sessions].sort((a, b) => this.sessionDateTime(a).getTime() - this.sessionDateTime(b).getTime());
      return sorted[0] ?? null;
    }),
  );

  selectedSession: any | null = null;

  activeTab: 'dashboard' | 'scolarite' | 'planning' | 'pedagogie' | 'finance' | 'services' | 'vie' | 'profile' = 'dashboard';
  compactMode = this.loadCompactMode();
  ultraCompactMode = this.loadUltraCompactMode();
  toastMessage: string | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  profileForm = this.fb.group({
    email: [''],
    phone: [''],
    address: [''],
    notifyEmail: [true],
    notifySms: [true],
    notifyPush: [true],
  });

  paymentForm = this.fb.group({
    planId: [''],
    installmentId: [''],
    amount: [0, [Validators.required, Validators.min(1)]],
    currency: ['XOF', Validators.required],
    provider: ['Orange Money', Validators.required],
    reference: [''],
  });

  docRequestForm = this.fb.group({
    type: ['attestation_scolarite', Validators.required],
    note: [''],
  });

  justificationForm = this.fb.group({
    absenceDate: ['', Validators.required],
    sessionId: [''],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });

  selectedAssignment: string | null = null;
  assignmentFiles = new Map<string, File>();
  assignmentComment = new Map<string, string>();

  profileLoaded = false;
  currentPlan: PlanStats | null = null;

  constructor() {
    this.me$.subscribe((me) => {
      if (!me || this.profileLoaded) return;
      this.profileForm.patchValue({
        email: me.email ?? '',
        phone: me.phone ?? '',
        address: me.address ?? '',
        notifyEmail: me.notificationPrefs?.email ?? true,
        notifySms: me.notificationPrefs?.sms ?? true,
        notifyPush: me.notificationPrefs?.push ?? true,
      }, { emitEvent: false });
      this.profileLoaded = true;
    });

    this.plan$.subscribe((plan) => {
      this.currentPlan = plan;
      const hasPlan = !!plan?.plan;
      const hasInstallments = !!plan?.plan?.installments?.length;
      this.paymentForm.patchValue({
        planId: plan?.plan?._id ?? '',
        currency: plan?.plan?.currency ?? 'XOF',
      }, { emitEvent: false });
      this.updateInstallmentValidators(hasInstallments);
      if (hasPlan && hasInstallments) {
        const nextInst = (plan?.plan?.installments ?? []).find((inst) => {
          const stat = this.installmentStat(plan, inst);
          return stat.status !== 'paid';
        }) ?? plan?.plan?.installments?.[0];
        if (nextInst?._id) {
          const remaining = this.installmentRemaining(plan, nextInst);
          this.paymentForm.patchValue({
            installmentId: String(nextInst._id),
            amount: remaining > 0 ? remaining : nextInst.amount,
          }, { emitEvent: false });
        }
      }
    });

    this.paymentForm.get('installmentId')?.valueChanges.subscribe((instId) => {
      if (!instId || !this.currentPlan?.plan?.installments?.length) return;
      const inst = this.currentPlan.plan.installments.find((i) => String(i._id) === String(instId));
      if (!inst) return;
      const remaining = this.installmentRemaining(this.currentPlan, inst);
      this.paymentForm.patchValue({
        amount: remaining > 0 ? remaining : inst.amount,
      }, { emitEvent: false });
    });
  }

  ngOnInit() {
    this.updateNowLine();
    this.nowLineTimer = setInterval(() => this.updateNowLine(), 60 * 1000);
  }

  ngOnDestroy() {
    if (this.nowLineTimer) clearInterval(this.nowLineTimer);
  }

  saveCompactMode() {
    if (!this.compactMode) {
      this.ultraCompactMode = false;
      this.saveUltraCompactMode(false);
    }
    try {
      localStorage.setItem('ui.compactMode', String(!!this.compactMode));
      localStorage.setItem('student.compactMode', String(!!this.compactMode));
    } catch {
      // ignore storage errors
    }
    this.showToast(this.compactMode ? 'Mode compact activé' : 'Mode compact désactivé');
  }

  saveUltraCompactMode(forceValue?: boolean) {
    if (typeof forceValue === 'boolean') {
      this.ultraCompactMode = forceValue;
    }
    if (this.ultraCompactMode) {
      this.compactMode = true;
      try {
        localStorage.setItem('ui.compactMode', 'true');
        localStorage.setItem('student.compactMode', 'true');
      } catch {
        // ignore storage errors
      }
    }
    try {
      localStorage.setItem('ui.ultraCompactMode', String(!!this.ultraCompactMode));
      localStorage.setItem('student.ultraCompactMode', String(!!this.ultraCompactMode));
    } catch {
      // ignore storage errors
    }
    this.showToast(this.ultraCompactMode ? 'Mode ultra-compact activé' : 'Mode ultra-compact désactivé');
  }

  saveProfile() {
    const raw = this.profileForm.value;
    this.students.updateMe({
      email: raw.email ?? undefined,
      phone: raw.phone ?? undefined,
      address: raw.address ?? undefined,
      notificationPrefs: {
        email: !!raw.notifyEmail,
        sms: !!raw.notifySms,
        push: !!raw.notifyPush,
      },
    }).subscribe();
  }

  setActiveTab(tab: 'dashboard' | 'scolarite' | 'planning' | 'pedagogie' | 'finance' | 'services' | 'vie' | 'profile') {
    this.activeTab = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openDocumentRequest(type: 'releve_notes' | 'attestation_scolarite' | 'certificat_reussite' | 'carte_etudiante' | 'autre') {
    this.docRequestForm.patchValue({ type });
    this.setActiveTab('services');
    setTimeout(() => {
      document.getElementById('student-doc-request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  submitPayment() {
    if (this.paymentForm.invalid) return;
    const raw = this.paymentForm.value as any;
    if (this.currentPlan?.plan?.installments?.length && !raw.installmentId) {
      this.showToast('Veuillez sélectionner une échéance');
      return;
    }
    this.payments.createMyPayment({
      planId: raw.planId || undefined,
      installmentId: raw.installmentId || undefined,
      amount: Number(raw.amount ?? 0),
      currency: raw.currency ?? 'XOF',
      provider: raw.provider || undefined,
      reference: raw.reference || undefined,
    }).subscribe(() => {
      this.paymentForm.patchValue({ amount: 0, reference: '' });
      this.refreshPayments();
      this.showToast('Paiement enregistré');
    });
  }

  submitDocumentRequest() {
    if (this.docRequestForm.invalid) return;
    const raw = this.docRequestForm.value as any;
    this.docRequests.create(raw.type, raw.note || undefined).subscribe(() => {
      this.docRequestForm.patchValue({ note: '' });
    });
  }

  submitJustification(file?: File) {
    if (this.justificationForm.invalid) return;
    const raw = this.justificationForm.value as any;
    this.attendance.createJustification({
      absenceDate: raw.absenceDate,
      sessionId: raw.sessionId || undefined,
      reason: raw.reason,
    }, file).subscribe(() => {
      this.justificationForm.reset();
    });
  }

  onAssignmentFile(id: string, file?: File | null) {
    if (!file) return;
    this.assignmentFiles.set(id, file);
  }

  submitAssignment(id: string) {
    const file = this.assignmentFiles.get(id);
    if (!file) return;
    const comment = this.assignmentComment.get(id);
    this.assignments.submit(id, file, comment).subscribe(() => {
      this.assignmentFiles.delete(id);
      this.assignmentComment.delete(id);
    });
  }

  setAssignmentComment(id: string, value: string) {
    this.assignmentComment.set(id, value);
  }

  trackById(_i: number, item: any) { return item?._id ?? _i; }

  downloadDocUrl(id: string) { return this.students.downloadMyDocument(id); }
  downloadResourceUrl(id: string) { return this.resources.downloadUrl(id); }
  downloadSubmissionUrl(id: string) { return this.assignments.downloadSubmissionUrl(id); }
  downloadAssignmentUrl(id: string) { return this.assignments.downloadAssignmentUrl(id); }
  downloadReceiptUrl(id: string) { return this.payments.receiptUrl(id); }
  downloadJustificationUrl(id: string) { return this.attendance.downloadJustificationUrl(id); }
  planningExportUrl(format: 'pdf' | 'ics') { return this.planning.exportSessionsUrl(format, { dateFrom: this.dateShift(-3), dateTo: this.dateShift(14) }); }
  refreshPayments() { this.paymentsRefresh$.next(); }

  copyPlanningLink() {
    const url = this.planningExportUrl('ics');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => this.showToast('Lien iCal copié'),
        () => this.showToast('Impossible de copier le lien'),
      );
      return;
    }
    this.showToast('Copiez le lien iCal depuis le navigateur');
  }

  openSessionDetails(session: any) {
    this.selectedSession = session;
    setTimeout(() => {
      const el = document.querySelector('.modal') as HTMLElement | null;
      el?.focus();
    });
  }

  closeSessionDetails() {
    this.selectedSession = null;
  }

  onModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeSessionDetails();
    }
    if (event.key === 'Tab') {
      const container = document.querySelector('.modal-card');
      if (!container) return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  groupLabel(groups: any[] | null, groupId: string | undefined) {
    if (!groups || !groupId) return '—';
    return groups.find((g) => g._id === groupId)?.name ?? '—';
  }

  calendarTypeLabel(type: string) {
    switch (type) {
      case 'rentree':
        return 'Rentrée';
      case 'vacances':
        return 'Vacances';
      case 'examens':
        return 'Examens';
      case 'deliberations':
        return 'Délibérations';
      case 'rattrapage':
        return 'Rattrapage';
      default:
        return 'Autre';
    }
  }

  private dateShift(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return this.toLocalDateString(d);
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

  private showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 1800);
  }

  private today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  isToday(date: string) {
    const d = this.parseDate(date);
    const t = this.today();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

  isSameDate(dateA: string, dateB: string) {
    const a = this.parseDate(dateA);
    const b = this.parseDate(dateB);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  daysLeft(date: string) {
    const now = new Date().getTime();
    const due = new Date(date).getTime();
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  }

  installmentStat(plan: PlanStats | null, inst: PaymentInstallment) {
    const key = String(inst._id ?? '');
    return plan?.installmentStats?.[key] ?? { paid: 0, status: 'unpaid' as const };
  }

  installmentRemaining(plan: PlanStats | null, inst: PaymentInstallment) {
    const stat = this.installmentStat(plan, inst);
    return Math.max(0, (inst.amount ?? 0) - (stat.paid ?? 0));
  }

  installmentStatusLabel(status: 'paid' | 'partial' | 'unpaid') {
    if (status === 'paid') return 'Payée';
    if (status === 'partial') return 'Partielle';
    return 'Impayée';
  }

  totalPaid(payments: { amount?: number }[] | null | undefined) {
    if (!payments?.length) return 0;
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  totalRemaining(plan: PlanStats | null, payments: { amount?: number }[] | null | undefined) {
    const total = plan?.plan?.totalAmount || 0;
    return Math.max(0, total - this.totalPaid(payments));
  }

  private updateInstallmentValidators(hasInstallments: boolean) {
    const ctrl = this.paymentForm.get('installmentId');
    if (!ctrl) return;
    if (hasInstallments) {
      ctrl.setValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  timeToSession(date: string, startTime: string): string {
    const target = this.sessionDateTime({ date, startTime } as any);
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return 'En cours';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) {
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return `Dans ${days} j`;
    }
    return `Dans ${hours}h${minutes.toString().padStart(2, '0')}`;
  }

  private sessionDateTime(s: { date: string; startTime: string }) {
    const time = s.startTime ?? '00:00';
    return new Date(`${s.date}T${time}:00`);
  }

  agendaTop(time: string) {
    const startMinutes = this.agendaStartHour * 60;
    const minutes = this.timeToMinutes(time) - startMinutes;
    return Math.max(0, (minutes / 60) * this.agendaHourHeight);
  }

  agendaHeight(startTime: string, endTime: string) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const diff = Math.max(15, end - start);
    return (diff / 60) * this.agendaHourHeight;
  }

  private timeToMinutes(time: string) {
    const [h, m] = (time || '00:00').split(':').map((v) => Number(v));
    return (h || 0) * 60 + (m || 0);
  }

  private updateNowLine() {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = this.agendaStartHour * 60;
    const endMinutes = this.agendaEndHour * 60;
    if (minutes < startMinutes || minutes > endMinutes) {
      this.showNowLine = false;
      return;
    }
    this.showNowLine = true;
    this.nowLineOffset = ((minutes - startMinutes) / 60) * this.agendaHourHeight;
  }

  private buildWeek(): string[] {
    const start = this.today();
    const day = start.getDay(); // 0=Sun, 1=Mon
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    const days: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(this.toLocalDateString(d));
    }
    return days;
  }

  private parseDate(value: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map((v) => Number(v));
      return new Date(y, (m || 1) - 1, d || 1);
    }
    return new Date(value);
  }

  private toLocalDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  sessionKind(label?: string) {
    const text = (label || '').toLowerCase();
    if (text.includes('exam') || text.includes('examen') || text.includes('éxamen')) return 'exam';
    if (text.includes('tp')) return 'tp';
    if (text.includes('td')) return 'td';
    return 'cours';
  }

  sessionKindLabel(kind: string) {
    if (kind === 'exam') return 'Exam';
    if (kind === 'tp') return 'TP';
    if (kind === 'td') return 'TD';
    return 'Cours';
  }
}
