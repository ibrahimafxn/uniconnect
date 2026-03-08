import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AdminAcademicService } from './admin-academic.service';
import { AcademicYear } from '../academic/academic-year.schema';
import { Semester } from '../academic/semester.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { Group } from '../academic/group.schema';
import { Program } from '../academic/program.schema';
import { Level } from '../academic/level.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { AcademicCalendarEvent } from './schemas/academic-calendar-event.schema';
import { AuditLogService } from '../audit/audit-log.service';

const makeId = () => new Types.ObjectId().toHexString();

const makeModel = () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  findByIdAndDelete: jest.fn().mockReturnThis(),
  updateMany: jest.fn().mockReturnThis(),
  create: jest.fn(),
  countDocuments: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(null),
});

const actor = { userId: makeId(), role: 'admin', email: 'admin@test.com' };

describe('AdminAcademicService', () => {
  let service: AdminAcademicService;
  let yearModel: ReturnType<typeof makeModel>;
  let semesterModel: ReturnType<typeof makeModel>;
  let offerModel: ReturnType<typeof makeModel>;
  let groupModel: ReturnType<typeof makeModel>;
  let programModel: ReturnType<typeof makeModel>;
  let levelModel: ReturnType<typeof makeModel>;
  let studentModel: ReturnType<typeof makeModel>;
  let calendarEventModel: ReturnType<typeof makeModel>;
  let auditLogService: { log: jest.Mock };

  beforeEach(async () => {
    yearModel = makeModel();
    semesterModel = makeModel();
    offerModel = makeModel();
    groupModel = makeModel();
    programModel = makeModel();
    levelModel = makeModel();
    studentModel = makeModel();
    calendarEventModel = makeModel();
    auditLogService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAcademicService,
        { provide: getModelToken(AcademicYear.name), useValue: yearModel },
        { provide: getModelToken(Semester.name), useValue: semesterModel },
        { provide: getModelToken(ProgramOffer.name), useValue: offerModel },
        { provide: getModelToken(Group.name), useValue: groupModel },
        { provide: getModelToken(Program.name), useValue: programModel },
        { provide: getModelToken(Level.name), useValue: levelModel },
        { provide: getModelToken(StudentProfile.name), useValue: studentModel },
        { provide: getModelToken(AcademicCalendarEvent.name), useValue: calendarEventModel },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get(AdminAcademicService);
  });

  describe('initializeYear', () => {
    const validParams = {
      name: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-07-31',
      isActive: true,
      semesters: [
        { name: 'S1', startDate: '2025-09-01', endDate: '2026-01-31' },
        { name: 'S2', startDate: '2026-02-01', endDate: '2026-07-31' },
      ],
      offers: [],
      actor,
    };

    it('should throw BadRequestException for invalid dates', async () => {
      await expect(
        service.initializeYear({ ...validParams, startDate: 'invalid' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when end <= start', async () => {
      await expect(
        service.initializeYear({ ...validParams, endDate: '2025-08-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create year, semesters and audit log', async () => {
      const yearId = new Types.ObjectId();
      yearModel.updateMany = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
      yearModel.create = jest.fn().mockResolvedValue({ _id: yearId, name: '2025-2026' });
      semesterModel.create = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });

      const result = await service.initializeYear(validParams);

      expect(yearModel.create).toHaveBeenCalled();
      expect(semesterModel.create).toHaveBeenCalledTimes(2);
      expect(result.year.name).toBe('2025-2026');
      expect(result.semesters).toHaveLength(2);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'INIT_ACADEMIC_YEAR' }),
      );
    });
  });

  describe('closeYear', () => {
    it('should throw NotFoundException when year not found', async () => {
      yearModel.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.closeYear(makeId(), actor)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when year is not active', async () => {
      yearModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: makeId(), name: '2024-2025', isActive: false }),
      });
      await expect(service.closeYear(makeId(), actor)).rejects.toThrow(BadRequestException);
    });

    it('should close active year and log audit', async () => {
      const id = makeId();
      yearModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: id, name: '2024-2025', isActive: true }),
      });
      studentModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(120) });
      yearModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

      const result = await service.closeYear(id, actor);

      expect(result.success).toBe(true);
      expect(result.archivedStudents).toBe(120);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CLOSE_ACADEMIC_YEAR' }),
      );
    });
  });

  describe('createCalendarEvent', () => {
    it('should throw NotFoundException when year not found', async () => {
      yearModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      await expect(
        service.createCalendarEvent({
          academicYearId: makeId(),
          type: 'examens',
          label: 'Session 1',
          startDate: '2026-01-10',
          endDate: '2026-01-20',
          actor,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create event and log audit', async () => {
      const yearId = makeId();
      yearModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: yearId, name: '2025-2026' }) }),
      });
      const eventId = new Types.ObjectId();
      calendarEventModel.create = jest.fn().mockResolvedValue({ _id: eventId, type: 'examens', label: 'Session 1' });

      const result = await service.createCalendarEvent({
        academicYearId: yearId,
        type: 'examens',
        label: 'Session 1',
        startDate: '2026-01-10',
        endDate: '2026-01-20',
        actor,
      });

      expect(result.type).toBe('examens');
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE_CALENDAR_EVENT' }),
      );
    });
  });

  describe('updateOfferCapacity', () => {
    it('should throw BadRequestException for negative capacity', async () => {
      await expect(service.updateOfferCapacity(makeId(), -1, actor)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when offer not found', async () => {
      offerModel.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.updateOfferCapacity(makeId(), 30, actor)).rejects.toThrow(NotFoundException);
    });

    it('should update capacity and log audit', async () => {
      const id = makeId();
      offerModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: id, capacity: 30 }),
      });

      const result = await service.updateOfferCapacity(id, 30, actor);
      expect(result.capacity).toBe(30);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE_OFFER_CAPACITY' }),
      );
    });
  });
});
