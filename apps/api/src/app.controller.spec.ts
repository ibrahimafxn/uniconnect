import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return status ok', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });
  });

  describe('me', () => {
    it('returns user from request', () => {
      const res = appController.getMe({
        user: { userId: 'u1', email: 'a@b.c', role: 'admin' },
      } as any);
      expect(res.userId).toBe('u1');
    });
  });

  describe('adminPing', () => {
    it('returns ok', () => {
      expect(appController.adminPing()).toEqual({ ok: true });
    });
  });
});
