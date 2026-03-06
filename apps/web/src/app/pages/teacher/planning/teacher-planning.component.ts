import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {PlanningApi} from '../../../core/api/planning.api';
import {AcademicApi} from '../../../core/api/academic.api';

@Component({
  selector: 'app-teacher-planning',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-planning.component.html',
  styleUrls: ['./teacher-planning.component.scss'],
})
export class TeacherPlanningComponent {
  private readonly planning = inject(PlanningApi);
  private readonly academic = inject(AcademicApi);
  private readonly fb = inject(FormBuilder);

  sessions$ = this.planning.listSessions();
  groups$ = this.academic.listGroups();
  rooms$ = this.planning.listRooms();

  filterForm = this.fb.group({
    dateFrom: [''],
    dateTo: [''],
  });

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

  groupName(groups: Array<{_id: string; name: string}> | null, groupId: string): string {
    if (!groups || !groupId) return groupId;
    return groups.find((g) => g._id === groupId)?.name ?? groupId;
  }

  roomName(rooms: Array<{_id: string; name: string}> | null, roomId: string): string {
    if (!rooms || !roomId) return roomId;
    return rooms.find((r) => r._id === roomId)?.name ?? roomId;
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
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
    const today = new Date().toISOString().slice(0, 10);
    return dateStr === today;
  }

  isPast(dateStr: string): boolean {
    return dateStr < new Date().toISOString().slice(0, 10);
  }
}
