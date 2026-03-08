import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LmdService } from './lmd.service';
import { LmdConfig } from './schemas/lmd-config.schema';
import { EvaluationPeriod } from './schemas/evaluation-period.schema';
import { SemesterResult } from './schemas/semester-result.schema';
import { Subject } from '../notes/schemas/subject.schema';
import { Evaluation } from '../notes/schemas/evaluation.schema';
import { Grade } from '../notes/schemas/grade.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { User } from '../users/user.schema';
import { Group } from '../academic/group.schema';
import { AuditLogService } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';

const IDS = {
  actor:    '507f1f77bcf86cd799439001',
  offer:    '507f1f77bcf86cd799439002',
  semester: '507f1f77bcf86cd799439003',
  student:  '507f1f77bcf86cd799439004',
  period:   '507f1f77bcf86cd799439005',
  subject1: '507f1f77bcf86cd799439006',
  subject2: '507f1f77bcf86cd799439007',
  group:    '507f1f77bcf86cd799439008',
};

const actor = { userId: IDS.actor, role: 'scolarite', email: 'sc@test.ci' };

const defaultConfig = {
  _id: '507f1f77bcf86cd799439009',
  offerId: IDS.offer,
  compensationEnabled: true,
  compensationMinAverage: 8,
  passThreshold: 10,
  retakeThreshold: 7,
  ectsPerSemester: 30,
  aapEnabled: true,
  aapMaxDebts: 2,
  ue: [],
};

const makeModel = (data: any = null) => ({
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),
  findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data), lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }) }),
  findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data), lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }) }),
  findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
  create: jest.fn().mockResolvedValue(data),
  aggregate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
});

describe('LmdService', () => {
  let service: LmdService;
  let configModel: ReturnType<typeof makeModel>;
  let periodModel: ReturnType<typeof makeModel>;
  let resultModel: ReturnType<typeof makeModel>;
  let evaluationModel: ReturnType<typeof makeModel>;
  let gradeModel: ReturnType<typeof makeModel>;
  let studentModel: ReturnType<typeof makeModel>;
  let groupModel: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    configModel   = makeModel(defaultConfig);
    periodModel   = makeModel({ _id: IDS.period, status: 'open', gradeDeadline: new Date('2025-12-31'), semesterId: IDS.semester, offerId: IDS.offer, remindersSentAt: [] });
    resultModel   = makeModel({ _id: '507f1f77bcf86cd79943900a', status: 'admitted', semesterAverage: 12 });
    evaluationModel = makeModel();
    gradeModel    = makeModel();
    studentModel  = makeModel({ _id: IDS.student, firstName: 'Kone', groupId: IDS.group });
    groupModel    = makeModel({ _id: IDS.group, offerId: IDS.offer });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LmdService,
        { provide: getModelToken(LmdConfig.name),        useValue: configModel },
        { provide: getModelToken(EvaluationPeriod.name), useValue: periodModel },
        { provide: getModelToken(SemesterResult.name),   useValue: resultModel },
        { provide: getModelToken(Subject.name),          useValue: makeModel() },
        { provide: getModelToken(Evaluation.name),       useValue: evaluationModel },
        { provide: getModelToken(Grade.name),            useValue: gradeModel },
        { provide: getModelToken(StudentProfile.name),   useValue: studentModel },
        { provide: getModelToken(User.name),             useValue: makeModel() },
        { provide: getModelToken(Group.name),            useValue: groupModel },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
        { provide: EmailService,    useValue: { sendMail: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<LmdService>(LmdService);
  });

  // ─── getConfig ────────────────────────────────────────────────────────────

  describe('getConfig', () => {
    it('retourne la configuration existante', async () => {
      configModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(defaultConfig) });
      const config = await service.getConfig(IDS.offer);
      expect(config.passThreshold).toBe(10);
    });

    it('lève NotFoundException si absente', async () => {
      configModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.getConfig(IDS.offer)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── upsertConfig ─────────────────────────────────────────────────────────

  describe('upsertConfig', () => {
    it('crée une configuration LMD', async () => {
      configModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(defaultConfig) });
      const result = await service.upsertConfig(IDS.offer, { passThreshold: 10 }, actor);
      expect(configModel.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  // ─── createPeriod ─────────────────────────────────────────────────────────

  describe('createPeriod', () => {
    it('crée une période d\'évaluation', async () => {
      periodModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      periodModel.create.mockResolvedValue({ _id: IDS.period, status: 'open' });
      const result = await service.createPeriod(
        { semesterId: IDS.semester, offerId: IDS.offer, gradeDeadline: '2025-12-31' },
        actor,
      );
      expect(periodModel.create).toHaveBeenCalled();
    });

    it('refuse un doublon de période', async () => {
      periodModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: IDS.period }) });
      await expect(
        service.createPeriod({ semesterId: IDS.semester, offerId: IDS.offer, gradeDeadline: '2025-12-31' }, actor),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── lockPeriod ───────────────────────────────────────────────────────────

  describe('lockPeriod', () => {
    it('verrouille une période ouverte', async () => {
      periodModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: IDS.period, status: 'open' }) });
      periodModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ status: 'locked' }) });
      const result = await service.lockPeriod(IDS.period, actor);
      expect(periodModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('refuse de verrouiller une période déjà verrouillée', async () => {
      periodModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: IDS.period, status: 'locked' }) });
      await expect(service.lockPeriod(IDS.period, actor)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Moteur LMD — determineDecision ──────────────────────────────────────

  describe('determineDecision (logique interne)', () => {
    const callDecision = (avg: number, ueAvgs: number[], config: any) => {
      const ueResults = ueAvgs.map((a) => ({ average: a, validated: a >= config.passThreshold }));
      return (service as any).determineDecision(avg, ueResults, config);
    };

    const config = {
      passThreshold: 10,
      retakeThreshold: 7,
      aapEnabled: true,
      aapMaxDebts: 2,
    };

    it('retourne "admitted" si moyenne >= 10', () => {
      expect(callDecision(12, [12], config)).toBe('admitted');
    });

    it('retourne "retake" si 7 <= moyenne < 10 sans AAP possible', () => {
      // 3 dettes > aapMaxDebts=2
      expect(callDecision(8, [5, 5, 5], config)).toBe('retake');
    });

    it('retourne "aap" si conditions remplies', () => {
      // 1 dette <= aapMaxDebts=2, moyenne 8 >= retakeThreshold=7
      expect(callDecision(8, [5, 14], config)).toBe('aap');
    });

    it('retourne "excluded" si moyenne < retakeThreshold', () => {
      expect(callDecision(5, [3, 7], config)).toBe('excluded');
    });

    it('retourne "admitted" si moyenne exactement 10', () => {
      expect(callDecision(10, [10], config)).toBe('admitted');
    });
  });

  // ─── wasCompensated ───────────────────────────────────────────────────────

  describe('wasCompensated', () => {
    it('détecte une compensation', () => {
      const ueResults = [
        { average: 9, validated: false },
        { average: 14, validated: true },
      ];
      const config = { compensationEnabled: true, compensationMinAverage: 8 };
      expect((service as any).wasCompensated(ueResults, config)).toBe(true);
    });

    it('retourne false si compensation désactivée', () => {
      const ueResults = [{ average: 9, validated: false }];
      const config = { compensationEnabled: false, compensationMinAverage: 8 };
      expect((service as any).wasCompensated(ueResults, config)).toBe(false);
    });
  });

  // ─── listResults ──────────────────────────────────────────────────────────

  describe('listResults', () => {
    it('retourne les résultats paginés', async () => {
      resultModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ status: 'admitted', semesterAverage: 12 }]),
      });
      resultModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      const r = await service.listResults({ semesterId: IDS.semester, skip: 0, limit: 20 });
      expect(r.total).toBe(1);
      expect(r.items).toHaveLength(1);
    });
  });

  // ─── calculateResults — config manquante ─────────────────────────────────

  describe('calculateResults', () => {
    it('rejette si la configuration LMD est absente', async () => {
      configModel.findOne.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      await expect(
        service.calculateResults(IDS.semester, IDS.offer, actor),
      ).rejects.toThrow(BadRequestException);
    });

    it('calcule les résultats pour une promotion vide', async () => {
      configModel.findOne.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(defaultConfig) }) });
      groupModel.find.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });
      studentModel.find.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });

      const result = await service.calculateResults(IDS.semester, IDS.offer, actor);
      expect(result.studentsProcessed).toBe(0);
    });
  });
});
