import { Test, TestingModule } from '@nestjs/testing';
import { DocumentRequestsController } from './document-requests.controller';
import { DocumentRequestsService } from './document-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '../common/roles.enum';
import { DocumentRequestStatus } from './document-request.schema';

const mockService = {
  createRequest: jest.fn(),
  listMyRequests: jest.fn(),
  listRequests: jest.fn(),
  updateRequest: jest.fn(),
};

const adminReq = {
  user: { userId: 'uid1', role: Role.Admin, email: 'admin@test.com' },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
};

const studentReq = {
  user: { email: 'student@test.com' },
};

describe('DocumentRequestsController', () => {
  let controller: DocumentRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentRequestsController],
      providers: [{ provide: DocumentRequestsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(DocumentRequestsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.createRequest with student email and dto fields', () => {
      const dto = { type: 'certificate', note: 'Urgent' } as any;
      mockService.createRequest.mockResolvedValue({});
      controller.create(dto, studentReq as any);
      expect(mockService.createRequest).toHaveBeenCalledWith(
        'student@test.com',
        'certificate',
        'Urgent',
      );
    });

    it('should pass empty string when user email is missing', () => {
      const dto = { type: 'transcript' } as any;
      mockService.createRequest.mockResolvedValue({});
      controller.create(dto, { user: {} } as any);
      expect(mockService.createRequest).toHaveBeenCalledWith('', 'transcript', undefined);
    });
  });

  describe('listMine', () => {
    it('should call service.listMyRequests with student email', () => {
      mockService.listMyRequests.mockResolvedValue([]);
      controller.listMine(studentReq as any);
      expect(mockService.listMyRequests).toHaveBeenCalledWith('student@test.com');
    });
  });

  describe('listAll', () => {
    it('should call service.listRequests with optional status filter', () => {
      mockService.listRequests.mockResolvedValue([]);
      controller.listAll(DocumentRequestStatus.Pending);
      expect(mockService.listRequests).toHaveBeenCalledWith(DocumentRequestStatus.Pending);
    });

    it('should call service.listRequests without status filter', () => {
      mockService.listRequests.mockResolvedValue([]);
      controller.listAll(undefined);
      expect(mockService.listRequests).toHaveBeenCalledWith(undefined);
    });
  });

  describe('update', () => {
    it('should call service.updateRequest with id, dto fields and actor', () => {
      const dto = { status: DocumentRequestStatus.Ready, note: 'Prêt', documentId: 'doc1' } as any;
      mockService.updateRequest.mockResolvedValue({});
      controller.update('req123', dto, adminReq as any);
      expect(mockService.updateRequest).toHaveBeenCalledWith(
        'req123',
        { status: DocumentRequestStatus.Ready, note: 'Prêt', documentId: 'doc1' },
        expect.objectContaining({ userId: 'uid1', role: Role.Admin }),
      );
    });
  });
});
