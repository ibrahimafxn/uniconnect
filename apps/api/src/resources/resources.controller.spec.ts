import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '../common/roles.enum';

const mockService = {
  listResources: jest.fn(),
  createResource: jest.fn(),
  getResource: jest.fn(),
  deleteResource: jest.fn(),
};

const mockReq = {
  user: { userId: 'uid1', role: Role.Teacher, email: 'teacher@test.com' },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
};

const mockFile = {
  originalname: 'cours.pdf',
  filename: 'cours_123.pdf',
  path: '/uploads/resources/cours_123.pdf',
  mimetype: 'application/pdf',
  size: 512000,
};

describe('ResourcesController', () => {
  let controller: ResourcesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [{ provide: ResourcesService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ResourcesController);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should call service.listResources with filters and user', () => {
      mockService.listResources.mockResolvedValue([]);
      controller.list(mockReq as any, 'group1', 'subj1', undefined);
      expect(mockService.listResources).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'group1',
          subjectId: 'subj1',
          user: expect.objectContaining({ userId: 'uid1', role: Role.Teacher }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should call service.createResource with dto, file metadata and actor', () => {
      const dto = { title: 'Cours TD1', groupId: 'group1' } as any;
      mockService.createResource.mockResolvedValue({});
      controller.create(dto, mockFile as any, mockReq as any);
      expect(mockService.createResource).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Cours TD1',
          uploadedBy: 'uid1',
          originalName: 'cours.pdf',
          mimeType: 'application/pdf',
        }),
        expect.objectContaining({ userId: 'uid1', role: Role.Teacher }),
      );
    });

    it('should throw BadRequestException when file is missing', () => {
      const dto = { title: 'Cours TD1' } as any;
      expect(() => controller.create(dto, undefined as any, mockReq as any)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('should call service.deleteResource with id and actor', () => {
      mockService.deleteResource.mockResolvedValue({ success: true });
      controller.delete('res123', mockReq as any);
      expect(mockService.deleteResource).toHaveBeenCalledWith(
        'res123',
        expect.objectContaining({ userId: 'uid1', role: Role.Teacher }),
      );
    });
  });
});
