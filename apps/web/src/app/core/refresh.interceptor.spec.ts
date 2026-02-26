import {TestBed} from '@angular/core/testing';
import {HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {refreshInterceptor} from './refresh.interceptor';
import {AuthService} from './auth.service';
import {of, throwError} from 'rxjs';

describe('refreshInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  let logoutSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            getRefreshToken: () => 'r',
            refresh: () => of({ accessToken: 'a', refreshToken: 'r' }),
            getAccessToken: () => 'a',
            logout: () => of({ success: true }),
          },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    logoutSpy = spyOn(authService, 'logout').and.returnValue(of({ success: true }));
  });

  afterEach(() => httpMock.verify());

  it('retries request after refresh on 401', () => {
    http.get('/secure').subscribe();

    const req1 = httpMock.expectOne('/secure');
    req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    const req2 = httpMock.expectOne('/secure');
    expect(req2.request.headers.get('Authorization')).toBe('Bearer a');
    req2.flush({ ok: true });
  });

  it('logs out on refresh failure', () => {
    (authService.refresh as any) = () => throwError(() => new HttpErrorResponse({ status: 401 }));

    http.get('/secure').subscribe({ error: () => {} });
    const req1 = httpMock.expectOne('/secure');
    req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
  });

  it('logs out when no refresh token', () => {
    (authService.getRefreshToken as any) = () => null;
    http.get('/secure2').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/secure2');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('passes through non-401 errors', (done) => {
    http.get('/secure3').subscribe({
      error: (err) => {
        expect(err.status).toBe(403);
        done();
      },
    });

    const req = httpMock.expectOne('/secure3');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
  });

  it('errors if access token missing after refresh', (done) => {
    (authService.getAccessToken as any) = () => null;
    http.get('/secure4').subscribe({
      error: (err) => {
        expect(err).toBeTruthy();
        done();
      },
    });

    const req1 = httpMock.expectOne('/secure4');
    req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });
});
