import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {UsersApi} from './users.api';

describe('UsersApi', () => {
  let api: UsersApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(UsersApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listTeachers calls API', () => {
    api.listTeachers().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/users/teachers');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
