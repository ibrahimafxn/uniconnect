import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {PlanningApi, Session} from '../../../core/api/planning.api';
import {AcademicApi} from '../../../core/api/academic.api';
import {AttendanceApi, AttendanceEntry, AttendanceStatus} from '../../../core/api/attendance.api';

@Component({
  selector: 'app-teacher-presence',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-presence.component.html',
  styleUrls: ['./teacher-presence.component.scss'],
})
export class TeacherPresenceComponent {
  private readonly planning = inject(PlanningApi);
  private readonly academic = inject(AcademicApi);
  private readonly attendance = inject(AttendanceApi);
  private readonly fb = inject(FormBuilder);

  sessions$ = this.planning.listSessions();
  groups$ = this.academic.listGroups();

  selectedSession: Session | null = null;
  attendanceEntries: AttendanceEntry[] = [];
  loading = false;
  saving = false;
  saveSuccess = false;
  saveError: string | null = null;

  filterForm = this.fb.group({
    dateFrom: [''],
    dateTo: [''],
  });

  applyFilters() {
    const {dateFrom, dateTo} = this.filterForm.value;
    this.sessions$ = this.planning.listSessions({
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
    });
  }

  resetFilters() {
    this.filterForm.reset();
    this.sessions$ = this.planning.listSessions();
  }

  selectSession(session: Session) {
    this.selectedSession = session;
    this.loading = true;
    this.saveSuccess = false;
    this.saveError = null;
    this.attendanceEntries = [];

    this.attendance.getSessionAttendance(session._id).subscribe({
      next: (entries) => {
        this.attendanceEntries = entries.map((e) => ({
          ...e,
          status: e.status ?? 'present',
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  setStatus(studentId: string, status: AttendanceStatus) {
    const entry = this.attendanceEntries.find((e) => e.studentId === studentId);
    if (entry) entry.status = status;
  }

  setNote(studentId: string, note: string) {
    const entry = this.attendanceEntries.find((e) => e.studentId === studentId);
    if (entry) entry.note = note;
  }

  markAll(status: AttendanceStatus) {
    this.attendanceEntries.forEach((e) => (e.status = status));
  }

  save() {
    if (!this.selectedSession) return;
    this.saving = true;
    this.saveSuccess = false;
    this.saveError = null;

    const entries = this.attendanceEntries.map((e) => ({
      studentId: e.studentId,
      status: (e.status ?? 'present') as AttendanceStatus,
      note: e.note ?? undefined,
    }));

    this.attendance.upsertAttendance(this.selectedSession._id, entries).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
        setTimeout(() => (this.saveSuccess = false), 3000);
      },
      error: () => {
        this.saving = false;
        this.saveError = 'Erreur lors de la sauvegarde.';
      },
    });
  }

  groupName(groups: Array<{_id: string; name: string}> | null, groupId: string): string {
    if (!groups) return groupId;
    return groups.find((g) => g._id === groupId)?.name ?? groupId;
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  countByStatus(status: AttendanceStatus): number {
    return this.attendanceEntries.filter((e) => e.status === status).length;
  }

  presentRate(): string {
    const total = this.attendanceEntries.length;
    if (!total) return '—';
    return Math.round((this.countByStatus('present') / total) * 100) + '%';
  }
}
