import {TestBed} from '@angular/core/testing';
import {DashboardComponent} from './dashboard.component';
import {AuthService} from '../../core/auth.service';
import {Router} from '@angular/router';
import {of} from 'rxjs';

describe('DashboardComponent', () => {
  it('logout navigates to login', () => {
    const auth = { logout: () => of({ success: true }) };
    const router = { navigateByUrl: jasmine.createSpy('navigateByUrl') };

    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance;
    comp.logout();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('logout navigates on error', () => {
    const auth = { logout: () => ({ subscribe: ({ error }: any) => error() }) };
    const router = { navigateByUrl: jasmine.createSpy('navigateByUrl') };

    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance;
    comp.logout();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
