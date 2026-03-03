import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {AuthService} from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login stores tokens', () => {
    service.login('a@b.c', 'password123').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 'a', refreshToken: 'r' });

    expect(localStorage.getItem('accessToken')).toBe('a');
    expect(localStorage.getItem('refreshToken')).toBe('r');
  });

  it('logout clears tokens', () => {
    localStorage.setItem('accessToken', 'a');
    localStorage.setItem('refreshToken', 'r');

    service.logout().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/auth/logout');
    req.flush({ success: true });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('refresh stores tokens', () => {
    localStorage.setItem('refreshToken', 'r');
    service.refresh().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 'a2', refreshToken: 'r2' });

    expect(localStorage.getItem('accessToken')).toBe('a2');
    expect(localStorage.getItem('refreshToken')).toBe('r2');
  });

  it('isLoggedIn returns false without token', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('getUserRole and getUserEmail decode token payload', () => {
    const payload = btoa(JSON.stringify({ role: 'admin', email: 'a@b.c' })).replace(/\+/g, '-').replace(/\//g, '_');
    localStorage.setItem('accessToken', `header.${payload}.sig`);
    expect(service.getUserRole()).toBe('admin');
    expect(service.getUserEmail()).toBe('a@b.c');
  });

  it('getUserRole returns null for invalid token', () => {
    localStorage.setItem('accessToken', 'invalid-token');
    expect(service.getUserRole()).toBeNull();
  });
});
