import { PlanningService } from './planning.service';

const makeQuery = (result: any) => ({
  sort: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  exec: jest.fn().mockResolvedValue(result),
});

describe('PlanningService', () => {
  const oid1 = '507f1f77bcf86cd799439011';
  const oid2 = '507f1f77bcf86cd799439012';
  const oid3 = '507f1f77bcf86cd799439013';
  const actor = { userId: 'u1', role: 'admin' } as any;
  it('createRoom calls model.create', async () => {
    const roomModel = { create: jest.fn().mockResolvedValue({}) } as any;
    const sessionModel = {} as any;
    const studentModel = {} as any;
    const userModel = {} as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
      auditLog,
    );
    await service.createRoom({ name: 'A1', capacity: 30 }, actor);
    expect(roomModel.create).toHaveBeenCalled();
  });

  it('listRooms returns items', async () => {
    const roomModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ name: 'A1' }])),
    } as any;
    const sessionModel = {} as any;
    const studentModel = {} as any;
    const userModel = {} as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
      auditLog,
    );
    const res = await service.listRooms();
    expect(res).toHaveLength(1);
  });

  it('updateRoom and deleteRoom call model', async () => {
    const roomModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(roomModel, {} as any, {} as any, {} as any, auditLog);
    await service.updateRoom(oid1, { name: 'B1' }, actor);
    await service.deleteRoom(oid1, actor);
    expect(roomModel.findByIdAndUpdate).toHaveBeenCalledWith(
      oid1,
      { name: 'B1' },
      { new: true },
    );
    expect(roomModel.findByIdAndDelete).toHaveBeenCalledWith(oid1);
  });

  it('createSession rejects invalid time format', async () => {
    const sessionModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn() }) }),
      create: jest.fn(),
    } as any;
    const userModel = {
      findById: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue({ role: 'teacher' }) }),
      }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService({} as any, sessionModel, {} as any, userModel, auditLog);
    await expect(
      service.createSession({
        date: '2026-05-20',
        startTime: 'xx',
        endTime: '10:00',
        groupId: oid1,
        teacherId: oid2,
        roomId: oid3,
      }, actor),
    ).rejects.toThrow('Horaire invalide');
  });

  it('createSession rejects invalid date', async () => {
    const sessionModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn() }) }),
      create: jest.fn(),
    } as any;
    const userModel = {
      findById: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue({ role: 'teacher' }) }),
      }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService({} as any, sessionModel, {} as any, userModel, auditLog);
    await expect(
      service.createSession({
        date: 'invalid-date',
        startTime: '09:00',
        endTime: '10:00',
        groupId: oid1,
        teacherId: oid2,
        roomId: oid3,
      }, actor),
    ).rejects.toThrow('Date invalide');
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
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
      auditLog,
    );
    await expect(
      service.createSession({
        date: '2026-05-20',
        startTime: '10:00',
        endTime: '09:00',
        groupId: oid1,
        teacherId: oid2,
        roomId: oid3,
      }, actor),
    ).rejects.toThrow();
  });

  it('createSession throws on conflict with details', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      findOne: jest.fn().mockReturnValue({
        lean: () =>
          ({
            exec: jest.fn().mockResolvedValue({
              _id: oid1,
              date: '2026-05-20',
              startTime: '09:00',
              endTime: '10:00',
              roomId: oid3,
              teacherId: oid2,
              groupId: oid1,
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
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
      auditLog,
    );
    await expect(
      service.createSession({
        date: '2026-05-20',
        startTime: '09:00',
        endTime: '10:00',
        groupId: oid1,
        teacherId: oid2,
        roomId: oid3,
      }, actor),
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
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
      auditLog,
    );
    const res = await service.createSession({
      date: '2026-05-20',
      startTime: '09:00',
      endTime: '10:00',
      groupId: oid1,
      teacherId: oid2,
      roomId: oid3,
      label: 'Math',
    }, actor);
    expect(res).toEqual({ id: 's1' });
  });

  it('createSession rejects unknown teacher', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      findOne: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      }),
      create: jest.fn(),
    } as any;
    const studentModel = {} as any;
    const userModel = {
      findById: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
      auditLog,
    );
    await expect(
      service.createSession({
        date: '2026-05-20',
        startTime: '09:00',
        endTime: '10:00',
        groupId: oid1,
        teacherId: oid2,
        roomId: oid3,
      }, actor),
    ).rejects.toThrow('Enseignant introuvable');
  });

  it('createSession rejects non-teacher user', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      findOne: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      }),
      create: jest.fn(),
    } as any;
    const studentModel = {} as any;
    const userModel = {
      findById: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue({ role: 'student' }) }),
      }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
      auditLog,
    );
    await expect(
      service.createSession({
        date: '2026-05-20',
        startTime: '09:00',
        endTime: '10:00',
        groupId: oid1,
        teacherId: oid2,
        roomId: oid3,
      }, actor),
    ).rejects.toThrow('Utilisateur non enseignant');
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
            exec: jest.fn().mockResolvedValue({ groupId: oid1 }),
          }) as any,
      }),
    } as any;
    const userModel = {} as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
      auditLog,
    );
    await service.listSessions({
      user: { userId: 'u1', email: 's@u.c', role: 'student' as any },
    });
    expect(sessionModel.find).toHaveBeenCalledWith({ groupId: oid1 });
  });

  it('listSessions returns empty when student has no group', async () => {
    const sessionModel = {
      find: jest.fn().mockReturnValue(makeQuery([])),
    } as any;
    const studentModel = {
      findOne: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService({} as any, sessionModel, studentModel, {} as any, auditLog);
    const res = await service.listSessions({
      user: { userId: 'u1', email: 's@u.c', role: 'student' as any },
    });
    expect(res).toEqual([]);
    expect(sessionModel.find).not.toHaveBeenCalled();
  });

  it('listSessions filters by role teacher', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      find: jest.fn().mockReturnValue(makeQuery([])),
    } as any;
    const studentModel = {} as any;
    const userModel = {} as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(
      roomModel,
      sessionModel,
      studentModel,
      userModel,
      auditLog,
    );
    await service.listSessions({
      user: { userId: oid2, email: 't@u.c', role: 'teacher' as any },
    });
    expect(sessionModel.find).toHaveBeenCalledWith({ teacherId: oid2 });
  });

  it('listSessions allows admin filters', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      find: jest.fn().mockReturnValue(makeQuery([])),
    } as any;
    const studentModel = {} as any;
    const userModel = {} as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(roomModel, sessionModel, studentModel, userModel, auditLog);
    await service.listSessions({
      user: { userId: 'a1', email: 'a@u.c', role: 'admin' as any },
      groupId: oid1,
      teacherId: oid2,
      roomId: oid3,
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    });
    expect(sessionModel.find).toHaveBeenCalledWith({
      date: { $gte: new Date('2026-05-01'), $lte: new Date('2026-05-31') },
      groupId: oid1,
      teacherId: oid2,
      roomId: oid3,
    });
  });

  it('updateSession updates when no conflict', async () => {
    const roomModel = {} as any;
    const sessionModel = {
      findById: jest.fn().mockReturnValue({
        lean: () =>
          ({
            exec: jest.fn().mockResolvedValue({
              _id: oid1,
              date: new Date('2026-05-20'),
              startTime: '09:00',
              endTime: '10:00',
              groupId: oid1,
              teacherId: oid2,
              roomId: oid3,
            }),
          }) as any,
      }),
      findOne: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: oid1 }),
      }),
    } as any;
    const userModel = {
      findById: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue({ role: 'teacher' }) }),
      }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(roomModel, sessionModel, {} as any, userModel, auditLog);
    const res = await service.updateSession(oid1, { label: 'Math' } as any, actor);
    expect(res).toEqual({ id: oid1 });
    expect(sessionModel.findByIdAndUpdate).toHaveBeenCalled();
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
              groupId: oid1,
              teacherId: oid2,
              roomId: oid3,
            }),
          }) as any,
      }),
      findOne: jest.fn().mockReturnValue({
        lean: () =>
          ({
            exec: jest.fn().mockResolvedValue({
              roomId: oid3,
              teacherId: oid2,
              groupId: oid1,
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
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService(roomModel, sessionModel, studentModel, userModel, auditLog);
    await expect(
      service.updateSession(oid1, {
        startTime: '09:30',
        endTime: '10:30',
      } as any, actor),
    ).rejects.toThrow('Conflit');
  });

  it('updateSession rejects missing session', async () => {
    const sessionModel = {
      findById: jest.fn().mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService({} as any, sessionModel, {} as any, {} as any, auditLog);
    await expect(service.updateSession(oid1, {} as any, actor)).rejects.toThrow(
      'Séance introuvable',
    );
  });

  it('deleteSession calls model', async () => {
    const sessionModel = {
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new PlanningService({} as any, sessionModel, {} as any, {} as any, auditLog);
    await service.deleteSession(oid1, actor);
    expect(sessionModel.findByIdAndDelete).toHaveBeenCalledWith(oid1);
  });
});
