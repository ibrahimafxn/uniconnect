import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InscriptionService } from './inscription.service';
import { InscriptionCampaign } from './schemas/inscription-campaign.schema';
import { ApplicationDossier } from './schemas/application-dossier.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { AuditLogService } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';

const ID = {
  actor:    '507f1f77bcf86cd799439001',
  campaign: '507f1f77bcf86cd799439002',
  offer:    '507f1f77bcf86cd799439003',
  student:  '507f1f77bcf86cd799439004',
  dossier:  '507f1f77bcf86cd799439005',
};

const mockActor = { userId: ID.actor, role: 'scolarite', email: 'sc@test.ci' };

const makeCampaign = (overrides = {}) => ({
  _id: ID.campaign,
  name: 'L1 2025-2026',
  offerId: ID.offer,
  startDate: new Date('2025-09-01'),
  endDate: new Date('2025-10-01'),
  capacity: 30,
  status: 'draft',
  requiredDocuments: ['baccalaureat', 'photo'],
  waitingListEnabled: false,
  waitingListLimit: 0,
  ...overrides,
});

const makeModel = (data: any = {}) => ({
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),
  findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  findByIdAndUpdate: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(data),
    populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  }),
  findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(data) }),
  countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
  create: jest.fn().mockResolvedValue(data),
  aggregate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
});

describe('InscriptionService', () => {
  let service: InscriptionService;
  let campaignModel: ReturnType<typeof makeModel>;
  let dossierModel: ReturnType<typeof makeModel>;
  let studentModel: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    campaignModel = makeModel(makeCampaign());
    dossierModel = makeModel();
    studentModel = makeModel({ _id: 'stu1', firstName: 'Kone', lastName: 'A', email: 'kone@test.ci' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InscriptionService,
        { provide: getModelToken(InscriptionCampaign.name), useValue: campaignModel },
        { provide: getModelToken(ApplicationDossier.name), useValue: dossierModel },
        { provide: getModelToken(StudentProfile.name), useValue: studentModel },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
        { provide: EmailService, useValue: { sendMail: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<InscriptionService>(InscriptionService);
  });

  // ─── createCampaign ───────────────────────────────────────────────────────

  describe('createCampaign', () => {
    it('crée une campagne valide', async () => {
      campaignModel.create.mockResolvedValue(makeCampaign({ status: 'draft' }));
      const result = await service.createCampaign(
        {
          name: 'L1 2025-2026',
          offerId: ID.offer,
          startDate: '2025-09-01',
          endDate: '2025-10-01',
          capacity: 30,
        },
        mockActor,
      );
      expect(result.status).toBe('draft');
      expect(campaignModel.create).toHaveBeenCalled();
    });

    it('rejette si endDate <= startDate', async () => {
      await expect(
        service.createCampaign(
          {
            name: 'X',
            offerId: 'offer1',
            startDate: '2025-10-01',
            endDate: '2025-09-01',
            capacity: 10,
          },
          mockActor,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── updateCampaign ───────────────────────────────────────────────────────

  describe('updateCampaign', () => {
    it('bloque la modification d\'une campagne clôturée', async () => {
      campaignModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(makeCampaign({ status: 'closed' })),
      });
      await expect(
        service.updateCampaign(ID.campaign, { status: 'open' }, mockActor),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── deleteCampaign ───────────────────────────────────────────────────────

  describe('deleteCampaign', () => {
    it('supprime un brouillon', async () => {
      campaignModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(makeCampaign({ status: 'draft' })),
      });
      const result = await service.deleteCampaign(ID.campaign, mockActor);
      expect(result).toEqual({ deleted: true });
    });

    it('refuse de supprimer une campagne ouverte', async () => {
      campaignModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(makeCampaign({ status: 'open' })),
      });
      await expect(service.deleteCampaign(ID.campaign, mockActor)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getCampaign ──────────────────────────────────────────────────────────

  describe('getCampaign', () => {
    it('lève NotFoundException si introuvable', async () => {
      campaignModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.getCampaign('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── submitDossier ────────────────────────────────────────────────────────

  describe('submitDossier', () => {
    beforeEach(() => {
      campaignModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(makeCampaign({ status: 'open', capacity: 30 })),
        }),
      });
      studentModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: ID.student, firstName: 'Kone', lastName: 'A', email: 'kone@test.ci' }),
        }),
      });
      dossierModel.findOne.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      dossierModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
    });

    it('crée un dossier complet si toutes les pièces sont fournies', async () => {
      dossierModel.create.mockResolvedValue({ _id: ID.dossier, status: 'pending' });
      const result = await service.submitDossier(
        {
          campaignId: ID.campaign,
          studentId: ID.student,
          submittedDocuments: ['baccalaureat', 'photo'],
        },
        mockActor,
      );
      expect(result).toBeDefined();
    });

    it('marque le dossier "incomplete" si une pièce manque', async () => {
      dossierModel.create.mockResolvedValue({ _id: ID.dossier, status: 'incomplete' });
      const result = await service.submitDossier(
        { campaignId: ID.campaign, studentId: ID.student, submittedDocuments: ['baccalaureat'] },
        mockActor,
      );
      expect(dossierModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ missingDocuments: ['photo'] }),
      );
    });

    it('refuse la soumission si la campagne n\'est pas ouverte', async () => {
      campaignModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(makeCampaign({ status: 'draft' })),
        }),
      });
      await expect(
        service.submitDossier({ campaignId: ID.campaign, studentId: ID.student }, mockActor),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse un doublon de dossier', async () => {
      dossierModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: ID.dossier }) }),
      });
      await expect(
        service.submitDossier({ campaignId: ID.campaign, studentId: ID.student }, mockActor),
      ).rejects.toThrow(BadRequestException);
    });

    it('place en liste d\'attente si capacité atteinte', async () => {
      campaignModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(
            makeCampaign({ status: 'open', capacity: 1, waitingListEnabled: true, waitingListLimit: 10 }),
          ),
        }),
      });
      dossierModel.countDocuments
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(1) }) // approvedCount
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(0) }); // waitingCount
      dossierModel.create.mockResolvedValue({ _id: ID.dossier, status: 'waitlisted' });

      await service.submitDossier({ campaignId: ID.campaign, studentId: ID.student }, mockActor);
      expect(dossierModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'waitlisted', waitingListPosition: 1 }),
      );
    });
  });

  // ─── reviewDossier ────────────────────────────────────────────────────────

  describe('reviewDossier', () => {
    const dossier = { _id: ID.dossier, status: 'pending', studentId: { email: 'x@y.ci', firstName: 'A', lastName: 'B' } };

    beforeEach(() => {
      dossierModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(dossier) });
      dossierModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(dossier) }),
      });
    });

    it('approuve un dossier', async () => {
      await service.reviewDossier(ID.dossier, { decision: 'approved' }, mockActor);
      expect(dossierModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('refuse un rejet sans motif', async () => {
      await expect(
        service.reviewDossier(ID.dossier, { decision: 'rejected' }, mockActor),
      ).rejects.toThrow(BadRequestException);
    });

    it('bloque la modification d\'un dossier déjà approuvé', async () => {
      dossierModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...dossier, status: 'approved' }),
      });
      await expect(
        service.reviewDossier(ID.dossier, { decision: 'rejected', rejectionReason: 'dossier incomplet' }, mockActor),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getCampaignStats ─────────────────────────────────────────────────────

  describe('getCampaignStats', () => {
    it('retourne le taux de remplissage', async () => {
      campaignModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(makeCampaign({ capacity: 30 })),
        }),
      });
      dossierModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(15) });
      dossierModel.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'approved', count: 15 }]) });

      const stats = await service.getCampaignStats(ID.campaign);
      expect(stats.fillRate).toBe(50);
      expect(stats.approved).toBe(15);
    });
  });
});
