import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '../common/roles.enum';
import { ApplicationStatus } from './application.schema';

const mockService = {
  createPublic: jest.fn(),
  getPublic: jest.fn(),
  updatePublic: jest.fn(),
  createDocument: jest.fn(),
  listByStudentEmail: jest.fn(),
  listAll: jest.fn(),
  updateStatus: jest.fn(),
  listDocuments: jest.fn(),
  getDocument: jest.fn(),
};

const adminReq = {
  user: { userId: 'uid1', role: Role.Admin, email: 'admin@test.com' },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
};

describe('ApplicationsController', () => {
  let controller: ApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [{ provide: ApplicationsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ApplicationsController);
    jest.clearAllMocks();
  });

  describe('createPublic', () => {
    it('should call service.createPublic with dto', () => {
      const dto = { firstName: 'Jean', lastName: 'Dupont', email: 'jean@test.com' } as any;
      mockService.createPublic.mockResolvedValue({});
      controller.createPublic(dto);
      expect(mockService.createPublic).toHaveBeenCalledWith(dto);
    });
  });

  describe('getPublic', () => {
    it('should call service.getPublic with code and email', () => {
      mockService.getPublic.mockResolvedValue({});
      controller.getPublic('CODE123', 'jean@test.com');
      expect(mockService.getPublic).toHaveBeenCalledWith('CODE123', 'jean@test.com');
    });

    it('should throw BadRequestException when email is missing', () => {
      expect(() => controller.getPublic('CODE123', undefined)).toThrow(BadRequestException);
    });
  });

  describe('updatePublic', () => {
    it('should call service.updatePublic with code, email and dto', () => {
      const dto = { email: 'jean@test.com', phone: '0600000000' } as any;
      mockService.updatePublic.mockResolvedValue({});
      controller.updatePublic('CODE123', dto);
      expect(mockService.updatePublic).toHaveBeenCalledWith('CODE123', 'jean@test.com', dto);
    });

    it('should throw BadRequestException when dto.email is missing', () => {
      expect(() => controller.updatePublic('CODE123', { phone: '0600' } as any)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('listMy', () => {
    it('should call service.listByStudentEmail with user email', () => {
      mockService.listByStudentEmail.mockResolvedValue([]);
      controller.listMy({ user: { email: 'student@test.com' } } as any);
      expect(mockService.listByStudentEmail).toHaveBeenCalledWith('student@test.com');
    });
  });

  describe('listAll', () => {
    it('should call service.listAll with optional status filter', () => {
      mockService.listAll.mockResolvedValue([]);
      controller.listAll(ApplicationStatus.Submitted);
      expect(mockService.listAll).toHaveBeenCalledWith(ApplicationStatus.Submitted);
    });
  });

  describe('updateStatus', () => {
    it('should call service.updateStatus with id, dto and actor', () => {
      const dto = { status: ApplicationStatus.Accepted, decisionNote: 'Dossier complet' } as any;
      mockService.updateStatus.mockResolvedValue({});
      controller.updateStatus('app123', dto, adminReq as any);
      expect(mockService.updateStatus).toHaveBeenCalledWith(
        'app123',
        { status: ApplicationStatus.Accepted, decisionNote: 'Dossier complet' },
        expect.objectContaining({ userId: 'uid1', role: Role.Admin }),
      );
    });
  });

  describe('listDocuments', () => {
    it('should call service.listDocuments with application id', () => {
      mockService.listDocuments.mockResolvedValue([]);
      controller.listDocuments('app123');
      expect(mockService.listDocuments).toHaveBeenCalledWith('app123');
    });
  });
});
