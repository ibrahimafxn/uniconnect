import {Routes} from '@angular/router';
import {teacherGuard} from '../../core/teacher.guard';
import {TeacherDashboardComponent} from './dashboard/teacher-dashboard.component';
import {TeacherPlanningComponent} from './planning/teacher-planning.component';
import {TeacherNotesComponent} from './notes/teacher-notes.component';
import {TeacherPresenceComponent} from './presence/teacher-presence.component';
import {TeacherProfilePageComponent} from './profile/teacher-profile-page.component';
import {TeacherStatsComponent} from './stats/teacher-stats.component';
import {TeacherAnnouncementsComponent} from './announcements/teacher-announcements.component';
import {TeacherAssignmentsComponent} from './assignments/teacher-assignments.component';
import {TeacherResourcesComponent} from './resources/teacher-resources.component';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    canActivate: [teacherGuard],
    children: [
      {path: '', component: TeacherDashboardComponent},
      {path: 'planning', component: TeacherPlanningComponent},
      {path: 'notes', component: TeacherNotesComponent},
      {path: 'presence', component: TeacherPresenceComponent},
      {path: 'announcements', component: TeacherAnnouncementsComponent},
      {path: 'assignments', component: TeacherAssignmentsComponent},
      {path: 'resources', component: TeacherResourcesComponent},
      {path: 'profile', component: TeacherProfilePageComponent},
      {path: 'stats', component: TeacherStatsComponent},
    ]
  }
];
