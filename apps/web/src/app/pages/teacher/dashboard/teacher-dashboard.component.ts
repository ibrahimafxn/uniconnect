import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {map, shareReplay} from 'rxjs/operators';
import {PlanningApi, Session} from '../../../core/api/planning.api';
import {NotesApi} from '../../../core/api/notes.api';
import {AssignmentsApi} from '../../../core/api/assignments.api';
import {AuthService} from '../../../core/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss'],
})
export class TeacherDashboardComponent {
  private readonly planning     = inject(PlanningApi);
  private readonly notes        = inject(NotesApi);
  private readonly assignments  = inject(AssignmentsApi);
  readonly auth = inject(AuthService);

  readonly email    = this.auth.getUserEmail() ?? 'Enseignant';
  readonly role     = this.auth.getUserRole() ?? 'teacher';
  readonly isExternal = this.role === 'external';

  // Share one HTTP call, used multiple times via async pipe
  readonly sessions$     = this.planning.listSessions().pipe(shareReplay(1));
  readonly subjects$     = this.notes.listSubjects();
  readonly evaluations$  = this.notes.listEvaluations();
  readonly assignments$  = this.assignments.list();

  // Today's date strings
  get today(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  get todayISO(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // ── Session helpers ────────────────────────────────────────────────────────

  todaySessions(sessions: Session[]): Session[] {
    return sessions
      .filter(s => this.dateStr(s.date) === this.todayISO)
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
  }

  upcomingSessions(sessions: Session[]): Session[] {
    return sessions
      .filter(s => this.dateStr(s.date) > this.todayISO)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }

  private dateStr(d: string | Date): string {
    return new Date(d).toISOString().slice(0, 10);
  }

  // ── Compact mode ──────────────────────────────────────────────────────────

  compactMode      = this.loadPref('ui.compactMode');
  ultraCompactMode = this.loadPref('ui.ultraCompactMode');

  saveCompactMode() {
    if (!this.compactMode) { this.ultraCompactMode = false; this.savePref('ui.ultraCompactMode', false); }
    this.savePref('ui.compactMode', this.compactMode);
  }

  saveUltraCompactMode(v?: boolean) {
    if (typeof v === 'boolean') this.ultraCompactMode = v;
    if (this.ultraCompactMode) { this.compactMode = true; this.savePref('ui.compactMode', true); }
    this.savePref('ui.ultraCompactMode', this.ultraCompactMode);
  }

  private loadPref(key: string): boolean { try { return localStorage.getItem(key) === 'true'; } catch { return false; } }
  private savePref(key: string, v: boolean) { try { localStorage.setItem(key, String(v)); } catch {} }
}
