import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {StudentsApi} from './students.api';

describe('StudentsApi', () => {
  let api: StudentsApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(StudentsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listStudents calls API with search', () => {
    api.listStudents('john', 1, 10).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students?page=1&limit=10&q=john');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 10, skip: 0 });
  });

  it('listStudents without search', () => {
    api.listStudents('', 1, 10).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students?page=1&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 10, skip: 0 });
  });

  it('createStudent posts payload', () => {
    const year = new Date().getFullYear();
    api.createStudent({
      firstName: 'John',
      lastName: 'Doe',
      studentNumber: `ML103DJ${year}`,
      gender: 'male',
      birthDate: '2004-03-15',
      status: 'active',
      groupId: 'g1',
      academicYearId: 'y1',
    }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: '1' });
  });

  it('updateStudent patches payload', () => {
    api.updateStudent('1', { status: 'suspended' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students/1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: '1' });
  });

  it('deleteStudent calls delete', () => {
    api.deleteStudent('1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ _id: '1' });
  });

  it('listEnrollments calls API', () => {
    api.listEnrollments(1, 10).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students/enrollments?page=1&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 10, skip: 0 });
  });

  it('listEnrollments uses default params', () => {
    api.listEnrollments().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students/enrollments?page=1&limit=50');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 50, skip: 0 });
  });

  it('createEnrollment posts payload', () => {
    api
      .createEnrollment({
        studentId: 's1',
        academicYearId: 'y1',
        status: 'pending',
      })
      .subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students/enrollments');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'e1' });
  });

  it('listStudentDocuments calls API', () => {
    api.listStudentDocuments('s1', 1, 20).subscribe();
    const req = httpMock.expectOne(
      'http://localhost:3000/api/students/s1/documents?page=1&limit=20',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 20, skip: 0 });
  });

  it('listStudentDocuments uses default params', () => {
    api.listStudentDocuments('s1').subscribe();
    const req = httpMock.expectOne(
      'http://localhost:3000/api/students/s1/documents?page=1&limit=20',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, limit: 20, skip: 0 });
  });

  it('uploadStudentDocument posts formdata', () => {
    const file = new File(['hello'], 'doc.pdf', { type: 'application/pdf' });
    api.uploadStudentDocument('s1', file, 'Inscription').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students/s1/documents');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({ _id: 'd1' });
  });

  it('uploadStudentDocument without label', () => {
    const file = new File(['hello'], 'doc.pdf', { type: 'application/pdf' });
    api.uploadStudentDocument('s1', file).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students/s1/documents');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('label')).toBeNull();
    req.flush({ _id: 'd1' });
  });

  it('downloadStudentDocument returns url', () => {
    const url = api.downloadStudentDocument('d1');
    expect(url).toBe('http://localhost:3000/api/students/documents/d1/download');
  });

  it('deleteStudentDocument calls delete', () => {
    api.deleteStudentDocument('d1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students/documents/d1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('updateStudentDocument patches payload', () => {
    api.updateStudentDocument('d1', { label: 'Bulletin' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/students/documents/d1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ _id: 'd1' });
  });
});
