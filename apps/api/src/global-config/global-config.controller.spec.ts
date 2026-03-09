import { Test, TestingModule } from '@nestjs/testing';
import { GlobalConfigController } from './global-config.controller';
import { GlobalConfigService } from './global-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';

const mockService = {
  getSmtpConfig: jest.fn(),
  updateSmtpConfig: jest.fn(),
  listEmailTemplates: jest.fn(),
  upsertEmailTemplate: jest.fn(),
  deleteEmailTemplate: jest.fn(),
  getSystemParams: jest.fn(),
  updateSystemParams: jest.fn(),
};

const mockReq = {
  user: { userId: 'superadmin1', role: 'superadmin', email: 'super@test.com' },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
};

describe('GlobalConfigController', () => {
  let controller: GlobalConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlobalConfigController],
      providers: [{ provide: GlobalConfigService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(GlobalConfigController);
    jest.clearAllMocks();
  });

  describe('getSmtp', () => {
    it('should call service.getSmtpConfig', () => {
      mockService.getSmtpConfig.mockResolvedValue(null);
      controller.getSmtp();
      expect(mockService.getSmtpConfig).toHaveBeenCalled();
    });
  });

  describe('updateSmtp', () => {
    it('should call service.updateSmtpConfig with body and actor', () => {
      const smtp = { host: 'smtp.example.com', port: 587, user: 'u', from: 'no-reply@example.com' };
      mockService.updateSmtpConfig.mockResolvedValue(smtp);
      controller.updateSmtp(smtp, mockReq);
      expect(mockService.updateSmtpConfig).toHaveBeenCalledWith(
        smtp,
        expect.objectContaining({ userId: 'superadmin1', role: 'superadmin' }),
      );
    });
  });

  describe('listTemplates', () => {
    it('should call service.listEmailTemplates', () => {
      mockService.listEmailTemplates.mockResolvedValue([]);
      controller.listTemplates();
      expect(mockService.listEmailTemplates).toHaveBeenCalled();
    });
  });

  describe('upsertTemplate', () => {
    it('should call service.upsertEmailTemplate with key, body and actor', () => {
      const body = { subject: 'Bienvenue', body: 'Bonjour {{name}}' };
      mockService.upsertEmailTemplate.mockResolvedValue({});
      controller.upsertTemplate('welcome', body, mockReq);
      expect(mockService.upsertEmailTemplate).toHaveBeenCalledWith(
        'welcome',
        body,
        expect.objectContaining({ userId: 'superadmin1' }),
      );
    });
  });

  describe('deleteTemplate', () => {
    it('should call service.deleteEmailTemplate with key and actor', () => {
      mockService.deleteEmailTemplate.mockResolvedValue({ success: true });
      controller.deleteTemplate('welcome', mockReq);
      expect(mockService.deleteEmailTemplate).toHaveBeenCalledWith(
        'welcome',
        expect.objectContaining({ userId: 'superadmin1' }),
      );
    });
  });

  describe('getSystemParams', () => {
    it('should call service.getSystemParams', () => {
      mockService.getSystemParams.mockResolvedValue({ maintenanceMode: false });
      controller.getSystemParams();
      expect(mockService.getSystemParams).toHaveBeenCalled();
    });
  });

  describe('updateSystemParams', () => {
    it('should call service.updateSystemParams with partial params and actor', () => {
      const params = { maintenanceMode: true, paymentGraceDays: 14 };
      mockService.updateSystemParams.mockResolvedValue(params);
      controller.updateSystemParams(params, mockReq);
      expect(mockService.updateSystemParams).toHaveBeenCalledWith(
        params,
        expect.objectContaining({ userId: 'superadmin1' }),
      );
    });
  });
});
