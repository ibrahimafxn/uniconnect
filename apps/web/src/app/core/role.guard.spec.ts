import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {roleGuard} from './role.guard';
import {AuthService} from './auth.service';

describe('roleGuard', () => {
  it('allows when role is allowed', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => true, getUserRole: () => 'student' } },
        { provide: Router, useValue: { parseUrl: () => ({}) } },
      ],
    });

    const guard = roleGuard(['student']);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('redirects to login when not logged in', () => {
    const urlTree = { url: '/login' } as any;
    const router = { parseUrl: jasmine.createSpy('parseUrl').and.returnValue(urlTree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
        { provide: Router, useValue: router },
      ],
    });

    const guard = roleGuard(['admin']);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(router.parseUrl).toHaveBeenCalledWith('/login');
    expect(result).toBe(urlTree);
  });

  it('redirects student to /student when not allowed', () => {
    const urlTree = { url: '/student' } as any;
    const router = { parseUrl: jasmine.createSpy('parseUrl').and.returnValue(urlTree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => true, getUserRole: () => 'student' } },
        { provide: Router, useValue: router },
      ],
    });

    const guard = roleGuard(['admin']);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(router.parseUrl).toHaveBeenCalledWith('/student');
    expect(result).toBe(urlTree);
  });

  it('redirects teacher to /teacher when not allowed', () => {
    const urlTree = { url: '/teacher' } as any;
    const router = { parseUrl: jasmine.createSpy('parseUrl').and.returnValue(urlTree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => true, getUserRole: () => 'teacher' } },
        { provide: Router, useValue: router },
      ],
    });

    const guard = roleGuard(['admin']);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(router.parseUrl).toHaveBeenCalledWith('/teacher');
    expect(result).toBe(urlTree);
  });

  it('redirects unknown role to /dashboard', () => {
    const urlTree = { url: '/dashboard' } as any;
    const router = { parseUrl: jasmine.createSpy('parseUrl').and.returnValue(urlTree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => true, getUserRole: () => 'admin' } },
        { provide: Router, useValue: router },
      ],
    });

    const guard = roleGuard(['student']);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(router.parseUrl).toHaveBeenCalledWith('/dashboard');
    expect(result).toBe(urlTree);
  });
});
