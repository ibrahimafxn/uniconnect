import {Routes} from '@angular/router';
import {LoginComponent} from './pages/login/login.component';
import {ApplyComponent} from './pages/apply/apply.component';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'apply', component: ApplyComponent},

  // Lazy-loaded teacher routes
  {
    path: 'teacher',
    loadChildren: () => import('./pages/teacher/teacher.routes').then(m => m.TEACHER_ROUTES)
  },

  // Lazy-loaded general/admin routes
  {
    path: '',
    loadChildren: () => import('./pages/general.routes').then(m => m.GENERAL_ROUTES)
  },

  {path: '', pathMatch: 'full', redirectTo: 'dashboard'},
  {path: '**', redirectTo: 'dashboard'},
];
