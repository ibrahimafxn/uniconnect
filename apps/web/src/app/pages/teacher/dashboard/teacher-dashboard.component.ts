import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {PlanningApi} from '../../../core/api/planning.api';
import {NotesApi} from '../../../core/api/notes.api';
import {AuthService} from '../../../core/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss'],
})
export class TeacherDashboardComponent {
  private readonly planning = inject(PlanningApi);
  private readonly notes = inject(NotesApi);
  readonly auth = inject(AuthService);

  readonly email = this.auth.getUserEmail() ?? 'Enseignant';
  readonly role = this.auth.getUserRole() ?? 'teacher';

  sessions$ = this.planning.listSessions();
  subjects$ = this.notes.listSubjects();
  evaluations$ = this.notes.listEvaluations();

  get todayISO(): string {
    const d = new Date();
    return d.getFullYear() + '-'
      + String(d.getMonth() + 1).padStart(2, '0') + '-'
      + String(d.getDate()).padStart(2, '0');
  }

  private dateStr(d: string | Date): string {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.getFullYear() + '-'
      + String(dt.getMonth() + 1).padStart(2, '0') + '-'
      + String(dt.getDate()).padStart(2, '0');
  }

  upcomingSessions(sessions: any[]): any[] {
    return sessions
      .filter(s => this.dateStr(s.date) >= this.todayISO)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }

  compactMode = this.loadCompactMode();
  ultraCompactMode = this.loadUltraCompactMode();

  get today(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
