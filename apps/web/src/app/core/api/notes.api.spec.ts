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

  it('listSubjects without levelId calls API without params', () => {
    api.listSubjects().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/subjects');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('createSubject posts payload', () => {
    api.createSubject({ name: 'Math', coefficient: 2, levelId: 'l1' } as any).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/subjects');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 's1' });
  });

  it('updateSubject patches payload', () => {
    api.updateSubject('s1', { name: 'Math' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/subjects/s1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 's1' });
  });

  it('deleteSubject calls API', () => {
    api.deleteSubject('s1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/subjects/s1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ _id: 's1' });
  });

  it('listEvaluations uses params', () => {
    api.listEvaluations('g1', 's1').subscribe();
    const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/api/notes/evaluations');
    expect(req.request.params.get('groupId')).toBe('g1');
    expect(req.request.params.get('subjectId')).toBe('s1');
    req.flush([]);
  });

  it('listEvaluations with only groupId', () => {
    api.listEvaluations('g1').subscribe();
    const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/api/notes/evaluations');
    expect(req.request.params.get('groupId')).toBe('g1');
    expect(req.request.params.get('subjectId')).toBeNull();
    req.flush([]);
  });

  it('listEvaluations with no params', () => {
    api.listEvaluations().subscribe();
    const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/api/notes/evaluations');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('createEvaluation posts payload', () => {
    api.createEvaluation({ title: 'DS1', date: '2026-06-12', subjectId: 's1', groupId: 'g1', maxScore: 20 } as any).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/evaluations');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'e1' });
  });

  it('updateEvaluation patches payload', () => {
    api.updateEvaluation('e1', { title: 'DS2' } as any).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/evaluations/e1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 'e1' });
  });

  it('listGroupStudents calls API', () => {
    api.listGroupStudents('g1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/groups/g1/students');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listGrades calls API', () => {
    api.listGrades('e1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/evaluations/e1/grades');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('upsertGrades posts payload', () => {
    api.upsertGrades('e1', [{ studentId: 'st1', score: 10 }]).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/grades/bulk');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('studentSummary calls API', () => {
    api.studentSummary('st1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/students/st1/summary');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('mySummary calls API', () => {
    api.mySummary().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/notes/students/me/summary');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
