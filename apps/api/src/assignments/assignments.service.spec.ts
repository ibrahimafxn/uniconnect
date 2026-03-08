import { AssignmentsService } from './assignments.service';
import { Role } from '../common/roles.enum';

const makeQuery = (result: any) => ({
  sort: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  exec: jest.fn().mockResolvedValue(result),
});

const makeLeanQuery = (result: any) => ({
  lean: () => ({ exec: jest.fn().mockResolvedValue(result) }),
});

describe('AssignmentsService', () => {
  const assignmentId = '507f1f77bcf86cd799439011';
  const studentId = '507f1f77bcf86cd799439012';
  it('listAssignments filters by student group', async () => {
    const assignmentModel = { find: jest.fn().mockReturnValue(makeQuery([])) } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ groupId: 'g1' })) } as any;
    const service = new AssignmentsService(assignmentModel, {} as any, studentModel, { log: jest.fn() } as any);

    await service.listAssignments({ user: { role: Role.Student, email: 's@u.c', userId: 'u1' } });
    expect(assignmentModel.find).toHaveBeenCalledWith({ groupId: 'g1' });
  });

  it('createAssignment logs audit', async () => {
    const assignmentModel = { create: jest.fn().mockResolvedValue({ _id: 'a1', title: 'TD', groupId: 'g1' }) } as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new AssignmentsService(assignmentModel, {} as any, {} as any, auditLog);

    await service.createAssignment(
      {
        title: 'TD',
        groupId: '507f1f77bcf86cd799439011',
        dueDate: '2026-03-01',
        createdBy: '507f1f77bcf86cd799439012',
      },
      { userId: 'u1' } as any,
    );
    expect(assignmentModel.create).toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('submitAssignment upserts submission', async () => {
    const assignmentModel = {
      findById: jest.fn().mockReturnValue(makeLeanQuery({ _id: assignmentId, groupId: 'g1', dueDate: new Date('2026-03-01') })),
    } as any;
    const submissionModel = {
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 's1' }) }),
    } as any;
    const studentModel = {
      findOne: jest.fn().mockReturnValue(makeLeanQuery({ _id: studentId, groupId: 'g1' })),
    } as any;
    const service = new AssignmentsService(assignmentModel, submissionModel, studentModel, { log: jest.fn() } as any);

    const res = await service.submitAssignment(assignmentId, 's@u.c', {
      originalName: 'work.pdf',
      fileName: 'work.pdf',
      path: '/tmp/work.pdf',
      mimeType: 'application/pdf',
      size: 10,
    });
    expect(res?._id).toBe('s1');
  });

  it('getAssignment enforces student access', async () => {
    const assignmentModel = { findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: assignmentId, groupId: 'g1' }) }) } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ groupId: 'g1' })) } as any;
    const service = new AssignmentsService(assignmentModel, {} as any, studentModel, { log: jest.fn() } as any);
    const res = await service.getAssignment(assignmentId, { role: Role.Student, email: 's@u.c' });
    expect(res?._id).toBe(assignmentId);
  });

  it('listSubmissions and getMySubmission call model', async () => {
    const submissionModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ _id: 's1' }])),
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 's1' }) }),
    } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ _id: studentId })) } as any;
    const service = new AssignmentsService({} as any, submissionModel, studentModel, { log: jest.fn() } as any);
    await service.listSubmissions(assignmentId);
    const res = await service.getMySubmission(assignmentId, 's@u.c');
    expect(res?._id).toBe('s1');
  });

  it('updateSubmission logs audit', async () => {
    const submissionModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 's1' }) }),
    } as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new AssignmentsService({} as any, submissionModel, {} as any, auditLog);
    await service.updateSubmission('s1', { status: 'reviewed' as any }, { userId: 'u1' } as any);
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('getSubmissionById allows student', async () => {
    const submissionModel = { findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 's1', studentId }) }) } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ _id: studentId })) } as any;
    const service = new AssignmentsService({} as any, submissionModel, studentModel, { log: jest.fn() } as any);
    const res = await service.getSubmissionById('s1', { role: Role.Student, email: 's@u.c' });
    expect(res?._id).toBe('s1');
  });
});
