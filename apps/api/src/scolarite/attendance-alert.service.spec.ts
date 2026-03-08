import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { AttendanceAlertService } from './attendance-alert.service';
import { AttendanceAlert } from './schemas/attendance-alert.schema';
import { SemesterResult } from './schemas/semester-result.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Attendance } from '../attendance/attendance.schema';
import { Session } from '../planning/session.schema';
import { Group } from '../academic/group.schema';
import { AuditLogService } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';

const IDS = {
  actor:   '507f1f77bcf86cd799439001',
  offer:   '507f1f77bcf86cd799439002',
  student: '507f1f77bcf86cd799439003',
  group:   '507f1f77bcf86cd799439004',
  alert:   '507f1f77bcf86cd799439005',
  session: '507f1f77bcf86cd799439006',
};

const actor = { userId: IDS.actor, role: 'scolarite', email: 'sc@test.ci' };

const makeModel = (data: any = null) => ({
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),
  findById: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(data),
  }),
  findOne: jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(data),
  }),
  findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
  create: jest.fn().mockResolvedValue(data),
  updateMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }) }),
  aggregate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
});

describe('AttendanceAlertService', () => {
  let service: AttendanceAlertService;
  let alertModel: ReturnType<typeof makeModel>;
  let resultModel: ReturnType<typeof makeModel>;
  let studentModel: ReturnType<typeof makeModel>;
  let attendanceModel: ReturnType<typeof makeModel>;
  let sessionModel: ReturnType<typeof makeModel>;
  let groupModel: ReturnType<typeof makeModel>;

  const defaultAlert = {
    _id: IDS.alert,
    studentId: IDS.student,
    offerId: IDS.offer,
    absenceRate: 35,
    status: 'open',
  };

  beforeEach(async () => {
    alertModel      = makeModel(defaultAlert);
    resultModel     = makeModel();
    studentModel    = makeModel({ _id: IDS.student, firstName: 'Amara', lastName: 'Diallo', email: 'amara@test.ci', groupId: IDS.group });
    attendanceModel = makeModel();
    sessionModel    = makeModel({ _id: IDS.session });
    groupModel      = makeModel({ _id: IDS.group, offerId: IDS.offer });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceAlertService,
        { provide: getModelToken(AttendanceAlert.name),   useValue: alertModel },
        { provide: getModelToken(SemesterResult.name),    useValue: resultModel },
        { provide: getModelToken(StudentProfile.name),    useValue: studentModel },
        { provide: getModelToken(Attendance.name),        useValue: attendanceModel },
        { provide: getModelToken(Session.name),           useValue: sessionModel },
        { provide: getModelToken(Group.name),             useValue: groupModel },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
        { provide: EmailService,    useValue: { sendMail: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<AttendanceAlertService>(AttendanceAlertService);
  });

  // ─── listAlerts ───────────────────────────────────────────────────────────

  describe('listAlerts', () => {
    it('retourne les alertes paginées', async () => {
      alertModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([defaultAlert]),
      });
      alertModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      const r = await service.listAlerts({ skip: 0, limit: 20 });
      expect(r.total).toBe(1);
      expect(r.items).toHaveLength(1);
    });

    it('filtre par offerId et status', async () => {
      alertModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      alertModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      const r = await service.listAlerts({ offerId: IDS.offer, status: 'open', skip: 0, limit: 20 });
      expect(alertModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'open' }),
      );
      expect(r.total).toBe(0);
    });
  });

  // ─── getAlert ─────────────────────────────────────────────────────────────

  describe('getAlert', () => {
    it('retourne une alerte existante', async () => {
      alertModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(defaultAlert),
      });
      const alert = await service.getAlert(IDS.alert);
      expect(alert.absenceRate).toBe(35);
    });

    it('lève NotFoundException si introuvable', async () => {
      alertModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.getAlert(IDS.alert)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateAlert ──────────────────────────────────────────────────────────

  describe('updateAlert', () => {
    it('met à jour le statut d\'une alerte', async () => {
      alertModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(defaultAlert),
      });
      alertModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...defaultAlert, status: 'justified' }),
      });

      const r = await service.updateAlert(IDS.alert, 'justified', actor);
      expect(alertModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('lève NotFoundException si alerte introuvable', async () => {
      alertModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.updateAlert(IDS.alert, 'justified', actor)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── convokeStudent ───────────────────────────────────────────────────────

  describe('convokeStudent', () => {
    it('envoie une convocation et met à jour le statut', async () => {
      alertModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          ...defaultAlert,
          studentId: { firstName: 'Amara', lastName: 'Diallo', email: 'amara@test.ci' },
        }),
      });
      alertModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(defaultAlert) });

      const r = await service.convokeStudent(IDS.alert, actor);
      expect(r.convoked).toBe(true);
    });

    it('lève NotFoundException si alerte introuvable', async () => {
      alertModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.convokeStudent(IDS.alert, actor)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── excludeFromExam ──────────────────────────────────────────────────────

  describe('excludeFromExam', () => {
    it('exclut un étudiant des examens', async () => {
      alertModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(defaultAlert),
      });
      alertModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(defaultAlert) });

      const r = await service.excludeFromExam(IDS.alert, actor);
      expect(r.excluded).toBe(true);
      expect(resultModel.updateMany).toHaveBeenCalled();
    });

    it('lève NotFoundException si alerte introuvable', async () => {
      alertModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.excludeFromExam(IDS.alert, actor)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── checkAlerts ──────────────────────────────────────────────────────────

  describe('checkAlerts', () => {
    it('traite une promotion sans étudiants', async () => {
      groupModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      studentModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const r = await service.checkAlerts(IDS.offer, actor);
      expect(r.studentsChecked).toBe(0);
      expect(r.alertsCreated).toBe(0);
    });

    it('ne crée pas d\'alerte si le taux est sous le seuil', async () => {
      groupModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ _id: IDS.group }]),
      });
      studentModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ _id: IDS.student, groupId: IDS.group, email: 'amara@test.ci', firstName: 'Amara', lastName: 'Diallo' }]),
      });
      studentModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: IDS.student, groupId: IDS.group }),
      });
      // 1 session, 0 absences → taux = 0%
      sessionModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });
      sessionModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ _id: IDS.session }]),
      });
      attendanceModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
      alertModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const r = await service.checkAlerts(IDS.offer, actor);
      expect(r.alertsCreated).toBe(0);
    });
  });

  // ─── getAttendanceReport ──────────────────────────────────────────────────

  describe('getAttendanceReport', () => {
    it('retourne un rapport vide pour une promo sans étudiants', async () => {
      studentModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const r = await service.getAttendanceReport(IDS.offer);
      expect(r.total).toBe(0);
      expect(r.threshold).toBe(30);
    });
  });
});
