import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ScolariteDashboardService } from './scolarite-dashboard.service';
import { InscriptionCampaign } from './schemas/inscription-campaign.schema';
import { ApplicationDossier } from './schemas/application-dossier.schema';
import { AttendanceAlert } from './schemas/attendance-alert.schema';
import { SemesterResult } from './schemas/semester-result.schema';
import { DocumentRequest } from './schemas/document-request.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Payment } from '../payments/payment.schema';
import { PaymentPlan } from '../payments/payment-plan.schema';
import { AuditLog } from '../audit/audit-log.schema';

const IDS = {
  offer:    '507f1f77bcf86cd799439001',
  campaign: '507f1f77bcf86cd799439002',
  student:  '507f1f77bcf86cd799439003',
};

const makeModel = (data: any = null) => ({
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),
  findById: jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(data),
  }),
  findOne: jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(data),
  }),
  countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
  aggregate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
});

describe('ScolariteDashboardService', () => {
  let service: ScolariteDashboardService;
  let campaignModel: ReturnType<typeof makeModel>;
  let dossierModel: ReturnType<typeof makeModel>;
  let alertModel: ReturnType<typeof makeModel>;
  let resultModel: ReturnType<typeof makeModel>;
  let docRequestModel: ReturnType<typeof makeModel>;
  let studentModel: ReturnType<typeof makeModel>;
  let paymentModel: ReturnType<typeof makeModel>;
  let planModel: ReturnType<typeof makeModel>;
  let auditModel: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    campaignModel   = makeModel();
    dossierModel    = makeModel();
    alertModel      = makeModel();
    resultModel     = makeModel();
    docRequestModel = makeModel();
    studentModel    = makeModel();
    paymentModel    = makeModel();
    planModel       = makeModel();
    auditModel      = makeModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScolariteDashboardService,
        { provide: getModelToken(InscriptionCampaign.name), useValue: campaignModel },
        { provide: getModelToken(ApplicationDossier.name),  useValue: dossierModel },
        { provide: getModelToken(AttendanceAlert.name),     useValue: alertModel },
        { provide: getModelToken(SemesterResult.name),      useValue: resultModel },
        { provide: getModelToken(DocumentRequest.name),     useValue: docRequestModel },
        { provide: getModelToken(StudentProfile.name),      useValue: studentModel },
        { provide: getModelToken(Payment.name),             useValue: paymentModel },
        { provide: getModelToken(PaymentPlan.name),         useValue: planModel },
        { provide: getModelToken(AuditLog.name),            useValue: auditModel },
      ],
    }).compile();

    service = module.get<ScolariteDashboardService>(ScolariteDashboardService);
  });

  // ─── getDashboard ─────────────────────────────────────────────────────────

  describe('getDashboard', () => {
    it('retourne un dashboard agrégé', async () => {
      alertModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(5) });
      docRequestModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(3) });
      campaignModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });
      studentModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(100) });
      planModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });
      paymentModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });
      planModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      const result = await service.getDashboard();
      expect(result).toHaveProperty('inscriptions');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('documents');
      expect(result).toHaveProperty('financial');
      expect(result.alerts.open).toBe(5);
      expect(result.documents.pending).toBe(3);
    });
  });

  // ─── getInscriptionStats ──────────────────────────────────────────────────

  describe('getInscriptionStats', () => {
    it('retourne un tableau vide si aucune campagne', async () => {
      campaignModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });
      const stats = await service.getInscriptionStats();
      expect(stats).toEqual([]);
    });

    it('calcule le taux de remplissage d\'une campagne', async () => {
      const campaign = { _id: IDS.campaign, name: 'L1 Informatique 2025', capacity: 100, status: 'open' };
      campaignModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([campaign]) });
      dossierModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(75) });

      const stats = await service.getInscriptionStats();
      expect(stats).toHaveLength(1);
      expect(stats[0].fillRate).toBe(75);
      expect(stats[0].approved).toBe(75);
    });

    it('retourne fillRate=0 pour une campagne à capacité 0', async () => {
      const campaign = { _id: IDS.campaign, name: 'Campagne test', capacity: 0, status: 'open' };
      campaignModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([campaign]) });
      dossierModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      const stats = await service.getInscriptionStats();
      expect(stats[0].fillRate).toBe(0);
    });
  });

  // ─── getAlertsSummary ─────────────────────────────────────────────────────

  describe('getAlertsSummary', () => {
    it('retourne la distribution des alertes par statut', async () => {
      alertModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { _id: 'open', count: 12 },
          { _id: 'convoked', count: 3 },
        ]),
      });

      const summary = await service.getAlertsSummary();
      expect(summary['open']).toBe(12);
      expect(summary['convoked']).toBe(3);
    });

    it('retourne un objet vide si aucune alerte', async () => {
      alertModel.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
      const summary = await service.getAlertsSummary();
      expect(Object.keys(summary)).toHaveLength(0);
    });
  });

  // ─── getFinancialStats ────────────────────────────────────────────────────

  describe('getFinancialStats', () => {
    it('calcule les stats financières correctement', async () => {
      studentModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(200) });
      planModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          { totalAmount: 500000 },
          { totalAmount: 300000 },
        ]),
      });
      paymentModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          { amount: 400000 },
          { amount: 200000 },
        ]),
      });
      planModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(150) });

      const stats = await service.getFinancialStats();
      expect(stats.totalDue).toBe(800000);
      expect(stats.totalPaid).toBe(600000);
      expect(stats.unpaid).toBe(200000);
      expect(stats.recoveryRate).toBe(75);
      expect(stats.studentsWithDebt).toBe(150);
    });

    it('retourne recoveryRate=0 si aucun plan', async () => {
      studentModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
      planModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });
      paymentModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });
      planModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      const stats = await service.getFinancialStats();
      expect(stats.recoveryRate).toBe(0);
    });
  });

  // ─── getMesrsReport ───────────────────────────────────────────────────────

  describe('getMesrsReport', () => {
    it('génère un rapport MESRS complet', async () => {
      const students = [
        { gender: 'female', status: 'active' },
        { gender: 'male',   status: 'active' },
        { gender: 'male',   status: 'graduated' },
      ];
      studentModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(students) });
      resultModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          { status: 'admitted', semesterAverage: 12 },
          { status: 'retake',   semesterAverage: 7 },
        ]),
      });

      const report = await service.getMesrsReport();
      expect(report.total).toBe(3);
      expect(report.byGender['female']).toBe(1);
      expect(report.byGender['male']).toBe(2);
      expect(report.byStatus['active']).toBe(2);
      expect(report.results.successRate).toBe(50);
    });

    it('filtre par academicYearId si fourni', async () => {
      const yearId = '507f1f77bcf86cd799439099';
      studentModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });
      resultModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });

      const report = await service.getMesrsReport(yearId);
      expect(studentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ academicYearId: expect.any(Object) }),
      );
      expect(report.academicYearId).toBe(yearId);
    });
  });

  // ─── getResultsReport ─────────────────────────────────────────────────────

  describe('getResultsReport', () => {
    it('retourne {total:0} si aucun résultat', async () => {
      resultModel.find.mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });
      const r = await service.getResultsReport(IDS.offer);
      expect(r.total).toBe(0);
    });

    it('calcule les statistiques et la distribution des notes', async () => {
      resultModel.find.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          { status: 'admitted', semesterAverage: 14 },
          { status: 'admitted', semesterAverage: 11 },
          { status: 'retake',   semesterAverage: 8 },
          { status: 'excluded', semesterAverage: 4 },
        ]),
      });

      const r = await service.getResultsReport(IDS.offer);
      expect(r.total).toBe(4);
      expect(r.classAverage).toBe(9.25);
      expect(r.successRate).toBe(50);
      expect(r.distribution['14-16']).toBe(1);
      expect(r.distribution['0-5']).toBe(1);
    });
  });

  // ─── listAuditLogs ────────────────────────────────────────────────────────

  describe('listAuditLogs', () => {
    it('retourne les logs paginés', async () => {
      const logs = [{ action: 'CREATE_CAMPAIGN', entity: 'InscriptionCampaign' }];
      auditModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(logs),
      });
      auditModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      const r = await service.listAuditLogs({ skip: 0, limit: 20 });
      expect(r.total).toBe(1);
      expect(r.items).toHaveLength(1);
    });

    it('applique les filtres de date', async () => {
      auditModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      auditModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      await service.listAuditLogs({ from: '2025-01-01', to: '2025-12-31', skip: 0, limit: 20 });
      expect(auditModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ createdAt: expect.objectContaining({ $gte: expect.any(Date) }) }),
      );
    });
  });
});
