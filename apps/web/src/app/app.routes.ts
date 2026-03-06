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
import {authGuard} from './core/auth.guard';
import {teacherGuard} from './core/teacher.guard';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},

  // Routes enseignant
  {path: 'teacher', component: TeacherDashboardComponent, canActivate: [teacherGuard]},
  {path: 'teacher/planning', component: TeacherPlanningComponent, canActivate: [teacherGuard]},
  {path: 'teacher/notes', component: TeacherNotesComponent, canActivate: [teacherGuard]},

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
