import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AdminUsersService } from './admin-users.service';
import { User } from '../users/user.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { TeacherProfile } from '../teacher-profile/teacher-profile.schema';
import { AuditLog } from '../audit/audit-log.schema';
import { BulkImportJob } from './schemas/bulk-import-job.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { Group } from '../academic/group.schema';
import { AcademicYear } from '../academic/academic-year.schema';
import { AuditLogService } from '../audit/audit-log.service';
import { Role } from '../common/roles.enum';

const makeId = () => new Types.ObjectId().toHexString();
const makeModel = (docs: any[] = []) => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  findByIdAndDelete: jest.fn().mockReturnThis(),
  create: jest.fn(),
  countDocuments: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(docs),
});

const actor = { userId: makeId(), role: 'admin', email: 'admin@test.com' };

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let userModel: ReturnType<typeof makeModel>;
  let studentModel: ReturnType<typeof makeModel>;
  let teacherModel: ReturnType<typeof makeModel>;
  let auditLogModel: ReturnType<typeof makeModel>;
  let importJobModel: ReturnType<typeof makeModel>;
  let offerModel: ReturnType<typeof makeModel>;
  let groupModel: ReturnType<typeof makeModel>;
  let academicYearModel: ReturnType<typeof makeModel>;
  let auditLogService: { log: jest.Mock };

  beforeEach(async () => {
    userModel = makeModel();
    studentModel = makeModel();
    teacherModel = makeModel();
    auditLogModel = makeModel();
    importJobModel = makeModel();
    offerModel = makeModel();
    groupModel = makeModel();
    academicYearModel = makeModel();
    auditLogService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(StudentProfile.name), useValue: studentModel },
        { provide: getModelToken(TeacherProfile.name), useValue: teacherModel },
        { provide: getModelToken(AuditLog.name), useValue: auditLogModel },
        { provide: getModelToken(BulkImportJob.name), useValue: importJobModel },
        { provide: getModelToken(ProgramOffer.name), useValue: offerModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
        { provide: getModelToken(AcademicYear.name), useValue: academicYearModel },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get(AdminUsersService);
  });

  describe('listUsers', () => {
    it('should return paginated users enriched with names', async () => {
      const userId = new Types.ObjectId();
      const user = { _id: userId, email: 'a@b.com', role: 'student' };
      // listUsers now uses lean() — mock the chain for user query
      userModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([user]),
      });
      userModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });
      // Student profile join: first call by userId, second call by email (fallback)
      studentModel.find = jest.fn()
        .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([{ userId, firstName: 'Aya', lastName: 'Koné' }]) })
        .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });
      // Teacher profile join
      teacherModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.listUsers({ skip: 0, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].firstName).toBe('Aya');
      expect(result.items[0].lastName).toBe('Koné');
    });

    it('should return null names when no profile found', async () => {
      const user = { _id: new Types.ObjectId(), email: 'admin@uni.com', role: 'admin' };
      userModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([user]),
      });
      userModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });
      const emptyStudentFind = { select: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) };
      studentModel.find = jest.fn().mockReturnValue(emptyStudentFind);
      teacherModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.listUsers({ skip: 0, limit: 10 });
      expect(result.items[0].firstName).toBeNull();
      expect(result.items[0].lastName).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should throw NotFoundException when user not found', async () => {
      userModel.exec.mockResolvedValue(null);
      await expect(service.getUser(makeId())).rejects.toThrow(NotFoundException);
    });

    it('should return user when found', async () => {
      const user = { _id: makeId(), email: 'x@x.com', role: Role.Student };
      userModel.exec.mockResolvedValue(user);
      const result = await service.getUser(makeId());
      expect(result).toEqual(user);
    });
  });

  describe('suspendUser', () => {
    it('should throw NotFoundException when user not found', async () => {
      userModel.exec.mockResolvedValue(null);
      await expect(service.suspendUser(makeId(), actor)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when already suspended', async () => {
      userModel.exec.mockResolvedValue({ _id: makeId(), email: 'x@x.com', suspended: true });
      await expect(service.suspendUser(makeId(), actor)).rejects.toThrow(BadRequestException);
    });

    it('should suspend user and log audit', async () => {
      const id = makeId();
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: id, email: 'x@x.com', role: Role.Student, suspended: false }),
      });
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

      const result = await service.suspendUser(id, actor);

      expect(result.success).toBe(true);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SUSPEND_USER' }),
      );
    });
  });

  describe('reactivateUser', () => {
    it('should throw BadRequestException when not suspended', async () => {
      userModel.exec.mockResolvedValue({ _id: makeId(), email: 'x@x.com', suspended: false });
      await expect(service.reactivateUser(makeId(), actor)).rejects.toThrow(BadRequestException);
    });

    it('should reactivate user and log audit', async () => {
      const id = makeId();
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: id, email: 'x@x.com', role: Role.Student, suspended: true }),
      });
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

      const result = await service.reactivateUser(id, actor);

      expect(result.success).toBe(true);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REACTIVATE_USER' }),
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw NotFoundException when user not found', async () => {
      userModel.exec.mockResolvedValue(null);
      await expect(service.resetPassword(makeId(), actor)).rejects.toThrow(NotFoundException);
    });

    it('should return a temp password and log audit', async () => {
      const id = makeId();
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: id, email: 'x@x.com' }),
      });
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

      const result = await service.resetPassword(id, actor);

      expect(result.tempPassword).toBeDefined();
      expect(result.tempPassword.length).toBeGreaterThanOrEqual(10);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RESET_PASSWORD' }),
      );
    });
  });

  describe('assignRole', () => {
    it('should throw when trying to change SuperAdmin role', async () => {
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: makeId(), email: 'sa@x.com', role: Role.SuperAdmin }),
      });
      await expect(service.assignRole(makeId(), Role.Admin, actor)).rejects.toThrow(BadRequestException);
    });

    it('should assign role and log audit', async () => {
      const id = makeId();
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: id, email: 'x@x.com', role: Role.Teacher }),
      });
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

      const result = await service.assignRole(id, Role.Admin, actor);
      expect(result.success).toBe(true);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ASSIGN_ROLE' }),
      );
    });
  });

  describe('importStudents', () => {
    const offerId = makeId();
    const groupId = makeId();
    const yearId = makeId();

    const validOffer = {
      _id: new Types.ObjectId(offerId),
      programId: new Types.ObjectId(makeId()),
      academicYearId: new Types.ObjectId(yearId),
    };
    const validGroup = {
      _id: new Types.ObjectId(groupId),
      offerId: new Types.ObjectId(offerId),
    };
    const validYear = { _id: new Types.ObjectId(yearId), startDate: new Date('2025-09-01') };

    const rows = [
      { firstName: 'Aya', lastName: 'Koné', gender: 'female' as any, birthDate: '2000-05-15' },
    ];

    beforeEach(() => {
      offerModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(validOffer) }) });
      groupModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(validGroup) }) });
      academicYearModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(validYear) }) });
      studentModel.find = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }) });
      userModel.create = jest.fn().mockResolvedValue({ _id: makeId(), email: 'ml02...@uniconnect.local' });
      studentModel.create = jest.fn().mockResolvedValue({ _id: makeId() });
      importJobModel.create = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });
      importJobModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    });

    it('should throw BadRequestException when offer not found', async () => {
      offerModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      await expect(service.importStudents({ rows, offerId, groupId, actor })).rejects.toThrow(BadRequestException);
    });

    it('should import a valid student row and return credentials', async () => {
      const result = await service.importStudents({ rows, offerId, groupId, actor });
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(result.credentials).toHaveLength(1);
      expect(result.credentials[0].studentNumber).toBeDefined();
    });

    it('should record error for invalid row (missing firstName)', async () => {
      const badRows = [{ firstName: '', lastName: 'Test', gender: 'male' as any, birthDate: '2000-01-01' }];
      const result = await service.importStudents({ rows: badRows, offerId, groupId, actor });
      expect(result.errorCount).toBe(1);
      expect(result.errors[0].row).toBe(1);
    });
  });

  describe('listAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      auditLogModel.exec.mockResolvedValue([{ action: 'SUSPEND_USER' }]);
      auditLogModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      const result = await service.listAuditLogs({ skip: 0, limit: 10 });
      expect(result.total).toBe(1);
    });
  });
});
