import {TestBed} from '@angular/core/testing';
import {DashboardComponent} from './dashboard.component';
import {AuthService} from '../../core/auth.service';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {of} from 'rxjs';

describe('DashboardComponent', () => {
  it('logout navigates to login', () => {
    const auth = { logout: () => of({ success: true }) };

    TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: auth },
      ],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    comp.logout();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('logout navigates on error', () => {
    const auth = { logout: () => ({ subscribe: ({ error }: any) => error() }) };

    TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: auth },
      ],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    comp.logout();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
