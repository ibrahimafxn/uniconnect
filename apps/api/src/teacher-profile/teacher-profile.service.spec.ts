import { TeacherProfileService } from './teacher-profile.service';

const makeQuery = (result: any) => ({
  exec: jest.fn().mockResolvedValue(result),
});

describe('TeacherProfileService', () => {
  it('getByUserId calls model', async () => {
    const profileModel = { findOne: jest.fn().mockReturnValue(makeQuery({ _id: 'p1' })) } as any;
    const service = new TeacherProfileService(profileModel, { log: jest.fn() } as any);
    const res = await service.getByUserId('507f1f77bcf86cd799439011');
    expect(profileModel.findOne).toHaveBeenCalled();
    expect(res?._id).toBe('p1');
  });

  it('upsert logs audit', async () => {
    const profileModel = { findOneAndUpdate: jest.fn().mockReturnValue(makeQuery({ _id: 'p1' })) } as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new TeacherProfileService(profileModel, auditLog);
    await service.upsert('507f1f77bcf86cd799439011', { bio: 'X' } as any, { userId: 'u1' } as any);
    expect(auditLog.log).toHaveBeenCalled();
  });
});
