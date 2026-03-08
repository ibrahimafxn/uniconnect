import {TestBed} from '@angular/core/testing';
import {DashboardComponent} from './dashboard.component';
import {RouterTestingModule} from '@angular/router/testing';
import {of} from 'rxjs';
import {StudentsApi} from '../../core/api/students.api';
import {UsersApi} from '../../core/api/users.api';
import {PaymentsApi} from '../../core/api/payments.api';
import {PlanningApi} from '../../core/api/planning.api';
import {AcademicApi} from '../../core/api/academic.api';
import {AuthService} from '../../core/auth.service';

describe('DashboardComponent', () => {
  it('creates', () => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: StudentsApi, useValue: { listStudents: () => of({ items: [], total: 0, page: 1, limit: 1, skip: 0 }) } },
        { provide: UsersApi, useValue: { listTeachers: () => of([]) } },
        { provide: PaymentsApi, useValue: { listUnpaid: () => of([]) } },
        { provide: PlanningApi, useValue: { listSessions: () => of([]) } },
        { provide: AcademicApi, useValue: { listGroups: () => of({ items: [], total: 0, page: 1, limit: 50, skip: 0 }) } },
        { provide: AuthService, useValue: { getUserEmail: () => 'admin@school.tld' } },
      ],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});
