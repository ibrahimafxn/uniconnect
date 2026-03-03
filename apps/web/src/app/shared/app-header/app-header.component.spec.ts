import {TestBed} from '@angular/core/testing';
import {AppHeaderComponent} from './app-header.component';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {AuthService} from '../../core/auth.service';
import {of} from 'rxjs';

describe('AppHeaderComponent', () => {
  it('toggleMenu and closeMenu update state', () => {
    const authStub = {
      getUserEmail: () => 'user@test.local',
      getUserRole: () => 'Admin',
      logout: () => of({ success: true }),
    };

    TestBed.configureTestingModule({
      imports: [AppHeaderComponent, RouterTestingModule.withRoutes([])],
      providers: [{ provide: AuthService, useValue: authStub }],
    });

    const fixture = TestBed.createComponent(AppHeaderComponent);
    const comp = fixture.componentInstance;
    expect(comp.isMenuOpen).toBe(false);
    comp.toggleMenu();
    expect(comp.isMenuOpen).toBe(true);
    comp.closeMenu();
    expect(comp.isMenuOpen).toBe(false);
  });

  it('userEmail and userRole fallbacks', () => {
    const authStub = {
      getUserEmail: () => null,
      getUserRole: () => null,
      logout: () => of({ success: true }),
    };

    TestBed.configureTestingModule({
      imports: [AppHeaderComponent, RouterTestingModule.withRoutes([])],
      providers: [{ provide: AuthService, useValue: authStub }],
    });

    const fixture = TestBed.createComponent(AppHeaderComponent);
    const comp = fixture.componentInstance;
    expect(comp.userEmail).toBe('Utilisateur');
    expect(comp.userRole).toBe('Membre');
  });

  it('logout navigates to login on success', () => {
    const authStub = { logout: () => of({ success: true }), getUserEmail: () => 'a', getUserRole: () => 'b' };

    TestBed.configureTestingModule({
      imports: [AppHeaderComponent, RouterTestingModule.withRoutes([])],
      providers: [{ provide: AuthService, useValue: authStub }],
    });

    const fixture = TestBed.createComponent(AppHeaderComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    comp.logout();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('logout navigates to login on error', () => {
    const authStub = {
      getUserEmail: () => 'a',
      getUserRole: () => 'b',
      logout: () => ({
        subscribe: ({ error }: any) => error(new Error('fail')),
      }),
    };

    TestBed.configureTestingModule({
      imports: [AppHeaderComponent, RouterTestingModule.withRoutes([])],
      providers: [{ provide: AuthService, useValue: authStub }],
    });

    const fixture = TestBed.createComponent(AppHeaderComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    comp.logout();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
