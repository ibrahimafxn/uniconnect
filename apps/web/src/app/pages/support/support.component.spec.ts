import {TestBed} from '@angular/core/testing';
import {SupportComponent} from './support.component';
import {SUPPORT_EMAIL} from '../../core/app-settings';
import {RouterTestingModule} from '@angular/router/testing';

describe('SupportComponent', () => {
  it('creates and exposes support info', () => {
    TestBed.configureTestingModule({
      imports: [SupportComponent, RouterTestingModule.withRoutes([])],
    });

    const fixture = TestBed.createComponent(SupportComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
    expect(comp.supportEmail).toBe(SUPPORT_EMAIL);
    expect(comp.faqs.length).toBeGreaterThan(0);
  });

  it('builds mailto link', () => {
    TestBed.configureTestingModule({
      imports: [SupportComponent, RouterTestingModule.withRoutes([])],
    });

    const fixture = TestBed.createComponent(SupportComponent);
    const comp = fixture.componentInstance;
    expect(comp.supportMailto).toContain(`mailto:${SUPPORT_EMAIL}`);
    expect(comp.supportMailto).toContain('subject=');
  });
});
