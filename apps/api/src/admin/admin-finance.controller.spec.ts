import { Test, TestingModule } from '@nestjs/testing';
import { AdminFinanceController } from './admin-finance.controller';
import { AdminFinanceService } from './admin-finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';

const mockService = {
  createFeeTemplate: jest.fn(),
  listFeeTemplates: jest.fn(),
  updateFeeTemplate: jest.fn(),
  applyFeeTemplate: jest.fn(),
  createExemption: jest.fn(),
  listExemptions: jest.fn(),
  deleteExemption: jest.fn(),
  getFinancialReport: jest.fn(),
};

const mockReq = {
  user: { userId: 'uid1', role: 'admin', email: 'admin@test.com' },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
};

describe('AdminFinanceController', () => {
  let controller: AdminFinanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminFinanceController],
      providers: [{ provide: AdminFinanceService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminFinanceController);
    jest.clearAllMocks();
  });

  describe('createFeeTemplate', () => {
    it('should call service.createFeeTemplate with body + actor', () => {
      const body = {
        label: 'Frais 2025-2026',
        offerId: 'offer123',
        totalAmount: 500000,
        installments: [{ label: 'T1', amount: 250000, dueDate: '2025-10-01' }],
      };
      mockService.createFeeTemplate.mockResolvedValue({});
      controller.createFeeTemplate(body, mockReq);
      expect(mockService.createFeeTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Frais 2025-2026', actor: expect.any(Object) }),
      );
    });
  });

  describe('listFeeTemplates', () => {
    it('should call service.listFeeTemplates with parsed pagination', () => {
      mockService.listFeeTemplates.mockResolvedValue({ items: [], total: 0 });
      controller.listFeeTemplates('offer123', '0', '20');
      expect(mockService.listFeeTemplates).toHaveBeenCalledWith(
        expect.objectContaining({ offerId: 'offer123', skip: 0, limit: 20 }),
      );
    });
  });

  describe('updateFeeTemplate', () => {
    it('should call service.updateFeeTemplate with id, partial body and actor', () => {
      mockService.updateFeeTemplate.mockResolvedValue({});
      controller.updateFeeTemplate('tmpl123', { isActive: false }, mockReq);
      expect(mockService.updateFeeTemplate).toHaveBeenCalledWith(
        'tmpl123',
        { isActive: false },
        expect.any(Object),
      );
    });
  });

  describe('applyFeeTemplate', () => {
    it('should call service.applyFeeTemplate with templateId, studentIds and actor', () => {
      mockService.applyFeeTemplate.mockResolvedValue({ applied: 3, skipped: 0 });
      controller.applyFeeTemplate('tmpl123', { studentIds: ['s1', 's2', 's3'] }, mockReq);
      expect(mockService.applyFeeTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'tmpl123',
          studentIds: ['s1', 's2', 's3'],
          actor: expect.any(Object),
        }),
      );
    });
  });

  describe('createExemption', () => {
    it('should call service.createExemption with body + actor', () => {
      const body = {
        studentId: 'stu1',
        academicYearId: 'year1',
        type: 'partial' as any,
        percentage: 50,
        reason: 'Bourse nationale',
      };
      mockService.createExemption.mockResolvedValue({});
      controller.createExemption(body, mockReq);
      expect(mockService.createExemption).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: 'stu1', percentage: 50, actor: expect.any(Object) }),
      );
    });
  });

  describe('listExemptions', () => {
    it('should call service.listExemptions with filters', () => {
      mockService.listExemptions.mockResolvedValue({ items: [], total: 0 });
      controller.listExemptions('year1', '0', '50');
      expect(mockService.listExemptions).toHaveBeenCalledWith(
        expect.objectContaining({ academicYearId: 'year1', skip: 0, limit: 50 }),
      );
    });
  });

  describe('deleteExemption', () => {
    it('should call service.deleteExemption with id and actor', () => {
      mockService.deleteExemption.mockResolvedValue({ success: true });
      controller.deleteExemption('ex123', mockReq);
      expect(mockService.deleteExemption).toHaveBeenCalledWith('ex123', expect.any(Object));
    });
  });

  describe('getFinancialReport', () => {
    it('should call service.getFinancialReport with optional academicYearId', () => {
      mockService.getFinancialReport.mockResolvedValue({});
      controller.getFinancialReport('year1');
      expect(mockService.getFinancialReport).toHaveBeenCalledWith('year1');
    });

    it('should pass undefined when no academicYearId provided', () => {
      mockService.getFinancialReport.mockResolvedValue({});
      controller.getFinancialReport(undefined);
      expect(mockService.getFinancialReport).toHaveBeenCalledWith(undefined);
    });
  });
});
