import {Routes} from '@angular/router';
import {authGuard} from '../core/auth.guard';
import {DashboardComponent} from './dashboard/dashboard.component';
import {AdminComponent} from './admin/admin.component';
import {PlanningComponent} from './planning/planning.component';
import {MessagesComponent} from './messages/messages.component';
import {NotesComponent} from './notes/notes.component';
import {SupportComponent} from './support/support.component';

export const GENERAL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {path: 'dashboard', component: DashboardComponent},
      {path: 'admin', component: AdminComponent},
      {path: 'planning', component: PlanningComponent},
      {path: 'messages', component: MessagesComponent},
      {path: 'notes', component: NotesComponent},
      {path: 'support', component: SupportComponent},
    ]
  }
];
