import { AnnouncementsService } from './announcements.service';
import { AnnouncementCategory, AnnouncementScope } from './announcement.schema';
import { Role } from '../common/roles.enum';

const makeQuery = (result: any) => ({
  sort: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  exec: jest.fn().mockResolvedValue(result),
});

const makeLeanQuery = (result: any) => ({
  lean: () => ({ exec: jest.fn().mockResolvedValue(result) }),
});

describe('AnnouncementsService', () => {
  const groupId = '507f1f77bcf86cd799439011';
  it('listAnnouncements filters for student', async () => {
    const announcementModel = { find: jest.fn().mockReturnValue(makeQuery([])) } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ groupId })) } as any;
    const service = new AnnouncementsService(announcementModel, studentModel, { log: jest.fn() } as any);

    await service.listAnnouncements({ category: AnnouncementCategory.Official, user: { role: Role.Student, email: 's@u.c' } });
    expect(announcementModel.find).toHaveBeenCalled();
  });

  it('createAnnouncement logs audit', async () => {
    const announcementModel = { create: jest.fn().mockResolvedValue({ _id: 'a1', title: 'Info', scope: AnnouncementScope.All, category: AnnouncementCategory.Official }) } as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new AnnouncementsService(announcementModel, {} as any, auditLog);

    await service.createAnnouncement({ title: 'Info', body: 'Test', createdBy: '507f1f77bcf86cd799439011' }, { userId: 'u1' } as any);
    expect(auditLog.log).toHaveBeenCalled();
  });
});
