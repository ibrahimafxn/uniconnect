import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {AcademicApi} from './academic.api';

describe('AcademicApi', () => {
  let api: AcademicApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AcademicApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listPrograms calls API', () => {
    api.listPrograms(1, 10).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/programs?page=1&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 10, skip: 0 });
  });

  it('listPrograms uses default params', () => {
    api.listPrograms().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/programs?page=1&limit=50');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 50, skip: 0 });
  });

  it('createProgram posts payload', () => {
    api.createProgram({ name: 'Info', code: 'INFO' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/programs');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: '1', name: 'Info', code: 'INFO' });
  });

  it('updateProgram patches payload', () => {
    api.updateProgram('p1', { name: 'Info2' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/programs/p1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 'p1' });
  });

  it('deleteProgram calls API', () => {
    api.deleteProgram('p1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/programs/p1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ _id: 'p1' });
  });

  it('listYears calls API', () => {
    api.listYears(1, 10).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/years?page=1&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 10, skip: 0 });
  });

  it('listYears uses default params', () => {
    api.listYears().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/years?page=1&limit=50');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 50, skip: 0 });
  });

  it('createYear posts payload', () => {
    api
      .createYear({
        name: '2025-2026',
        startDate: '2025-09-01',
        endDate: '2026-07-15',
        isActive: true,
      })
      .subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/years');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'y1' });
  });

  it('updateYear patches payload', () => {
    api.updateYear('y1', { isActive: false }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/years/y1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 'y1' });
  });

  it('deleteYear calls API', () => {
    api.deleteYear('y1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/years/y1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ _id: 'y1' });
  });

  it('listLevels calls API', () => {
    api.listLevels(1, 10).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/levels?page=1&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 10, skip: 0 });
  });

  it('listLevels uses default params', () => {
    api.listLevels().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/levels?page=1&limit=50');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 50, skip: 0 });
  });

  it('createLevel posts payload', () => {
    api.createLevel({ name: 'L1' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/levels');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'l1' });
  });

  it('updateLevel patches payload', () => {
    api.updateLevel('l1', { name: 'L1A' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/levels/l1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 'l1' });
  });

  it('deleteLevel calls API', () => {
    api.deleteLevel('l1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/levels/l1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ _id: 'l1' });
  });

  it('listGroups calls API', () => {
    api.listGroups(1, 10).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/groups?page=1&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 10, skip: 0 });
  });

  it('listGroups uses default params', () => {
    api.listGroups().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/groups?page=1&limit=50');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 50, skip: 0 });
  });

  it('createGroup posts payload', () => {
    api.createGroup({ name: 'G1', offerId: 'o1' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/groups');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'g1' });
  });

  it('updateGroup patches payload', () => {
    api.updateGroup('g1', { name: 'G1A' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/groups/g1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 'g1' });
  });

  it('deleteGroup calls API', () => {
    api.deleteGroup('g1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/academic/groups/g1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ _id: 'g1' });
  });
});
