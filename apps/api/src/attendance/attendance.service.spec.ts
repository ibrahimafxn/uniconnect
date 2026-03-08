import { AttendanceService } from './attendance.service';
import { AttendanceStatus } from './attendance.schema';
import { AbsenceJustificationStatus } from './absence-justification.schema';

const makeQuery = (result: any) => ({
  sort: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  exec: jest.fn().mockResolvedValue(result),
});

const makeLeanQuery = (result: any) => ({
  lean: () => ({ exec: jest.fn().mockResolvedValue(result) }),
});

describe('AttendanceService', () => {
  const studentId = '507f1f77bcf86cd799439011';
  const groupId = '507f1f77bcf86cd799439012';
  const sessionId = '507f1f77bcf86cd799439013';
  it('getMyAttendanceSummary returns summary', async () => {
    const attendanceModel = {
      find: jest.fn().mockReturnValue(makeLeanQuery([
        { status: AttendanceStatus.Present },
        { status: AttendanceStatus.Absent },
      ])),
    } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ _id: studentId })) } as any;
    const service = new AttendanceService(attendanceModel, {} as any, studentModel, {} as any, { log: jest.fn() } as any);
    const res = await service.getMyAttendanceSummary('s@u.c');
    expect(res?.total).toBe(2);
  });

  it('listMyJustifications returns items', async () => {
    const justificationModel = { find: jest.fn().mockReturnValue(makeQuery([{ _id: 'j1' }])) } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ _id: studentId })) } as any;
    const service = new AttendanceService({} as any, justificationModel, studentModel, {} as any, { log: jest.fn() } as any);
    const res = await service.listMyJustifications('s@u.c');
    expect(res).toHaveLength(1);
  });

  it('createJustification creates document', async () => {
    const justificationModel = { create: jest.fn().mockResolvedValue({ _id: 'j1' }) } as any;
    const studentModel = { findOne: jest.fn().mockReturnValue(makeLeanQuery({ _id: studentId })) } as any;
    const service = new AttendanceService({} as any, justificationModel, studentModel, {} as any, { log: jest.fn() } as any);
    await service.createJustification({
      email: 's@u.c',
      absenceDate: '2026-03-01',
      reason: 'Maladie',
    });
    expect(justificationModel.create).toHaveBeenCalled();
  });

  it('updateJustification logs audit', async () => {
    const justificationModel = { findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'j1' }) }) } as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new AttendanceService({} as any, justificationModel, {} as any, {} as any, auditLog);
    await service.updateJustification('j1', { status: AbsenceJustificationStatus.Accepted }, { userId: 'u1' } as any);
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('listJustifications filters by status and group', async () => {
    const justificationModel = { find: jest.fn().mockReturnValue(makeQuery([])) } as any;
    const studentModel = {
      find: jest.fn().mockReturnValue({
        select: () => ({
          lean: () => ({ exec: jest.fn().mockResolvedValue([{ _id: studentId }]) }),
        }),
      }),
    } as any;
    const service = new AttendanceService({} as any, justificationModel, studentModel, {} as any, { log: jest.fn() } as any);
    await service.listJustifications({ status: AbsenceJustificationStatus.Submitted, groupId });
    expect(justificationModel.find).toHaveBeenCalled();
  });

  it('getSessionAttendance maps students and records', async () => {
    const sessionModel = { findById: jest.fn().mockReturnValue(makeLeanQuery({ _id: sessionId, groupId })) } as any;
    const studentModel = {
      find: jest.fn().mockReturnValue({
        sort: () => ({
          lean: () => ({ exec: jest.fn().mockResolvedValue([{ _id: studentId, firstName: 'A', lastName: 'B', studentNumber: 'S1' }]) }),
        }),
      }),
    } as any;
    const attendanceModel = {
      find: jest.fn().mockReturnValue(makeLeanQuery([{ studentId, status: AttendanceStatus.Present }])),
    } as any;
    const service = new AttendanceService(attendanceModel, {} as any, studentModel, sessionModel, { log: jest.fn() } as any);
    const res = await service.getSessionAttendance(sessionId);
    expect(res[0].status).toBe(AttendanceStatus.Present);
  });

  it('upsertAttendance writes entries and logs', async () => {
    const attendanceModel = { bulkWrite: jest.fn().mockResolvedValue({}) } as any;
    const auditLog = { log: jest.fn() } as any;
    const service = new AttendanceService(attendanceModel, {} as any, {} as any, {} as any, auditLog);
    await service.upsertAttendance(sessionId, [{ studentId, status: AttendanceStatus.Absent }], { userId: 'u1' } as any);
    expect(attendanceModel.bulkWrite).toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalled();
  });
});
