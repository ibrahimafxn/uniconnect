import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';

type NavItem = {label: string; path: string; icon: string; exact?: boolean};

@Component({
  selector: 'app-teacher-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-shell.component.html',
  styleUrl: './teacher-shell.component.scss',
})
export class TeacherShellComponent {
  readonly navItems: NavItem[] = [
    {label: 'Tableau de bord', path: '/teacher',              icon: '⊞', exact: true},
    {label: 'Mon Planning',    path: '/teacher/planning',     icon: '📅'},
    {label: 'Mes Notes',       path: '/teacher/notes',        icon: '📊'},
    {label: 'Présences',       path: '/teacher/presence',     icon: '✅'},
    {label: 'Devoirs',         path: '/teacher/assignments',  icon: '📝'},
    {label: 'Ressources',      path: '/teacher/resources',    icon: '📁'},
    {label: 'Annonces',        path: '/teacher/announcements',icon: '📢'},
    {label: 'Statistiques',    path: '/teacher/stats',        icon: '📈'},
    {label: 'Messagerie',      path: '/messages',             icon: '💬'},
    {label: 'Mon Profil',      path: '/teacher/profile',      icon: '👤'},
  ];
}
