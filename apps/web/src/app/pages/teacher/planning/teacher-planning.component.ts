import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PlanningApi, Session} from '../../../core/api/planning.api';
import {AcademicApi} from '../../../core/api/academic.api';
import {HttpClient} from '@angular/common/http';

type CalendarSlot = {hour: number; sessions: any[]};
type CalendarDay = {date: string; label: string; isToday: boolean; slots: Map<number, any[]>};

@Component({
  selector: 'app-teacher-planning',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-planning.component.html',
  styleUrls: ['./teacher-planning.component.scss'],
})
export class TeacherPlanningComponent {
  private readonly planning = inject(PlanningApi);
  private readonly academic = inject(AcademicApi);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  sessions$ = this.planning.listSessions();

  // Stored locally so a 403 / network error never blocks session rendering
  groups: Array<{_id: string; name: string; [k: string]: any}> = [];
  rooms: Array<{_id: string; name: string}> = [];

  viewMode: 'list' | 'calendar' = 'list';
  compactMode = this.loadCompactMode();
  ultraCompactMode = this.loadUltraCompactMode();

  constructor() {
    this.academic.listGroups().subscribe({
      next: (r: any) => { this.groups = r?.items ?? r ?? []; },
      error: () => { /* teacher may lack permission — degrade gracefully */ },
    });
    this.planning.listRooms().subscribe({
      next: (r) => { this.rooms = r ?? []; },
      error: () => { /* degrade gracefully */ },
    });
  }

  // Cahier de texte
  editingSessionId: string | null = null;
  contentForm = this.fb.group({content: [''], homework: ['']});
  savingContent = false;
  contentSaved = false;

  filterForm = this.fb.group({dateFrom: [''], dateTo: ['']});

  // Calendar state : semaine courante
  currentWeekStart = this.getMonday(new Date());
  readonly hours = Array.from({length: 12}, (_, i) => i + 7); // 7h–18h

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

  applyFilters() {
    const {dateFrom, dateTo} = this.filterForm.value;
    this.sessions$ = this.planning.listSessions({
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
    });
  }

  resetFilters() {
    this.filterForm.reset();
    this.sessions$ = this.planning.listSessions();
  }

  // Calendar navigation
  prevWeek() {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() - 7);
    this.currentWeekStart = d;
  }

  nextWeek() {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() + 7);
    this.currentWeekStart = d;
  }

  goToCurrentWeek() {
    this.currentWeekStart = this.getMonday(new Date());
  }

  getWeekDays(): CalendarDay[] {
    const days: CalendarDay[] = [];
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < 5; i++) {
      const d = new Date(this.currentWeekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'short'}),
        isToday: dateStr === today,
        slots: new Map(),
      });
    }
    return days;
  }

  getWeekRange(): string {
    const end = new Date(this.currentWeekStart);
    end.setDate(end.getDate() + 4);
    return (
      this.currentWeekStart.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}) +
      ' – ' +
      end.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})
    );
  }

  buildCalendar(sessions: any[], days: CalendarDay[]): CalendarDay[] {
    for (const day of days) {
      day.slots = new Map();
    }
    for (const s of sessions) {
      const dateStr = new Date(s.date).toISOString().slice(0, 10);
      const day = days.find((d) => d.date === dateStr);
      if (!day) continue;
      const [h] = (s.startTime ?? '08:00').split(':').map(Number);
      if (!day.slots.has(h)) day.slots.set(h, []);
      day.slots.get(h)!.push(s);
    }
    return days;
  }

  getSlotSessions(day: CalendarDay, hour: number): any[] {
    return day.slots.get(hour) ?? [];
  }

  // Cahier de texte
  openContentEditor(session: Session) {
    this.editingSessionId = session._id;
    this.contentForm.setValue({
      content: (session as any).content ?? '',
      homework: (session as any).homework ?? '',
    });
    this.contentSaved = false;
  }

  closeContentEditor() {
    this.editingSessionId = null;
    this.contentForm.reset();
  }

  saveContent() {
    if (!this.editingSessionId) return;
    this.savingContent = true;
    this.contentSaved = false;
    const {content, homework} = this.contentForm.value;
    this.http.patch(
      `http://localhost:3000/api/planning/sessions/${this.editingSessionId}/content`,
      {content, homework},
    ).subscribe({
      next: () => {
        this.savingContent = false;
        this.contentSaved = true;
        this.sessions$ = this.planning.listSessions();
        setTimeout(() => (this.contentSaved = false), 3000);
      },
      error: () => {
        this.savingContent = false;
      },
    });
  }

  groupName(groupId: string): string {
    if (!groupId) return '—';
    return this.groups.find((g) => g._id === groupId)?.name ?? groupId;
  }

  roomName(roomId: string): string {
    if (!roomId) return '—';
    return this.rooms.find((r) => r._id === roomId)?.name ?? roomId;
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
  }

  groupSessionsByDate(sessions: any[]): Array<{date: string; sessions: any[]}> {
    const map = new Map<string, any[]>();
    for (const s of sessions) {
      const key = new Date(s.date).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([date, items]) => ({date, sessions: items}));
  }

  isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().slice(0, 10);
  }

  isPast(dateStr: string): boolean {
    return dateStr < new Date().toISOString().slice(0, 10);
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
