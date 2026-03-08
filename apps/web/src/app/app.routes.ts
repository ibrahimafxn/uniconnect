import {Routes} from '@angular/router';
import {LoginComponent} from './pages/login/login.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {AdminComponent} from './pages/admin/admin.component';
import {PlanningComponent} from './pages/planning/planning.component';
import {MessagesComponent} from './pages/messages/messages.component';
import {NotesComponent} from './pages/notes/notes.component';
import {SupportComponent} from './pages/support/support.component';
import {TeacherDashboardComponent} from './pages/teacher/dashboard/teacher-dashboard.component';
import {TeacherPlanningComponent} from './pages/teacher/planning/teacher-planning.component';
import {TeacherNotesComponent} from './pages/teacher/notes/teacher-notes.component';
import {TeacherPresenceComponent} from './pages/teacher/presence/teacher-presence.component';
import {TeacherProfilePageComponent} from './pages/teacher/profile/teacher-profile-page.component';
import {TeacherStatsComponent} from './pages/teacher/stats/teacher-stats.component';
import {TeacherResourcesComponent} from './pages/teacher/resources/teacher-resources.component';
import {TeacherJuryComponent} from './pages/teacher/jury/teacher-jury.component';
import {TeacherInterventionsComponent} from './pages/teacher/interventions/teacher-interventions.component';
import {TeacherBroadcastComponent} from './pages/teacher/broadcast/teacher-broadcast.component';
import {TeacherExportComponent} from './pages/teacher/export/teacher-export.component';
import {authGuard} from './core/auth.guard';
import {teacherGuard} from './core/teacher.guard';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},

  // Routes enseignant
  {path: 'teacher', component: TeacherDashboardComponent, canActivate: [teacherGuard]},
  {path: 'teacher/planning', component: TeacherPlanningComponent, canActivate: [teacherGuard]},
  {path: 'teacher/notes', component: TeacherNotesComponent, canActivate: [teacherGuard]},
  {path: 'teacher/presence', component: TeacherPresenceComponent, canActivate: [teacherGuard]},
  {path: 'teacher/profile', component: TeacherProfilePageComponent, canActivate: [teacherGuard]},
  {path: 'teacher/stats', component: TeacherStatsComponent, canActivate: [teacherGuard]},
  // UC-E02 — Dépôt de ressources pédagogiques
  {path: 'teacher/resources', component: TeacherResourcesComponent, canActivate: [teacherGuard]},
  // UC-E05 — Jury & délibération
  {path: 'teacher/jury', component: TeacherJuryComponent, canActivate: [teacherGuard]},
  // UC-E06 — Feuilles d'intervention vacataires
  {path: 'teacher/interventions', component: TeacherInterventionsComponent, canActivate: [teacherGuard]},
  // UC-E07 & UC-E04 — Broadcast groupe + alertes absences
  {path: 'teacher/broadcast', component: TeacherBroadcastComponent, canActivate: [teacherGuard]},
  // UC-E08 — Export planning PDF/iCal
  {path: 'teacher/export', component: TeacherExportComponent, canActivate: [teacherGuard]},

  // Routes admin / générales
  {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
  {path: 'admin', component: AdminComponent, canActivate: [authGuard]},
  {path: 'planning', component: PlanningComponent, canActivate: [authGuard]},
  {path: 'messages', component: MessagesComponent, canActivate: [authGuard]},
  {path: 'notes', component: NotesComponent, canActivate: [authGuard]},
  {path: 'support', component: SupportComponent, canActivate: [authGuard]},

  {path: '', pathMatch: 'full', redirectTo: 'dashboard'},
  {path: '**', redirectTo: 'dashboard'},
];
