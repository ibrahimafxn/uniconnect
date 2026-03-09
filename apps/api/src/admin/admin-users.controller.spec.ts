import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '../common/roles.enum';

const mockService = {
  listUsers: jest.fn(),
  getUser: jest.fn(),
  suspendUser: jest.fn(),
  reactivateUser: jest.fn(),
  resetPassword: jest.fn(),
  assignRole: jest.fn(),
  importStudents: jest.fn(),
  listImportJobs: jest.fn(),
  listAuditLogs: jest.fn(),
};

const mockReq = {
  user: { userId: 'uid1', role: 'admin', email: 'admin@test.com' },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
};

describe('AdminUsersController', () => {
  let controller: AdminUsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [{ provide: AdminUsersService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminUsersController);
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should call service.listUsers with parsed params', () => {
      mockService.listUsers.mockResolvedValue({ items: [], total: 0 });
      controller.listUsers('0', '20', Role.Teacher, 'john', 'false');
      expect(mockService.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, limit: 20, role: Role.Teacher, q: 'john', suspended: false }),
      );
    });

    it('should set suspended=undefined when not provided', () => {
      mockService.listUsers.mockResolvedValue({ items: [], total: 0 });
      controller.listUsers('0', '20', undefined, undefined, undefined);
      expect(mockService.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({ suspended: undefined }),
      );
    });
  });

  describe('listAuditLogs', () => {
    it('should call service.listAuditLogs with filters', () => {
      mockService.listAuditLogs.mockResolvedValue({ items: [], total: 0 });
      controller.listAuditLogs('0', '50', 'SUSPEND_USER', 'User', 'actor1');
      expect(mockService.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SUSPEND_USER', entity: 'User', actorId: 'actor1' }),
      );
    });
  });

  describe('listImportJobs', () => {
    it('should call service.listImportJobs with parsed params', () => {
      mockService.listImportJobs.mockResolvedValue({ items: [], total: 0 });
      controller.listImportJobs('0', '10');
      expect(mockService.listImportJobs).toHaveBeenCalledWith({ skip: 0, limit: 10 });
    });
  });

  describe('getUser', () => {
    it('should call service.getUser with id', () => {
      mockService.getUser.mockResolvedValue({});
      controller.getUser('user123');
      expect(mockService.getUser).toHaveBeenCalledWith('user123');
    });
  });

  describe('suspendUser', () => {
    it('should call service.suspendUser with id and actor', () => {
      mockService.suspendUser.mockResolvedValue({ success: true });
      controller.suspendUser('user123', mockReq);
      expect(mockService.suspendUser).toHaveBeenCalledWith('user123', expect.any(Object));
    });
  });

  describe('reactivateUser', () => {
    it('should call service.reactivateUser with id and actor', () => {
      mockService.reactivateUser.mockResolvedValue({ success: true });
      controller.reactivateUser('user123', mockReq);
      expect(mockService.reactivateUser).toHaveBeenCalledWith('user123', expect.any(Object));
    });
  });

  describe('resetPassword', () => {
    it('should call service.resetPassword with id and actor', () => {
      mockService.resetPassword.mockResolvedValue({ tempPassword: 'abc123' });
      controller.resetPassword('user123', mockReq);
      expect(mockService.resetPassword).toHaveBeenCalledWith('user123', expect.any(Object));
    });
  });

  describe('assignRole', () => {
    it('should call service.assignRole with id, role and actor', () => {
      mockService.assignRole.mockResolvedValue({});
      controller.assignRole('user123', { role: Role.Teacher }, mockReq);
      expect(mockService.assignRole).toHaveBeenCalledWith('user123', Role.Teacher, expect.any(Object));
    });
  });

  describe('importStudents', () => {
    it('should call service.importStudents with rows, offerId, groupId and actor', () => {
      const body = {
        offerId: 'offer1',
        groupId: 'group1',
        rows: [{ firstName: 'Jean', lastName: 'Dupont', gender: 'male', birthDate: '2000-01-01' }],
      };
      mockService.importStudents.mockResolvedValue({ created: 1, errors: [] });
      controller.importStudents(body, mockReq);
      expect(mockService.importStudents).toHaveBeenCalledWith(
        expect.objectContaining({ offerId: 'offer1', groupId: 'group1', actor: expect.any(Object) }),
      );
    });
  });
});
