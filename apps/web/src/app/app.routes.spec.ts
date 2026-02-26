import {routes} from './app.routes';

describe('app routes', () => {
  it('includes login and dashboard', () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain('login');
    expect(paths).toContain('dashboard');
  });
});
