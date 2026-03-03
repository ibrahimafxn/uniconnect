import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {PlanningApi} from './planning.api';

describe('PlanningApi', () => {
  let api: PlanningApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PlanningApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listRooms calls API', () => {
    api.listRooms().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/planning/rooms');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createRoom posts payload', () => {
    api.createRoom({ name: 'A1', capacity: 30, location: 'B' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/planning/rooms');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'r1', name: 'A1', capacity: 30 });
  });

  it('updateRoom patches payload', () => {
    api.updateRoom('r1', { capacity: 40 }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/planning/rooms/r1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 'r1' });
  });

  it('deleteRoom deletes by id', () => {
    api.deleteRoom('r1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/planning/rooms/r1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('listSessions builds query params', () => {
    api
      .listSessions({
        dateFrom: '2026-03-01',
        dateTo: '2026-03-31',
        groupId: 'g1',
        teacherId: 't1',
        roomId: 'r1',
      })
      .subscribe();
    const req = httpMock.expectOne((request) => request.url === 'http://localhost:3000/api/planning/sessions');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('dateFrom')).toBe('2026-03-01');
    expect(req.request.params.get('dateTo')).toBe('2026-03-31');
    expect(req.request.params.get('groupId')).toBe('g1');
    expect(req.request.params.get('teacherId')).toBe('t1');
    expect(req.request.params.get('roomId')).toBe('r1');
    req.flush([]);
  });

  it('listSessions with no params sends empty query', () => {
    api.listSessions().subscribe();
    const req = httpMock.expectOne((request) => request.url === 'http://localhost:3000/api/planning/sessions');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('listSessions with partial params', () => {
    api.listSessions({ groupId: 'g1' }).subscribe();
    const req = httpMock.expectOne((request) => request.url === 'http://localhost:3000/api/planning/sessions');
    expect(req.request.params.get('groupId')).toBe('g1');
    expect(req.request.params.get('teacherId')).toBeNull();
    req.flush([]);
  });

  it('createSession posts payload', () => {
    api
      .createSession({
        date: '2026-03-10',
        startTime: '08:00',
        endTime: '10:00',
        groupId: 'g1',
        teacherId: 't1',
        roomId: 'r1',
        label: 'Math',
      })
      .subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/planning/sessions');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 's1' });
  });

  it('updateSession patches payload', () => {
    api.updateSession('s1', { label: 'Math 2' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/planning/sessions/s1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 's1' });
  });

  it('deleteSession deletes by id', () => {
    api.deleteSession('s1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/planning/sessions/s1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
