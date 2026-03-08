import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { StudentsApi } from '../../core/api/students.api';
import { PlanningApi } from '../../core/api/planning.api';
import { AcademicApi } from '../../core/api/academic.api';
import { NotesApi } from '../../core/api/notes.api';
import { AttendanceApi } from '../../core/api/attendance.api';
import { PaymentsApi } from '../../core/api/payments.api';
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
export class StudentComponent {
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

  readonly me$ = this.students.getMe();
  readonly notesSummary$ = this.notes.mySummary();
  readonly plan$ = this.payments.getMyPlan();
  readonly payments$ = this.payments.listMyPayments();
  readonly resources$ = this.resources.list();
  readonly assignments$ = this.assignments.list();
  readonly announcements$ = this.announcements.list();
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

  activeTab: 'dashboard' | 'planning' | 'resources' | 'assignments' | 'notes' | 'attendance' | 'finance' | 'documents' | 'campus' | 'profile' = 'dashboard';
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
      if (!plan?.plan) return;
      this.paymentForm.patchValue({
        planId: plan.plan._id,
        currency: plan.plan.currency ?? 'XOF',
      }, { emitEvent: false });
    });
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

  submitPayment() {
    if (this.paymentForm.invalid) return;
    const raw = this.paymentForm.value as any;
    this.payments.createMyPayment({
      planId: raw.planId || undefined,
      installmentId: raw.installmentId || undefined,
      amount: Number(raw.amount ?? 0),
      currency: raw.currency ?? 'XOF',
      provider: raw.provider || undefined,
      reference: raw.reference || undefined,
    }).subscribe(() => {
      this.paymentForm.patchValue({ amount: 0, reference: '' });
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

  private dateShift(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
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
    const d = new Date(date);
    const t = this.today();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

  isSameDate(dateA: string, dateB: string) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  daysLeft(date: string) {
    const now = new Date().getTime();
    const due = new Date(date).getTime();
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
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

  private buildWeek(): string[] {
    const start = this.today();
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }
}
