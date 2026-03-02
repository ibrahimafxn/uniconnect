import { PlanningService } from './planning.service';

const makeQuery = (result: any) => ({
  sort: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  exec: jest.fn().mockResolvedValue(result),
});

describe('PlanningService', () => {
  it('createRoom calls model.create', async () => {
    const roomModel = { create: jest.fn().mockResolvedValue({}) } as any;
    const sessionModel = {} as any;
    const studentModel = {} as any;
    const userModel = {} as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
    );
    await service.createRoom({ name: 'A1', capacity: 30 });
    expect(roomModel.create).toHaveBeenCalled();
  });

  it('listRooms returns items', async () => {
    const roomModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ name: 'A1' }])),
    } as any;
    const sessionModel = {} as any;
    const studentModel = {} as any;
    const userModel = {} as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
    );
    const res = await service.listRooms();
    expect(res).toHaveLength(1);
  });

  it('createSession rejects invalid time range', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn() }) }),
      create: jest.fn(),
    } as any;
    const studentModel = {} as any;
    const userModel = {
      findById: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue({ role: 'teacher' }) }),
      }),
    } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
    );
    await expect(
      service.createSession({
        date: '2026-05-20',
        startTime: '10:00',
        endTime: '09:00',
        groupId: '507f1f77bcf86cd799439011',
        teacherId: '507f1f77bcf86cd799439012',
        roomId: '507f1f77bcf86cd799439013',
      }),
    ).rejects.toThrow();
  });

  it('createSession throws on conflict with details', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      findOne: jest.fn().mockReturnValue({
        lean: () =>
          ({
            exec: jest.fn().mockResolvedValue({
              _id: 's1',
              date: '2026-05-20',
              startTime: '09:00',
              endTime: '10:00',
              roomId: '507f1f77bcf86cd799439013',
              teacherId: '507f1f77bcf86cd799439012',
              groupId: '507f1f77bcf86cd799439011',
            }),
          }) as any,
      }),
      create: jest.fn(),
    } as any;
    const studentModel = {} as any;
    const userModel = {
      findById: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue({ role: 'teacher' }) }),
      }),
    } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
    );
    await expect(
      service.createSession({
        date: '2026-05-20',
        startTime: '09:00',
        endTime: '10:00',
        groupId: '507f1f77bcf86cd799439011',
        teacherId: '507f1f77bcf86cd799439012',
        roomId: '507f1f77bcf86cd799439013',
      }),
    ).rejects.toThrow('Conflit de planning');
  });

  it('createSession succeeds when no conflict', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      findOne: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      }),
      create: jest.fn().mockResolvedValue({ id: 's1' }),
    } as any;
    const studentModel = {} as any;
    const userModel = {
      findById: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue({ role: 'teacher' }) }),
      }),
    } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
    );
    const res = await service.createSession({
      date: '2026-05-20',
      startTime: '09:00',
      endTime: '10:00',
      groupId: '507f1f77bcf86cd799439011',
      teacherId: '507f1f77bcf86cd799439012',
      roomId: '507f1f77bcf86cd799439013',
      label: 'Math',
    });
    expect(res).toEqual({ id: 's1' });
  });

  it('listSessions filters by role student', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      find: jest.fn().mockReturnValue(makeQuery([])),
    } as any;
    const studentModel = {
      findOne: jest.fn().mockReturnValue({
        lean: () =>
          ({
            exec: jest.fn().mockResolvedValue({ groupId: 'g1' }),
          }) as any,
      }),
    } as any;
    const userModel = {} as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
    );
    await service.listSessions({
      user: { userId: 'u1', email: 's@u.c', role: 'student' as any },
    });
    expect(sessionModel.find).toHaveBeenCalledWith({ groupId: 'g1' });
  });

  it('listSessions filters by role teacher', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      find: jest.fn().mockReturnValue(makeQuery([])),
    } as any;
    const studentModel = {} as any;
    const userModel = {} as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
    );
    await service.listSessions({
      user: { userId: 't1', email: 't@u.c', role: 'teacher' as any },
    });
    expect(sessionModel.find).toHaveBeenCalledWith({ teacherId: 't1' });
  });

  it('listSessions allows admin filters', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      find: jest.fn().mockReturnValue(makeQuery([])),
    } as any;
    const studentModel = {} as any;
    const userModel = {} as any;
    const service = new PlanningService(roomModel, sessionModel, studentModel, userModel);
    await service.listSessions({
      user: { userId: 'a1', email: 'a@u.c', role: 'admin' as any },
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    });
    expect(sessionModel.find).toHaveBeenCalledWith({
      date: { $gte: new Date('2026-05-01'), $lte: new Date('2026-05-31') },
      groupId: 'g1',
      teacherId: 't1',
      roomId: 'r1',
    });
  });

  it('updateSession validates conflicts', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      findById: jest.fn().mockReturnValue({
        lean: () =>
          ({
            exec: jest.fn().mockResolvedValue({
              _id: 's1',
              date: new Date('2026-05-20'),
              startTime: '09:00',
              endTime: '10:00',
              groupId: 'g1',
              teacherId: 't1',
              roomId: 'r1',
            }),
          }) as any,
      }),
      findOne: jest.fn().mockReturnValue({
        lean: () =>
          ({
            exec: jest.fn().mockResolvedValue({
              roomId: 'r1',
              teacherId: 't1',
              groupId: 'g1',
            }),
          }) as any,
      }),
    } as any;
    const studentModel = {} as any;
    const userModel = {
      findById: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue({ role: 'teacher' }) }),
      }),
    } as any;
    const service = new PlanningService(roomModel, sessionModel, studentModel, userModel);
    await expect(
      service.updateSession('s1', {
        startTime: '09:30',
        endTime: '10:30',
      } as any),
    ).rejects.toThrow('Conflit');
  });
});
