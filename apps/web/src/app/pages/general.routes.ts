import {Routes} from '@angular/router';
import {authGuard} from '../core/auth.guard';
import {roleGuard} from '../core/role.guard';
import {DashboardComponent} from './dashboard/dashboard.component';
import {AdminComponent} from './admin/admin.component';
import {PlanningComponent} from './planning/planning.component';
import {MessagesComponent} from './messages/messages.component';
import {NotesComponent} from './notes/notes.component';
import {SupportComponent} from './support/support.component';
import {StudentComponent} from './student/student.component';

export const GENERAL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {path: 'dashboard', component: DashboardComponent, canActivate: [roleGuard(['admin', 'super_admin'])]},
      {path: 'student', component: StudentComponent, canActivate: [roleGuard(['student'])]},
      {path: 'admin', component: AdminComponent, canActivate: [roleGuard(['admin', 'super_admin'])]},
      {path: 'admin-uni', redirectTo: 'admin'},
      {path: 'planning', component: PlanningComponent, canActivate: [roleGuard(['admin', 'super_admin', 'student'])]},
      {path: 'messages', component: MessagesComponent, canActivate: [roleGuard(['admin', 'super_admin', 'student'])]},
      {path: 'notes', component: NotesComponent, canActivate: [roleGuard(['admin', 'super_admin', 'student'])]},
      {path: 'support', component: SupportComponent, canActivate: [roleGuard(['admin', 'super_admin', 'student', 'teacher', 'external'])]},
    ]
  }
];
