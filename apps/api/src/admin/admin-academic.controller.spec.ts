import { Test, TestingModule } from '@nestjs/testing';
import { AdminAcademicController } from './admin-academic.controller';
import { AdminAcademicService } from './admin-academic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';

const mockService = {
  initializeYear: jest.fn(),
  closeYear: jest.fn(),
  getYearSummary: jest.fn(),
  updateOfferCapacity: jest.fn(),
  createCalendarEvent: jest.fn(),
  listCalendarEvents: jest.fn(),
  deleteCalendarEvent: jest.fn(),
};

const mockReq = {
  user: { userId: 'uid1', role: 'admin', email: 'admin@test.com' },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
};

describe('AdminAcademicController', () => {
  let controller: AdminAcademicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAcademicController],
      providers: [{ provide: AdminAcademicService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminAcademicController);
    jest.clearAllMocks();
  });

  describe('initializeYear', () => {
    it('should call service.initializeYear with body + actor', () => {
      const body = {
        name: '2025-2026',
        startDate: '2025-09-01',
        endDate: '2026-06-30',
        isActive: true,
        semesters: [],
        offers: [],
      };
      mockService.initializeYear.mockResolvedValue({ year: {}, semesters: [], offerCount: 0 });
      controller.initializeYear(body, mockReq);
      expect(mockService.initializeYear).toHaveBeenCalledWith(
        expect.objectContaining({ name: '2025-2026', actor: expect.any(Object) }),
      );
    });
  });

  describe('closeYear', () => {
    it('should call service.closeYear with id and actor', () => {
      mockService.closeYear.mockResolvedValue({ success: true });
      controller.closeYear('year123', mockReq);
      expect(mockService.closeYear).toHaveBeenCalledWith('year123', expect.any(Object));
    });
  });

  describe('getYearSummary', () => {
    it('should call service.getYearSummary with id', () => {
      mockService.getYearSummary.mockResolvedValue({});
      controller.getYearSummary('year123');
      expect(mockService.getYearSummary).toHaveBeenCalledWith('year123');
    });
  });

  describe('updateOfferCapacity', () => {
    it('should call service.updateOfferCapacity with id, capacity and actor', () => {
      mockService.updateOfferCapacity.mockResolvedValue({});
      controller.updateOfferCapacity('offer123', { capacity: 50 }, mockReq);
      expect(mockService.updateOfferCapacity).toHaveBeenCalledWith('offer123', 50, expect.any(Object));
    });
  });

  describe('createCalendarEvent', () => {
    it('should call service.createCalendarEvent with body + actor', () => {
      const body = {
        academicYearId: 'year123',
        type: 'exam' as any,
        label: 'Examens S1',
        startDate: '2026-01-10',
        endDate: '2026-01-20',
      };
      mockService.createCalendarEvent.mockResolvedValue({});
      controller.createCalendarEvent(body, mockReq);
      expect(mockService.createCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Examens S1', actor: expect.any(Object) }),
      );
    });
  });

  describe('listCalendarEvents', () => {
    it('should call service.listCalendarEvents with parsed pagination', () => {
      mockService.listCalendarEvents.mockResolvedValue({ items: [], total: 0 });
      controller.listCalendarEvents('year123', undefined, '0', '10');
      expect(mockService.listCalendarEvents).toHaveBeenCalledWith(
        expect.objectContaining({ academicYearId: 'year123', skip: 0, limit: 10 }),
      );
    });

    it('should cap limit at 200', () => {
      mockService.listCalendarEvents.mockResolvedValue({ items: [], total: 0 });
      controller.listCalendarEvents(undefined, undefined, '0', '999');
      expect(mockService.listCalendarEvents).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 200 }),
      );
    });
  });

  describe('deleteCalendarEvent', () => {
    it('should call service.deleteCalendarEvent with id and actor', () => {
      mockService.deleteCalendarEvent.mockResolvedValue({ success: true });
      controller.deleteCalendarEvent('evt123', mockReq);
      expect(mockService.deleteCalendarEvent).toHaveBeenCalledWith('evt123', expect.any(Object));
    });
  });
});
