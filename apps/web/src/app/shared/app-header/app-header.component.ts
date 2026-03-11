import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from '../../core/auth.service';

type NavItem = {label: string; path: string; icon: string};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  isMenuOpen = false;

  private readonly adminNavItems: NavItem[] = [
    {label: 'Dashboard', path: '/dashboard', icon: '⊞'},
    {label: 'Scolarité', path: '/admin', icon: '🏛'},
    {label: 'Administration', path: '/admin-uni', icon: '⚙️'},
    {label: 'Planning', path: '/planning', icon: '📅'},
    {label: 'Notes', path: '/notes', icon: '📊'},
    {label: 'Messagerie', path: '/messages', icon: '💬'},
  ];

  private readonly teacherNavItems: NavItem[] = [
    {label: 'Tableau de bord', path: '/teacher', icon: '⊞'},
    {label: 'Mon Planning', path: '/teacher/planning', icon: '📅'},
    {label: 'Mes Notes', path: '/teacher/notes', icon: '📊'},
    {label: 'Présences', path: '/teacher/presence', icon: '✅'},
    {label: 'Annonces', path: '/teacher/announcements', icon: '📢'},
    {label: 'Statistiques', path: '/teacher/stats', icon: '📈'},
    {label: 'Messagerie', path: '/messages', icon: '💬'},
    {label: 'Mon Profil', path: '/teacher/profile', icon: '👤'},
  ];

  private readonly studentNavItems: NavItem[] = [
    {label: 'Mon Espace', path: '/student', icon: '🎓'},
    {label: 'Messagerie', path: '/messages', icon: '💬'},
  ];

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  get navItems(): NavItem[] {
    const role = this.auth.getUserRole();
    if (role === 'teacher' || role === 'external') return this.teacherNavItems;
    if (role === 'student') return this.studentNavItems;
    return this.adminNavItems;
  }

  get userEmail(): string {
    return this.auth.getUserEmail() ?? 'Utilisateur';
  }

  get userRole(): string {
    const map: Record<string, string> = {
      admin: 'Administrateur', super_admin: 'Super Admin',
      teacher: 'Enseignant', external: 'Vacataire', student: 'Étudiant',
    };
    return map[this.auth.getUserRole() ?? ''] ?? 'Membre';
  }

  get avatarLetter(): string {
    return this.userEmail.slice(0, 1).toUpperCase();
  }

  /** Sidebar handles navigation on all /teacher/* pages — hide header nav there */
  get isTeacherRoute(): boolean {
    return this.router.url.startsWith('/teacher');
  }

  toggleMenu() { this.isMenuOpen = !this.isMenuOpen; }
  closeMenu() { this.isMenuOpen = false; }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
