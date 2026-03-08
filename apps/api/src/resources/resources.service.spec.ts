import { ResourcesService } from './resources.service';
import { Role } from '../common/roles.enum';

const makeQuery = (result: any) => ({
  sort: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  exec: jest.fn().mockResolvedValue(result),
});

const makeLeanQuery = (result: any) => ({
  lean: () => ({ exec: jest.fn().mockResolvedValue(result) }),
});

describe('ResourcesService', () => {
  it('listResources filters by student group', async () => {
    const resourceModel = { find: jest.fn().mockReturnValue(makeQuery([])) } as any;
    const studentModel = {
      findOne: jest.fn().mockReturnValue(makeLeanQuery({ groupId: 'g1' })),
    } as any;
    const service = new ResourcesService(resourceModel, studentModel, { log: jest.fn() } as any);

    await service.listResources({ user: { role: Role.Student, email: 's@u.c', userId: 'u1' } });
    expect(resourceModel.find).toHaveBeenCalledWith({ groupId: 'g1' });
  });

  it('createResource logs audit', async () => {
    const resourceModel = { create: jest.fn().mockResolvedValue({ _id: 'r1', title: 'Doc', groupId: 'g1' }) } as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new ResourcesService(resourceModel, {} as any, auditLog);

    await service.createResource(
      {
        title: 'Doc',
        groupId: '507f1f77bcf86cd799439011',
        uploadedBy: '507f1f77bcf86cd799439012',
        originalName: 'doc.pdf',
        fileName: 'doc.pdf',
        path: '/tmp/doc.pdf',
        mimeType: 'application/pdf',
        size: 10,
      },
      { userId: 'u1' } as any,
    );
    expect(resourceModel.create).toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('getResource enforces student access', async () => {
    const resourceModel = { findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'r1', groupId: 'g1' }) }) } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ groupId: 'g1' })) } as any;
    const service = new ResourcesService(resourceModel, studentModel, { log: jest.fn() } as any);
    const res = await service.getResource('r1', { role: Role.Student, email: 's@u.c' });
    expect(res?._id).toBe('r1');
  });

  it('deleteResource logs audit', async () => {
    const resourceModel = { findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'r1', title: 'Doc' }) }) } as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new ResourcesService(resourceModel, {} as any, auditLog);
    await service.deleteResource('r1', { userId: 'u1' } as any);
    expect(auditLog.log).toHaveBeenCalled();
  });
});
