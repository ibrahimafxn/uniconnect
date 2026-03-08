import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliberationService } from './deliberation.service';
import { Deliberation } from './schemas/deliberation.schema';
import { JuryDecision } from './schemas/jury-decision.schema';
import { SemesterResult } from './schemas/semester-result.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { AuditLogService } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';

const IDS = {
  actor:         '507f1f77bcf86cd799439001',
  deliberation:  '507f1f77bcf86cd799439002',
  semester:      '507f1f77bcf86cd799439003',
  offer:         '507f1f77bcf86cd799439004',
  student1:      '507f1f77bcf86cd799439005',
  student2:      '507f1f77bcf86cd799439006',
};

const actor = { userId: IDS.actor, role: 'scolarite', email: 'sc@test.ci' };

const makeDelib = (overrides: any = {}) => ({
  _id: IDS.deliberation,
  semesterId: IDS.semester,
  offerId: IDS.offer,
  scheduledAt: new Date('2025-12-20'),
  status: 'planned',
  juryMembers: [],
  pvPath: '',
  ...overrides,
});

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
  findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data), lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }) }),
  findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null), lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) }),
  findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
  create: jest.fn().mockResolvedValue(data),
  updateMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
});

describe('DeliberationService', () => {
  let service: DeliberationService;
  let deliberationModel: ReturnType<typeof makeModel>;
  let decisionModel: ReturnType<typeof makeModel>;
  let resultModel: ReturnType<typeof makeModel>;
  let studentModel: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    deliberationModel = makeModel(makeDelib());
    decisionModel     = makeModel({ _id: '507f1f77bcf86cd799439007', decision: 'admitted' });
    resultModel       = makeModel({ _id: '507f1f77bcf86cd799439008', status: 'admitted', studentId: IDS.student1 });
    studentModel      = makeModel({ _id: IDS.student1, firstName: 'Kone', lastName: 'A', email: 'kone@test.ci' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliberationService,
        { provide: getModelToken(Deliberation.name),    useValue: deliberationModel },
        { provide: getModelToken(JuryDecision.name),    useValue: decisionModel },
        { provide: getModelToken(SemesterResult.name),  useValue: resultModel },
        { provide: getModelToken(StudentProfile.name),  useValue: studentModel },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
        { provide: EmailService,    useValue: { sendMail: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<DeliberationService>(DeliberationService);
  });

  // ─── createDeliberation ───────────────────────────────────────────────────

  describe('createDeliberation', () => {
    it('crée une délibération planifiée', async () => {
      deliberationModel.create.mockResolvedValue(makeDelib({ status: 'planned' }));
      const result = await service.createDeliberation(
        { semesterId: IDS.semester, offerId: IDS.offer, scheduledAt: '2025-12-20' },
        actor,
      );
      expect(result.status).toBe('planned');
    });
  });

  // ─── updateDeliberation ───────────────────────────────────────────────────

  describe('updateDeliberation', () => {
    it('modifie une délibération planifiée', async () => {
      deliberationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib()) });
      deliberationModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ scheduledAt: new Date('2025-12-25') })) });
      await service.updateDeliberation(IDS.deliberation, { scheduledAt: '2025-12-25' }, actor);
      expect(deliberationModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('refuse la modification d\'une délibération signée', async () => {
      deliberationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'signed' })) });
      await expect(
        service.updateDeliberation(IDS.deliberation, { scheduledAt: '2025-12-25' }, actor),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── startDeliberation ────────────────────────────────────────────────────

  describe('startDeliberation', () => {
    it('démarre une délibération planifiée', async () => {
      deliberationModel.findById
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'planned' })) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'in_progress' })) });
      resultModel.find.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });
      deliberationModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'in_progress' })) });

      const result = await service.startDeliberation(IDS.deliberation, actor);
      expect(deliberationModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('refuse de démarrer une délibération déjà en cours', async () => {
      deliberationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'in_progress' })) });
      await expect(service.startDeliberation(IDS.deliberation, actor)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── closeDeliberation ────────────────────────────────────────────────────

  describe('closeDeliberation', () => {
    it('clôture une délibération en cours', async () => {
      deliberationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'in_progress' })) });
      deliberationModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'completed' })) });
      await service.closeDeliberation(IDS.deliberation, actor);
      expect(deliberationModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('refuse de clôturer une délibération planifiée', async () => {
      deliberationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'planned' })) });
      await expect(service.closeDeliberation(IDS.deliberation, actor)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── signPv ───────────────────────────────────────────────────────────────

  describe('signPv', () => {
    it('signe un PV généré', async () => {
      deliberationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'completed', pvPath: 'uploads/pv/test.pdf' })) });
      deliberationModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'signed' })) });
      await service.signPv(IDS.deliberation, actor);
      expect(resultModel.updateMany).toHaveBeenCalled();
    });

    it('refuse la signature si le PV n\'est pas généré', async () => {
      deliberationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'completed', pvPath: '' })) });
      await expect(service.signPv(IDS.deliberation, actor)).rejects.toThrow(BadRequestException);
    });

    it('refuse la double signature', async () => {
      deliberationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'signed', pvPath: 'test.pdf' })) });
      await expect(service.signPv(IDS.deliberation, actor)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── publishResults ───────────────────────────────────────────────────────

  describe('publishResults', () => {
    it('refuse la publication si le PV n\'est pas signé', async () => {
      deliberationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'completed' })) });
      await expect(service.publishResults(IDS.deliberation, actor)).rejects.toThrow(BadRequestException);
    });

    it('publie et notifie les étudiants', async () => {
      deliberationModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'signed' })) });
      studentModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ _id: IDS.student1, firstName: 'Kone', lastName: 'A', email: 'kone@test.ci' }]),
      });
      deliberationModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ resultsPublishedAt: new Date() })) });
      const result = await service.publishResults(IDS.deliberation, actor);
      expect(result.notified).toBe(1);
    });
  });

  // ─── generatePv ───────────────────────────────────────────────────────────

  describe('generatePv', () => {
    it('génère le PV après clôture', async () => {
      deliberationModel.findById.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'completed' })) }) });
      decisionModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ studentId: { firstName: 'A', lastName: 'B', studentNumber: 'ML0...' }, decision: 'admitted', mention: 'none' }]),
      });
      deliberationModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
      const result = await service.generatePv(IDS.deliberation, actor);
      expect(result.pvPath).toContain('uploads/pv/');
    });

    it('refuse la génération si la délibération n\'est pas clôturée', async () => {
      deliberationModel.findById.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(makeDelib({ status: 'in_progress' })) }) });
      await expect(service.generatePv(IDS.deliberation, actor)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── mapStatusToDecision ──────────────────────────────────────────────────

  describe('mapStatusToDecision (logique interne)', () => {
    it('mappe les statuts LMD aux décisions jury', () => {
      expect((service as any).mapStatusToDecision('admitted')).toBe('admitted');
      expect((service as any).mapStatusToDecision('retake')).toBe('retake');
      expect((service as any).mapStatusToDecision('aap')).toBe('aap');
      expect((service as any).mapStatusToDecision('excluded')).toBe('excluded');
      expect((service as any).mapStatusToDecision('pending')).toBe('retake');
      expect((service as any).mapStatusToDecision('unknown')).toBe('retake');
    });
  });
});
