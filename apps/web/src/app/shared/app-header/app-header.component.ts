import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from '../../core/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  isMenuOpen = false;

  private readonly adminNavItems = [
    {label: 'Dashboard', path: '/dashboard'},
    {label: 'Administration', path: '/admin'},
    {label: 'Planning', path: '/planning'},
    {label: 'Messagerie', path: '/messages'},
  ];

  private readonly teacherNavItems = [
    {label: 'Tableau de bord', path: '/teacher'},
    {label: 'Mon Planning', path: '/teacher/planning'},
    {label: 'Mes Notes', path: '/teacher/notes'},
    {label: 'Présences', path: '/teacher/presence'},
    {label: 'Statistiques', path: '/teacher/stats'},
    {label: 'Messagerie', path: '/messages'},
    {label: 'Mon Profil', path: '/teacher/profile'},
  ];

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  get navItems() {
    const role = this.auth.getUserRole();
    return (role === 'teacher' || role === 'external')
      ? this.teacherNavItems
      : this.adminNavItems;
  }

  get userEmail(): string {
    return this.auth.getUserEmail() ?? 'Utilisateur';
  }

  get userRole(): string {
    return this.auth.getUserRole() ?? 'Membre';
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
