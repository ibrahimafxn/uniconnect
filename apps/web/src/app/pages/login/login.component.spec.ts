import {TestBed} from '@angular/core/testing';
import {LoginComponent} from './login.component';
import {AuthService} from '../../core/auth.service';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {of, throwError} from 'rxjs';

describe('LoginComponent', () => {
  it('submits and navigates on success', () => {
    const auth = { login: () => of({ accessToken: 'a', refreshToken: 'r' }), getUserRole: () => 'student' };

    TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: auth },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    comp.form.setValue({ email: 'a@b.c', password: 'password123' });
    comp.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/student');
  });

  it('shows error on failure', () => {
    const auth = { login: () => throwError(() => new Error('bad')), getUserRole: () => 'admin' };

    TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: auth },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'a@b.c', password: 'password123' });
    comp.submit();

    expect(comp.error).toBe('Identifiants invalides');
  });

  it('does not submit when form invalid', () => {
    const loginSpy = jasmine.createSpy('login').and.returnValue(of({ accessToken: 'a', refreshToken: 'r' }));
    const auth = { login: loginSpy, getUserRole: () => 'admin' };

    TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: auth },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: '', password: '' });
    comp.submit();

    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('does not submit when loading', () => {
    const loginSpy = jasmine.createSpy('login').and.returnValue(of({ accessToken: 'a', refreshToken: 'r' }));
    const auth = { login: loginSpy, getUserRole: () => 'admin' };

    TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: auth },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'a@b.c', password: 'password123' });
    comp.loading = true;
    comp.submit();

    expect(loginSpy).not.toHaveBeenCalled();
  });
});
