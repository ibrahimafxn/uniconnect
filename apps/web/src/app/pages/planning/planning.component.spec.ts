import {TestBed} from '@angular/core/testing';
import {PlanningComponent} from './planning.component';
import {PlanningApi} from '../../core/api/planning.api';
import {AcademicApi} from '../../core/api/academic.api';
import {UsersApi} from '../../core/api/users.api';
import {AuthService} from '../../core/auth.service';
import {of} from 'rxjs';
import {ReactiveFormsModule} from '@angular/forms';

describe('PlanningComponent', () => {
  const planningMock = () => ({
    listRooms: jasmine.createSpy('listRooms').and.returnValue(of([])),
    listSessions: jasmine.createSpy('listSessions').and.returnValue(of([])),
    createRoom: jasmine.createSpy('createRoom').and.returnValue(of({})),
    updateRoom: jasmine.createSpy('updateRoom').and.returnValue(of({})),
    deleteRoom: jasmine.createSpy('deleteRoom').and.returnValue(of({})),
    createSession: jasmine.createSpy('createSession').and.returnValue(of({})),
    updateSession: jasmine.createSpy('updateSession').and.returnValue(of({})),
    deleteSession: jasmine.createSpy('deleteSession').and.returnValue(of({})),
  });

  const academicMock = () => ({
    listGroups: jasmine.createSpy('listGroups').and.returnValue(of([])),
  });

  const usersMock = () => ({
    listTeachers: jasmine.createSpy('listTeachers').and.returnValue(of([])),
  });

  const authMock = () => ({
    getUserRole: jasmine.createSpy('getUserRole').and.returnValue('admin'),
  });

  function setup() {
    const planning = planningMock();
    const academic = academicMock();
    const users = usersMock();
    const auth = authMock();

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        { provide: PlanningApi, useValue: planning },
        { provide: AcademicApi, useValue: academic },
        { provide: UsersApi, useValue: users },
        { provide: AuthService, useValue: auth },
      ],
    });

    const comp = TestBed.runInInjectionContext(() => new PlanningComponent());
    return { comp, planning, academic, users, auth };
  }

  it('initializes and is admin', () => {
    const { comp } = setup();
    expect(comp.isAdmin).toBe(true);
  });

  it('refresh reloads streams', () => {
    const { comp, planning, academic, users } = setup();
    comp.refresh();
    expect(planning.listRooms).toHaveBeenCalled();
    expect(planning.listSessions).toHaveBeenCalled();
    expect(academic.listGroups).toHaveBeenCalled();
    expect(users.listTeachers).toHaveBeenCalled();
  });

  it('createRoom does nothing when invalid', () => {
    const { comp, planning } = setup();
    comp.roomForm.setValue({ name: '', capacity: 30, location: '' });
    comp.createRoom();
    expect(planning.createRoom).not.toHaveBeenCalled();
  });

  it('createSession does nothing when invalid', () => {
    const { comp, planning } = setup();
    comp.sessionForm.setValue({
      date: '',
      startTime: '',
      endTime: '',
      groupId: '',
      teacherId: '',
      roomId: '',
      label: '',
    });
    comp.createSession();
    expect(planning.createSession).not.toHaveBeenCalled();
  });

  it('createRoom posts and refreshes', () => {
    const { comp, planning } = setup();
    spyOn(comp, 'refresh');
    comp.roomForm.setValue({ name: 'A1', capacity: 30, location: 'B' });
    comp.createRoom();
    expect(planning.createRoom).toHaveBeenCalled();
    expect(comp.refresh).toHaveBeenCalled();
  });

  it('selectRoomForEdit updates form', () => {
    const { comp } = setup();
    comp.selectRoomForEdit({ _id: 'r1', name: 'A1', capacity: 20, location: 'B' });
    expect(comp.editingRoomId).toBe('r1');
    expect(comp.editRoomForm.value).toEqual({ name: 'A1', capacity: 20, location: 'B' });
  });

  it('saveRoomEdit updates and clears editing state', () => {
    const { comp, planning } = setup();
    comp.selectRoomForEdit({ _id: 'r1', name: 'A1', capacity: 20, location: 'B' });
    spyOn(comp, 'refresh');
    comp.editRoomForm.setValue({ name: 'A2', capacity: 25, location: 'C' });
    comp.saveRoomEdit();
    expect(planning.updateRoom).toHaveBeenCalledWith('r1', { name: 'A2', capacity: 25, location: 'C' });
    expect(comp.editingRoomId).toBeNull();
    expect(comp.refresh).toHaveBeenCalled();
  });

  it('saveRoomEdit does nothing without editing id', () => {
    const { comp, planning } = setup();
    comp.editRoomForm.setValue({ name: 'A2', capacity: 25, location: 'C' });
    comp.saveRoomEdit();
    expect(planning.updateRoom).not.toHaveBeenCalled();
  });

  it('cancelEditRoom resets state', () => {
    const { comp } = setup();
    comp.selectRoomForEdit({ _id: 'r1', name: 'A1', capacity: 20, location: 'B' });
    comp.cancelEditRoom();
    expect(comp.editingRoomId).toBeNull();
  });

  it('createSession posts and refreshes', () => {
    const { comp, planning } = setup();
    spyOn(comp, 'refresh');
    comp.sessionForm.setValue({
      date: '2026-03-10',
      startTime: '08:00',
      endTime: '10:00',
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
      label: 'Math',
    });
    comp.createSession();
    expect(planning.createSession).toHaveBeenCalled();
    expect(comp.refresh).toHaveBeenCalled();
  });

  it('selectSessionForEdit formats date', () => {
    const { comp } = setup();
    comp.selectSessionForEdit({
      _id: 's1',
      date: '2026-03-05T00:00:00.000Z',
      startTime: '08:00',
      endTime: '10:00',
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
      label: 'Math',
    });
    expect(comp.editingSessionId).toBe('s1');
    expect(comp.editSessionForm.value?.date).toBe('2026-03-05');
  });

  it('saveSessionEdit updates and clears editing state', () => {
    const { comp, planning } = setup();
    comp.selectSessionForEdit({
      _id: 's1',
      date: '2026-03-05',
      startTime: '08:00',
      endTime: '10:00',
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
      label: 'Math',
    });
    spyOn(comp, 'refresh');
    comp.editSessionForm.setValue({
      date: '2026-03-06',
      startTime: '09:00',
      endTime: '11:00',
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
      label: 'Math 2',
    });
    comp.saveSessionEdit();
    expect(planning.updateSession).toHaveBeenCalled();
    expect(comp.editingSessionId).toBeNull();
    expect(comp.refresh).toHaveBeenCalled();
  });

  it('saveSessionEdit does nothing without editing id', () => {
    const { comp, planning } = setup();
    comp.editSessionForm.setValue({
      date: '2026-03-06',
      startTime: '09:00',
      endTime: '11:00',
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
      label: 'Math 2',
    });
    comp.saveSessionEdit();
    expect(planning.updateSession).not.toHaveBeenCalled();
  });

  it('cancelEditSession resets state', () => {
    const { comp } = setup();
    comp.selectSessionForEdit({
      _id: 's1',
      date: '2026-03-05',
      startTime: '08:00',
      endTime: '10:00',
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
      label: 'Math',
    });
    comp.cancelEditSession();
    expect(comp.editingSessionId).toBeNull();
  });

  it('applyFilters calls listSessions with params', () => {
    const { comp, planning } = setup();
    comp.filterForm.setValue({
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
    });
    comp.applyFilters();
    expect(planning.listSessions).toHaveBeenCalledWith({
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
    });
  });

  it('resetFilters clears form and reloads sessions', () => {
    const { comp, planning } = setup();
    comp.filterForm.setValue({
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
    });
    comp.resetFilters();
    expect(comp.filterForm.value).toEqual({
      dateFrom: null,
      dateTo: null,
      groupId: null,
      teacherId: null,
      roomId: null,
    });
    expect(planning.listSessions).toHaveBeenCalled();
  });

  it('roomName/groupName/teacherEmail fall back to id', () => {
    const { comp } = setup();
    expect(comp.roomName(null, 'r1')).toBe('r1');
    expect(comp.groupName(null, 'g1')).toBe('g1');
    expect(comp.teacherEmail(null, 't1')).toBe('t1');
  });

  it('formatDateForInput handles invalid dates', () => {
    const { comp } = setup();
    expect((comp as any).formatDateForInput('invalid')).toBe('');
    expect((comp as any).formatDateForInput(undefined)).toBe('');
  });

  it('deleteRoom and deleteSession refresh', () => {
    const { comp, planning } = setup();
    spyOn(comp, 'refresh');
    comp.deleteRoom('r1');
    comp.deleteSession('s1');
    expect(planning.deleteRoom).toHaveBeenCalledWith('r1');
    expect(planning.deleteSession).toHaveBeenCalledWith('s1');
    expect(comp.refresh).toHaveBeenCalledTimes(2);
  });
});
