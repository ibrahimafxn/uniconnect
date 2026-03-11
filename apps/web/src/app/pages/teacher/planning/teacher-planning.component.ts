import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PlanningApi, Session} from '../../../core/api/planning.api';
import {AcademicApi} from '../../../core/api/academic.api';
import {HttpClient} from '@angular/common/http';

type CalendarDay = {date: string; label: string; isToday: boolean; slots: Map<number, any[]>};
type DayGroup    = {date: string; sessions: any[]};

@Component({
  selector: 'app-teacher-planning',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './teacher-planning.component.html',
  styleUrls: ['./teacher-planning.component.scss'],
})
export class TeacherPlanningComponent implements OnInit {
  private readonly planning = inject(PlanningApi);
  private readonly academic = inject(AcademicApi);
  private readonly http     = inject(HttpClient);
  private readonly fb       = inject(FormBuilder);

  // Stored locally so a 403 / network error never blocks session rendering
  groups: Array<{_id: string; name: string; [k: string]: any}> = [];
  rooms:  Array<{_id: string; name: string}> = [];

  sessions:       Session[]   = [];
  groupedSessions: DayGroup[] = [];  // pre-computed for list view
  calendarDays:   CalendarDay[] = []; // pre-computed for calendar view
  loading = false;

  viewMode: 'list' | 'calendar' = 'list';
  compactMode      = this.loadPref('ui.compactMode');
  ultraCompactMode = this.loadPref('ui.ultraCompactMode');

  filterForm = this.fb.group({dateFrom: [''], dateTo: ['']});

  // Calendar – current week
  currentWeekStart = this.getMonday(new Date());
  readonly hours   = Array.from({length: 12}, (_, i) => i + 7); // 7h–18h

  // Cahier de texte
  editingSession: Session | null = null;
  contentForm  = this.fb.group({content: [''], homework: ['']});
  savingContent = false;
  contentSaved  = false;

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

  ngOnInit() { this.loadSessions(); }

  // ─── Session loading ────────────────────────────────────────────────────────

  loadSessions(dateFrom?: string, dateTo?: string) {
    this.loading = true;
    const params: any = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo)   params.dateTo   = dateTo;
    this.planning.listSessions(params).subscribe({
      next: (list) => {
        this.sessions = list;
        this.loading  = false;
        this.recomputeViews();
      },
      error: () => { this.loading = false; },
    });
  }

  applyFilters() {
    const {dateFrom, dateTo} = this.filterForm.value;
    this.loadSessions(dateFrom ?? undefined, dateTo ?? undefined);
  }

  resetFilters() {
    this.filterForm.reset();
    this.loadSessions();
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  get todayCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.sessions.filter(s => new Date(s.date).toISOString().slice(0, 10) === today).length;
  }

  get weekCount(): number {
    const start = this.currentWeekStart.toISOString().slice(0, 10);
    const end   = new Date(this.currentWeekStart);
    end.setDate(end.getDate() + 4);
    const endStr = end.toISOString().slice(0, 10);
    return this.sessions.filter(s => {
      const d = new Date(s.date).toISOString().slice(0, 10);
      return d >= start && d <= endStr;
    }).length;
  }

  // ─── Calendar navigation ─────────────────────────────────────────────────────

  prevWeek() {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() - 7);
    this.currentWeekStart = d;
    this.rebuildCalendar();
  }

  nextWeek() {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() + 7);
    this.currentWeekStart = d;
    this.rebuildCalendar();
  }

  goToCurrentWeek() {
    this.currentWeekStart = this.getMonday(new Date());
    this.rebuildCalendar();
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

  getSlotSessions(day: CalendarDay, hour: number): any[] {
    return day.slots.get(hour) ?? [];
  }

  // ─── Pre-computation ─────────────────────────────────────────────────────────

  /** Called after every session reload OR week navigation. */
  private recomputeViews() {
    this.groupedSessions = this.buildGrouped(this.sessions);
    this.rebuildCalendar();
  }

  private buildGrouped(sessions: any[]): DayGroup[] {
    const map = new Map<string, any[]>();
    for (const s of sessions) {
      const key = new Date(s.date).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([date, items]) => ({date, sessions: items}));
  }

  private rebuildCalendar() {
    const today = new Date().toISOString().slice(0, 10);
    const days: CalendarDay[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(this.currentWeekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date:    dateStr,
        label:   d.toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'short'}),
        isToday: dateStr === today,
        slots:   new Map(),
      });
    }
    for (const s of this.sessions) {
      const dateStr = new Date(s.date).toISOString().slice(0, 10);
      const day = days.find(d => d.date === dateStr);
      if (!day) continue;
      const [h] = (s.startTime ?? '08:00').split(':').map(Number);
      if (!day.slots.has(h)) day.slots.set(h, []);
      day.slots.get(h)!.push(s);
    }
    this.calendarDays = days;
  }

  // ─── Cahier de texte ─────────────────────────────────────────────────────────

  openContentEditor(session: Session) {
    this.editingSession = session;
    this.contentForm.setValue({
      content:  (session as any).content  ?? '',
      homework: (session as any).homework ?? '',
    });
    this.contentSaved = false;
  }

  closeContentEditor() {
    this.editingSession = null;
    this.contentForm.reset();
    this.contentSaved = false;
  }

  saveContent() {
    if (!this.editingSession) return;
    this.savingContent = true;
    this.contentSaved  = false;
    const {content, homework} = this.contentForm.value;
    this.http.patch(
      `http://localhost:3000/api/planning/sessions/${this.editingSession._id}/content`,
      {content, homework},
    ).subscribe({
      next: () => {
        this.savingContent = false;
        this.contentSaved  = true;
        // Update in-place so list/calendar reflect the change instantly
        if (this.editingSession) {
          (this.editingSession as any).content  = content;
          (this.editingSession as any).homework = homework;
        }
        setTimeout(() => {
          this.contentSaved = false;
          this.closeContentEditor();
        }, 1500);
      },
      error: () => { this.savingContent = false; },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  groupName(groupId: string): string {
    if (!groupId) return '—';
    return this.groups.find(g => g._id === groupId)?.name ?? groupId;
  }

  roomName(roomId: string): string {
    if (!roomId) return '—';
    return this.rooms.find(r => r._id === roomId)?.name ?? roomId;
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
  }

  isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().slice(0, 10);
  }

  isPast(dateStr: string): boolean {
    return dateStr < new Date().toISOString().slice(0, 10);
  }

  // ─── Compact-mode prefs ──────────────────────────────────────────────────────

  saveCompactMode() {
    if (!this.compactMode) { this.ultraCompactMode = false; this.savePref('ui.ultraCompactMode', false); }
    this.savePref('ui.compactMode', this.compactMode);
  }

  saveUltraCompactMode(forceValue?: boolean) {
    if (typeof forceValue === 'boolean') this.ultraCompactMode = forceValue;
    if (this.ultraCompactMode) { this.compactMode = true; this.savePref('ui.compactMode', true); }
    this.savePref('ui.ultraCompactMode', this.ultraCompactMode);
  }

  private loadPref(key: string) { try { return localStorage.getItem(key) === 'true'; } catch { return false; } }
  private savePref(key: string, v: boolean) { try { localStorage.setItem(key, String(v)); } catch {} }

  private getMonday(date: Date): Date {
    const d   = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
