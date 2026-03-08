import {routes} from './app.routes';

describe('app routes', () => {
  it('includes core routes and redirects to dashboard', () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain('login');
    expect(paths).toContain('apply');
    expect(paths).toContain('teacher');
    expect(routes.some((r) => r.redirectTo === 'dashboard')).toBeTrue();
  });
});
