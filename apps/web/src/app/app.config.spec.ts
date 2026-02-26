import {appConfig} from './app.config';

describe('appConfig', () => {
  it('has providers configured', () => {
    expect(appConfig.providers?.length).toBeGreaterThan(0);
  });
});
