import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {NotesApi} from './notes.api';

describe('NotesApi', () => {
  let api: NotesApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(NotesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listSubjects calls API', () => {
    api.listSubjects('l1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/subjects?levelId=l1');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createSubject posts payload', () => {
    api.createSubject({ name: 'Math', coefficient: 2, levelId: 'l1' } as any).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/subjects');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 's1' });
  });

  it('listEvaluations uses params', () => {
    api.listEvaluations('g1', 's1').subscribe();
    const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/api/notes/evaluations');
    expect(req.request.params.get('groupId')).toBe('g1');
    expect(req.request.params.get('subjectId')).toBe('s1');
    req.flush([]);
  });

  it('upsertGrades posts payload', () => {
    api.upsertGrades('e1', [{ studentId: 'st1', score: 10 }]).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/grades/bulk');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('mySummary calls API', () => {
    api.mySummary().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/students/me/summary');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
