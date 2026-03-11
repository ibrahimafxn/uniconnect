import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AnnouncementsApi, Announcement} from '../../../core/api/announcements.api';

@Component({
  selector: 'app-teacher-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-announcements.component.html',
  styleUrls: ['./teacher-announcements.component.scss'],
})
export class TeacherAnnouncementsComponent {
  private readonly announcementsApi = inject(AnnouncementsApi);

  readonly categories = [
    {value: '', label: 'Toutes'},
    {value: 'official', label: 'Officielles'},
    {value: 'event', label: 'Événements'},
    {value: 'internship', label: 'Stages'},
    {value: 'service', label: 'Services'},
  ];
  selectedCategory = '';
  announcements$ = this.announcementsApi.list();
  compactMode = this.loadCompactMode();
  ultraCompactMode = this.loadUltraCompactMode();

  filterCategory(cat: string) {
    this.selectedCategory = cat;
    this.announcements$ = this.announcementsApi.list(cat || undefined);
  }

  saveCompactMode() {
    if (!this.compactMode) {
      this.ultraCompactMode = false;
      this.saveUltraCompactMode(false);
    }
    try {
      localStorage.setItem('ui.compactMode', String(!!this.compactMode));
    } catch {
      // ignore storage errors
    }
  }

  saveUltraCompactMode(forceValue?: boolean) {
    if (typeof forceValue === 'boolean') {
      this.ultraCompactMode = forceValue;
    }
    if (this.ultraCompactMode) {
      this.compactMode = true;
      try {
        localStorage.setItem('ui.compactMode', 'true');
      } catch {
        // ignore storage errors
      }
    }
    try {
      localStorage.setItem('ui.ultraCompactMode', String(!!this.ultraCompactMode));
    } catch {
      // ignore storage errors
    }
  }

  private loadCompactMode(): boolean {
    try {
      const raw = localStorage.getItem('ui.compactMode') ?? localStorage.getItem('student.compactMode');
      return raw === 'true';
    } catch {
      return false;
    }
  }

  private loadUltraCompactMode(): boolean {
    try {
      const raw = localStorage.getItem('ui.ultraCompactMode') ?? localStorage.getItem('student.ultraCompactMode');
      return raw === 'true';
    } catch {
      return false;
    }
  }

  formatDate(d?: string) {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'});
  }

  scopeLabel(scope?: string) {
    const map: Record<string, string> = {
      all: 'Toute la communauté',
      students: 'Étudiants',
      teachers: 'Enseignants',
      group: 'Groupe',
    };
    return map[scope ?? 'all'] ?? scope ?? '—';
  }

  categoryLabel(category?: string) {
    const map: Record<string, string> = {
      official: 'Officielle',
      event: 'Événement',
      internship: 'Stage',
      service: 'Service',
    };
    return map[category ?? 'official'] ?? category ?? '—';
  }

  trackById(_: number, item: Announcement) {
    return item._id;
  }
}
