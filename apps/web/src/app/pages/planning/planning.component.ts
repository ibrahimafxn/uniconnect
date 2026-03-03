import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlanningApi } from '../../core/api/planning.api';
import { AcademicApi } from '../../core/api/academic.api';
import { UsersApi } from '../../core/api/users.api';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss'],
})
export class PlanningComponent {
  private readonly fb = inject(FormBuilder);
  private readonly planning = inject(PlanningApi);
  private readonly academic = inject(AcademicApi);
  private readonly users = inject(UsersApi);
  private readonly auth = inject(AuthService);

  rooms$ = this.planning.listRooms();
  sessions$ = this.planning.listSessions();
  groups$ = this.academic.listGroups();
  teachers$ = this.users.listTeachers();
  editingRoomId: string | null = null;
  editingSessionId: string | null = null;
  readonly isAdmin = ['admin', 'super_admin'].includes(this.auth.getUserRole() ?? '');

  roomForm = this.fb.group({
    name: ['', Validators.required],
    capacity: [30, [Validators.required, Validators.min(1)]],
    location: [''],
  });

  editRoomForm = this.fb.group({
    name: ['', Validators.required],
    capacity: [30, [Validators.required, Validators.min(1)]],
    location: [''],
  });

  sessionForm = this.fb.group({
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    groupId: ['', Validators.required],
    teacherId: ['', Validators.required],
    roomId: ['', Validators.required],
    label: [''],
  });

  editSessionForm = this.fb.group({
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    groupId: ['', Validators.required],
    teacherId: ['', Validators.required],
    roomId: ['', Validators.required],
    label: [''],
  });

  filterForm = this.fb.group({
    dateFrom: [''],
    dateTo: [''],
    groupId: [''],
    teacherId: [''],
    roomId: [''],
  });

  refresh() {
    this.rooms$ = this.planning.listRooms();
    this.sessions$ = this.planning.listSessions();
    this.groups$ = this.academic.listGroups();
    this.teachers$ = this.users.listTeachers();
  }

  createRoom() {
    if (this.roomForm.invalid) return;
    this.planning.createRoom(this.roomForm.value as any).subscribe(() => {
      this.roomForm.reset({ capacity: 30 });
      this.refresh();
    });
  }

  selectRoomForEdit(room: any) {
    this.editingRoomId = room._id;
    this.editRoomForm.setValue({
      name: room.name ?? '',
      capacity: room.capacity ?? 30,
      location: room.location ?? '',
    });
  }

  cancelEditRoom() {
    this.editingRoomId = null;
    this.editRoomForm.reset({ capacity: 30 });
  }

  saveRoomEdit() {
    if (!this.editingRoomId || this.editRoomForm.invalid) return;
    this.planning
      .updateRoom(this.editingRoomId, this.editRoomForm.value as any)
      .subscribe(() => {
        this.cancelEditRoom();
        this.refresh();
      });
  }

  createSession() {
    if (this.sessionForm.invalid) return;
    this.planning.createSession(this.sessionForm.value as any).subscribe(() => {
      this.sessionForm.reset();
      this.refresh();
    });
  }

  deleteRoom(id: string) {
    this.planning.deleteRoom(id).subscribe(() => this.refresh());
  }

  deleteSession(id: string) {
    this.planning.deleteSession(id).subscribe(() => this.refresh());
  }

  selectSessionForEdit(session: any) {
    this.editingSessionId = session._id;
    this.editSessionForm.setValue({
      date: this.formatDateForInput(session.date),
      startTime: session.startTime ?? '',
      endTime: session.endTime ?? '',
      groupId: session.groupId ?? '',
      teacherId: session.teacherId ?? '',
      roomId: session.roomId ?? '',
      label: session.label ?? '',
    });
  }

  cancelEditSession() {
    this.editingSessionId = null;
    this.editSessionForm.reset();
  }

  saveSessionEdit() {
    if (!this.editingSessionId || this.editSessionForm.invalid) return;
    this.planning
      .updateSession(this.editingSessionId, this.editSessionForm.value as any)
      .subscribe(() => {
        this.cancelEditSession();
        this.refresh();
      });
  }

  applyFilters() {
    const params = this.filterForm.value as any;
    this.sessions$ = this.planning.listSessions(params);
  }

  resetFilters() {
    this.filterForm.reset();
    this.sessions$ = this.planning.listSessions();
  }

  roomName(rooms: Array<{ _id: string; name: string }> | null, roomId: string) {
    if (!rooms || !roomId) return roomId;
    return rooms.find((room) => room._id === roomId)?.name ?? roomId;
  }

  groupName(groups: Array<{ _id: string; name: string }> | null, groupId: string) {
    if (!groups || !groupId) return groupId;
    return groups.find((group) => group._id === groupId)?.name ?? groupId;
  }

  teacherEmail(
    teachers: Array<{ id: string; email: string }> | null,
    teacherId: string,
  ) {
    if (!teachers || !teacherId) return teacherId;
    return teachers.find((teacher) => teacher.id === teacherId)?.email ?? teacherId;
  }

  private formatDateForInput(value: string | Date | undefined) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }
}
