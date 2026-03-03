import {TestBed} from '@angular/core/testing';
import {DashboardComponent} from './dashboard.component';
import {RouterTestingModule} from '@angular/router/testing';

describe('DashboardComponent', () => {
  it('creates', () => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule.withRoutes([])],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});
