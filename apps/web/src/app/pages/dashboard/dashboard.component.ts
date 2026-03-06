import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {forkJoin} from 'rxjs';
import {StudentsApi} from '../../core/api/students.api';
import {UsersApi} from '../../core/api/users.api';
import {PaymentsApi} from '../../core/api/payments.api';
import {PlanningApi} from '../../core/api/planning.api';
import {AcademicApi} from '../../core/api/academic.api';
import {AuthService} from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private readonly students = inject(StudentsApi);
  private readonly users = inject(UsersApi);
  private readonly payments = inject(PaymentsApi);
  private readonly planning = inject(PlanningApi);
  private readonly academic = inject(AcademicApi);
  private readonly auth = inject(AuthService);

  readonly userName = this.auth.getUserEmail() ?? 'Administrateur';
  readonly today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  kpis = { students: 0, teachers: 0, unpaid: 0, sessions: 0, groups: 0 };
  recentUnpaid: any[] = [];
  upcomingSessions: any[] = [];
  loadingKpis = true;

  readonly quickLinks = [
    {label: 'Administration', desc: 'Étudiants, dossiers, paiements', path: '/admin', color: 'orange'},
    {label: 'Planning', desc: 'Créer et consulter les EDT', path: '/planning', color: 'teal'},
    {label: 'Messagerie', desc: 'Conversations internes', path: '/messages', color: 'blue'},
    {label: 'Notes', desc: 'Évaluations et moyennes', path: '/notes', color: 'purple'},
  ];

  constructor() {
    this.loadKpis();
  }

  private loadKpis() {
    const today = new Date().toISOString().slice(0, 10);
    forkJoin({
      students: this.students.listStudents('', 1, 1),
      teachers: this.users.listTeachers(),
      unpaid: this.payments.listUnpaid(),
      sessions: this.planning.listSessions({dateFrom: today}),
      groups: this.academic.listGroups(),
    }).subscribe({
      next: ({students, teachers, unpaid, sessions, groups}) => {
        this.kpis = {
          students: students.total ?? 0,
          teachers: teachers.length,
          unpaid: unpaid.length,
          sessions: sessions.length,
          groups: groups.items?.length ?? 0,
        };
        this.recentUnpaid = unpaid.slice(0, 5);
        this.upcomingSessions = sessions.slice(0, 5);
        this.loadingKpis = false;
      },
      error: () => { this.loadingKpis = false; },
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
  }
}
