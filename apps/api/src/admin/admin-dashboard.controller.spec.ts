import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';

const mockService = {
  getExecutiveDashboard: jest.fn(),
  getMesrsReport: jest.fn(),
  getSystemStatus: jest.fn(),
  broadcastAnnouncement: jest.fn(),
};

const mockReq = {
  user: { userId: 'uid1', role: 'admin', email: 'admin@test.com' },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
};

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDashboardController],
      providers: [{ provide: AdminDashboardService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminDashboardController);
    jest.clearAllMocks();
  });

  describe('getExecutiveDashboard', () => {
    it('should call service.getExecutiveDashboard', () => {
      mockService.getExecutiveDashboard.mockResolvedValue({ students: {}, finance: {} });
      controller.getExecutiveDashboard();
      expect(mockService.getExecutiveDashboard).toHaveBeenCalled();
    });
  });

  describe('getMesrsReport', () => {
    it('should call service.getMesrsReport with optional academicYearId', () => {
      mockService.getMesrsReport.mockResolvedValue({});
      controller.getMesrsReport('year1');
      expect(mockService.getMesrsReport).toHaveBeenCalledWith('year1');
    });

    it('should pass undefined when no academicYearId provided', () => {
      mockService.getMesrsReport.mockResolvedValue({});
      controller.getMesrsReport(undefined);
      expect(mockService.getMesrsReport).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getSystemStatus', () => {
    it('should call service.getSystemStatus', () => {
      mockService.getSystemStatus.mockResolvedValue({ system: { status: 'operational' } });
      controller.getSystemStatus();
      expect(mockService.getSystemStatus).toHaveBeenCalled();
    });
  });

  describe('broadcastAnnouncement', () => {
    it('should call service.broadcastAnnouncement with body and actor', () => {
      const body = {
        title: 'Rentrée 2025',
        content: 'La rentrée est fixée au 1er septembre.',
        targetRoles: ['student'],
      };
      mockService.broadcastAnnouncement.mockResolvedValue({ success: true, recipientCount: 120 });
      controller.broadcastAnnouncement(body, mockReq);
      expect(mockService.broadcastAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Rentrée 2025', actor: expect.any(Object) }),
      );
    });
  });
});
