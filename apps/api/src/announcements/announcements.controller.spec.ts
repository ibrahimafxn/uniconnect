import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '../common/roles.enum';
import { AnnouncementCategory } from './announcement.schema';

const mockService = {
  listAnnouncements: jest.fn(),
  createAnnouncement: jest.fn(),
};

const mockReq = {
  user: { userId: 'uid1', role: Role.Admin, email: 'admin@test.com' },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
};

describe('AnnouncementsController', () => {
  let controller: AnnouncementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [{ provide: AnnouncementsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AnnouncementsController);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should call service.listAnnouncements with category and user', () => {
      mockService.listAnnouncements.mockResolvedValue([]);
      controller.list(AnnouncementCategory.Official, mockReq as any);
      expect(mockService.listAnnouncements).toHaveBeenCalledWith(
        expect.objectContaining({
          category: AnnouncementCategory.Official,
          user: expect.objectContaining({ role: Role.Admin }),
        }),
      );
    });

    it('should pass undefined category when not provided', () => {
      mockService.listAnnouncements.mockResolvedValue([]);
      controller.list(undefined, mockReq as any);
      expect(mockService.listAnnouncements).toHaveBeenCalledWith(
        expect.objectContaining({ category: undefined }),
      );
    });
  });

  describe('create', () => {
    it('should call service.createAnnouncement with dto + actor', () => {
      const dto = {
        title: 'Rentrée 2025',
        body: 'La rentrée est fixée au 1er septembre.',
        scope: undefined,
        category: AnnouncementCategory.Academic,
      };
      mockService.createAnnouncement.mockResolvedValue({});
      controller.create(dto as any, mockReq as any);
      expect(mockService.createAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Rentrée 2025', createdBy: 'uid1' }),
        expect.objectContaining({ userId: 'uid1', role: Role.Admin }),
      );
    });
  });
});
