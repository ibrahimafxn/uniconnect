import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesApi } from '../../../core/api/messages.api';
import { AcademicApi } from '../../../core/api/academic.api';
import { AttendanceApi } from '../../../core/api/attendance.api';

@Component({
  selector: 'app-teacher-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-broadcast.component.html',
  styleUrls: ['./teacher-broadcast.component.scss'],
})
export class TeacherBroadcastComponent {
  private readonly messages = inject(MessagesApi);
  private readonly academic = inject(AcademicApi);
  private readonly attendance = inject(AttendanceApi);

  groups$ = this.academic.listGroups();

  selectedGroupId = '';
  messageContent = '';
  alertThreshold = 30;
  sending = false;
  sent = false;
  recipientCount = 0;
  sendError = '';

  // UC-E04 — Alertes absence
  alerts$ = null as any;
  loadingAlerts = false;

  send() {
    if (!this.selectedGroupId || !this.messageContent.trim()) return;
    this.sending = true;
    this.sent = false;
    this.sendError = '';

    this.messages.broadcastToGroup(this.selectedGroupId, this.messageContent).subscribe({
      next: (res) => {
        this.sending = false;
        this.sent = true;
        this.recipientCount = res.recipientCount;
        this.messageContent = '';
      },
      error: (err) => {
        this.sending = false;
        this.sendError = err?.error?.message ?? 'Erreur lors de l\'envoi.';
      },
    });
  }

  loadAlerts() {
    if (!this.selectedGroupId) return;
    this.loadingAlerts = true;
    this.alerts$ = this.attendance.getAbsenceAlerts(this.selectedGroupId, this.alertThreshold);
    this.alerts$.subscribe(() => (this.loadingAlerts = false));
  }
}
