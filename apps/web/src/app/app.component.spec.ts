import {TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {RouterTestingModule} from '@angular/router/testing';
import {AuthService} from './core/auth.service';
import {of} from 'rxjs';

describe('AppComponent', () => {
  beforeEach(async () => {
    const authStub = {
      getUserEmail: () => 'user@test.local',
      getUserRole: () => 'Admin',
      logout: () => of({ success: true }),
    };
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule.withRoutes([])],
      providers: [{ provide: AuthService, useValue: authStub }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
