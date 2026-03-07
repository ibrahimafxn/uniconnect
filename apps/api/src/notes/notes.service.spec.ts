import { NotesService } from './notes.service';
import { Role } from '../common/roles.enum';

const makeQuery = (result: any) => ({
  sort: () => ({ exec: jest.fn().mockResolvedValue(result) }),
  exec: jest.fn().mockResolvedValue(result),
  lean: () => ({ exec: jest.fn().mockResolvedValue(result) }),
});

describe('NotesService', () => {
  const oid1 = '507f1f77bcf86cd799439011';
  const oid2 = '507f1f77bcf86cd799439012';
  const actor = { userId: oid1, role: Role.Admin } as any;
  const claimModel = {} as any;
  const emailService = { sendMail: jest.fn().mockResolvedValue(true) } as any;

  it('listSubjects filters by level', async () => {
    const subjectModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ name: 'Math' }])),
    } as any;
    const service = new NotesService(
      subjectModel,
      {} as any,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    const res = await service.listSubjects(oid1);
    expect(res).toHaveLength(1);
  });

  it('createSubject logs audit', async () => {
    const subjectModel = { create: jest.fn().mockResolvedValue({ _id: oid1, name: 'Math', coefficient: 2 }) } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new NotesService(
      subjectModel,
      {} as any,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      auditLog,
      emailService,
    );
    const res = await service.createSubject({ name: 'Math', coefficient: 2, levelId: oid2 }, actor);
    expect(res._id).toBe(oid1);
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('updateSubject logs audit', async () => {
    const subjectModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: oid1 }) }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new NotesService(
      subjectModel,
      {} as any,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      auditLog,
      emailService,
    );
    const res = await service.updateSubject(oid1, { name: 'Math' } as any, actor);
    expect(res._id).toBe(oid1);
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('deleteSubject logs audit', async () => {
    const subjectModel = {
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: oid1, name: 'Math' }) }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new NotesService(
      subjectModel,
      {} as any,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      auditLog,
      emailService,
    );
    const res = await service.deleteSubject(oid1, actor);
    expect(res._id).toBe(oid1);
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('listEvaluations filters', async () => {
    const evaluationModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ _id: oid1 }])),
    } as any;
    const service = new NotesService(
      {} as any,
      evaluationModel,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    const res = await service.listEvaluations({ groupId: oid1, subjectId: oid2 });
    expect(res).toHaveLength(1);
  });

  it('createEvaluation logs audit', async () => {
    const evaluationModel = { create: jest.fn().mockResolvedValue({ _id: oid1, title: 'DS1' }) } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new NotesService(
      {} as any,
      evaluationModel,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      auditLog,
      emailService,
    );
    const res = await service.createEvaluation({ title: 'DS1', date: '2026-06-12', subjectId: oid1, groupId: oid2 }, actor);
    expect(res._id).toBe(oid1);
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('updateEvaluation rejects invalid date', async () => {
    const service = new NotesService(
      {} as any,
      {} as any,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    await expect(service.updateEvaluation(oid1, { date: 'invalid' } as any, actor)).rejects.toThrow('Date invalide');
  });

  it('updateEvaluation logs audit with valid date', async () => {
    const evaluationModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: oid1 }) }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new NotesService(
      {} as any,
      evaluationModel,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      auditLog,
      emailService,
    );
    const res = await service.updateEvaluation(oid1, { date: '2026-06-12', title: 'DS2' } as any, actor);
    expect(res._id).toBe(oid1);
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('updateEvaluation returns null without audit when not found', async () => {
    const evaluationModel = {
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new NotesService(
      {} as any,
      evaluationModel,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      auditLog,
      emailService,
    );
    const res = await service.updateEvaluation(oid1, { title: 'DS2' } as any, actor);
    expect(res).toBeNull();
    expect(auditLog.log).not.toHaveBeenCalled();
  });

  it('listGroupStudents returns items', async () => {
    const studentModel = {
      find: jest.fn().mockReturnValue(makeQuery([{ _id: oid1 }])),
    } as any;
    const service = new NotesService(
      {} as any,
      {} as any,
      {} as any,
      claimModel,
      studentModel,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    const res = await service.listGroupStudents(oid1);
    expect(res).toHaveLength(1);
  });

  it('listGrades returns items', async () => {
    const gradeModel = {
      find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: oid1 }]) }),
    } as any;
    const service = new NotesService(
      {} as any,
      {} as any,
      gradeModel,
      claimModel,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    const res = await service.listGrades(oid1);
    expect(res).toHaveLength(1);
  });

  it('createEvaluation rejects invalid date', async () => {
    const service = new NotesService(
      {} as any,
      {} as any,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    await expect(
      service.createEvaluation({ title: 'DS', date: 'invalid', subjectId: oid1, groupId: oid2 }, actor),
    ).rejects.toThrow('Date invalide');
  });

  it('upsertGrades validates score', async () => {
    const evaluationModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ maxScore: 20 }) }) }),
    } as any;
    const service = new NotesService(
      {} as any,
      evaluationModel,
      { bulkWrite: jest.fn() } as any,
      claimModel,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    await expect(service.upsertGrades(oid1, [{ studentId: oid2, score: 30 }], actor)).rejects.toThrow('Score invalide');
  });

  it('upsertGrades rejects missing evaluation', async () => {
    const evaluationModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) }),
    } as any;
    const service = new NotesService(
      {} as any,
      evaluationModel,
      { bulkWrite: jest.fn() } as any,
      claimModel,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    await expect(service.upsertGrades(oid1, [{ studentId: oid2, score: 10 }], actor)).rejects.toThrow('Evaluation introuvable');
  });

  it('upsertGrades succeeds', async () => {
    const evaluationModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ maxScore: 20 }) }) }),
    } as any;
    const gradeModel = { bulkWrite: jest.fn().mockResolvedValue({}) } as any;
    const auditLog = { log: jest.fn().mockResolvedValue({}) } as any;
    const service = new NotesService(
      {} as any,
      evaluationModel,
      gradeModel,
      claimModel,
      {} as any,
      {} as any,
      auditLog,
      emailService,
    );
    const res = await service.upsertGrades(oid1, [{ studentId: oid2, score: 10 }], actor);
    expect(res.success).toBe(true);
    expect(auditLog.log).toHaveBeenCalled();
  });

  it('getStudentSummary denies other student', async () => {
    const studentModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid1 }) }) }),
    } as any;
    const service = new NotesService(
      {} as any,
      {} as any,
      {} as any,
      claimModel,
      studentModel,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    await expect(service.getStudentSummary(oid2, { userId: oid2, role: Role.Student, email: 'a@b.c' } as any)).rejects.toThrow('Accès refusé');
  });

  it('getStudentSummary returns averages', async () => {
    const subjectModel = {
      find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: oid1, name: 'Math', coefficient: 2 }]) }),
    } as any;
    const evaluationModel = {
      find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: oid2, subjectId: oid1, groupId: oid1, maxScore: 20 }]) }),
    } as any;
    const gradeModel = {
      find: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue([{ evaluationId: oid2, score: 10 }]) }) }),
    } as any;
    const studentModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid1, groupId: oid1, firstName: 'A', lastName: 'B', studentNumber: 'X' }) }) }),
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid1 }) }) }),
    } as any;
    const groupModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid1, levelId: oid1 }) }) }),
    } as any;

    const service = new NotesService(
      subjectModel,
      evaluationModel,
      gradeModel,
      claimModel,
      studentModel,
      groupModel,
      { log: jest.fn() } as any,
      emailService,
    );
    const res = await service.getStudentSummary(oid1, { userId: oid1, role: Role.Student, email: 'a@b.c' } as any);
    expect(res.overallAverage).toBe(10);
  });

  it('getStudentSummary throws when student missing', async () => {
    const studentModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) }),
    } as any;
    const service = new NotesService(
      {} as any,
      {} as any,
      {} as any,
      claimModel,
      studentModel,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    await expect(service.getStudentSummary(oid1, { userId: oid1, role: Role.Admin } as any)).rejects.toThrow('Etudiant introuvable');
  });

  it('getStudentSummary throws when group missing', async () => {
    const studentModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid1, groupId: oid2 }) }) }),
    } as any;
    const groupModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) }),
    } as any;
    const service = new NotesService(
      {} as any,
      {} as any,
      {} as any,
      claimModel,
      studentModel,
      groupModel,
      { log: jest.fn() } as any,
      emailService,
    );
    await expect(service.getStudentSummary(oid1, { userId: oid1, role: Role.Admin } as any)).rejects.toThrow('Groupe introuvable');
  });

  it('getStudentSummary returns null averages with no grades', async () => {
    const subjectModel = {
      find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: oid1, name: 'Math', coefficient: 2 }]) }),
    } as any;
    const evaluationModel = {
      find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    } as any;
    const gradeModel = {
      find: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue([]) }) }),
    } as any;
    const studentModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid1, groupId: oid2, firstName: 'A', lastName: 'B', studentNumber: 'X' }) }) }),
    } as any;
    const groupModel = {
      findById: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid2, levelId: oid2 }) }) }),
    } as any;
    const service = new NotesService(
      subjectModel,
      evaluationModel,
      gradeModel,
      claimModel,
      studentModel,
      groupModel,
      { log: jest.fn() } as any,
      emailService,
    );
    const res = await service.getStudentSummary(oid1, { userId: oid1, role: Role.Admin } as any);
    expect(res.overallAverage).toBeNull();
    expect(res.subjects[0].average).toBeNull();
  });

  it('getStudentSummaryForEmail rejects missing email', async () => {
    const service = new NotesService(
      {} as any,
      {} as any,
      {} as any,
      claimModel,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    await expect(service.getStudentSummaryForEmail(undefined, actor)).rejects.toThrow('Email manquant');
  });

  it('getStudentSummaryForEmail rejects missing profile', async () => {
    const studentModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(null) }) }),
    } as any;
    const service = new NotesService(
      {} as any,
      {} as any,
      {} as any,
      claimModel,
      studentModel,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    await expect(service.getStudentSummaryForEmail('a@b.c', actor)).rejects.toThrow('Etudiant introuvable');
  });

  it('getStudentSummaryForEmail returns summary', async () => {
    const studentModel = {
      findOne: jest.fn().mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: oid1 }) }) }),
    } as any;
    const service = new NotesService(
      {} as any,
      {} as any,
      {} as any,
      claimModel,
      studentModel,
      {} as any,
      { log: jest.fn() } as any,
      emailService,
    );
    const spy = jest.spyOn(service, 'getStudentSummary').mockResolvedValue({ overallAverage: 12 } as any);
    const res = await service.getStudentSummaryForEmail('a@b.c', { userId: oid1, role: Role.Admin } as any);
    expect(res.overallAverage).toBe(12);
    expect(spy).toHaveBeenCalledWith(oid1, { userId: oid1, role: Role.Admin });
  });
});
