import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {AuthService} from '../../../core/auth.service';

type NavSection = {
  label: string;
  items: {icon: string; label: string; path: string}[];
};

@Component({
  selector: 'app-teacher-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-shell.component.html',
  styleUrl: './teacher-shell.component.scss',
})
export class TeacherShellComponent {
  readonly auth = inject(AuthService);

  readonly email        = this.auth.getUserEmail() ?? '';
  readonly isExternal   = this.auth.getUserRole() === 'external';
  readonly avatarLetter = this.email.slice(0, 1).toUpperCase();
  readonly roleLabel    = this.isExternal ? 'Vacataire' : 'Enseignant';

  readonly navSections: NavSection[] = [
    {
      label: 'Enseignement',
      items: [
        {icon: '📅', label: 'Planning',    path: '/teacher/planning'},
        {icon: '✏️', label: 'Notes',       path: '/teacher/notes'},
        {icon: '✅', label: 'Présences',   path: '/teacher/presence'},
      ],
    },
    {
      label: 'Pédagogie',
      items: [
        {icon: '📝', label: 'Devoirs',     path: '/teacher/assignments'},
        {icon: '📁', label: 'Ressources',  path: '/teacher/resources'},
      ],
    },
    {
      label: 'Analyse',
      items: [
        {icon: '📊', label: 'Statistiques', path: '/teacher/stats'},
      ],
    },
    {
      label: 'Communication',
      items: [
        {icon: '💬', label: 'Messagerie', path: '/messages'},
        {icon: '📢', label: 'Annonces',   path: '/teacher/announcements'},
      ],
    },
  ];
}
