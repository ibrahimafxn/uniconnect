import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {PlanningApi} from '../../../core/api/planning.api';
import {NotesApi} from '../../../core/api/notes.api';
import {AuthService} from '../../../core/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  get today(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
