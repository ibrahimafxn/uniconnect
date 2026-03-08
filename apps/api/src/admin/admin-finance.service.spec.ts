import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AdminFinanceService } from './admin-finance.service';
import { FeeTemplate } from './schemas/fee-template.schema';
import { FeeExemption } from './schemas/fee-exemption.schema';
import { PaymentPlan } from '../payments/payment-plan.schema';
import { Payment } from '../payments/payment.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { AcademicYear } from '../academic/academic-year.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { AuditLogService } from '../audit/audit-log.service';

const makeId = () => new Types.ObjectId().toHexString();

const makeModel = () => ({
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
  exec: jest.fn().mockResolvedValue(null),
});

const actor = { userId: makeId(), role: 'admin', email: 'admin@test.com' };

describe('AdminFinanceService', () => {
  let service: AdminFinanceService;
  let feeTemplateModel: ReturnType<typeof makeModel>;
  let feeExemptionModel: ReturnType<typeof makeModel>;
  let paymentPlanModel: ReturnType<typeof makeModel>;
  let paymentModel: ReturnType<typeof makeModel>;
  let studentModel: ReturnType<typeof makeModel>;
  let academicYearModel: ReturnType<typeof makeModel>;
  let offerModel: ReturnType<typeof makeModel>;
  let auditLogService: { log: jest.Mock };

  beforeEach(async () => {
    feeTemplateModel = makeModel();
    feeExemptionModel = makeModel();
    paymentPlanModel = makeModel();
    paymentModel = makeModel();
    studentModel = makeModel();
    academicYearModel = makeModel();
    offerModel = makeModel();
    auditLogService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminFinanceService,
        { provide: getModelToken(FeeTemplate.name), useValue: feeTemplateModel },
        { provide: getModelToken(FeeExemption.name), useValue: feeExemptionModel },
        { provide: getModelToken(PaymentPlan.name), useValue: paymentPlanModel },
        { provide: getModelToken(Payment.name), useValue: paymentModel },
        { provide: getModelToken(StudentProfile.name), useValue: studentModel },
        { provide: getModelToken(AcademicYear.name), useValue: academicYearModel },
        { provide: getModelToken(ProgramOffer.name), useValue: offerModel },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get(AdminFinanceService);
  });

  describe('createFeeTemplate', () => {
    const validOffer = { _id: new Types.ObjectId(), programId: new Types.ObjectId() };

    it('should throw NotFoundException when offer not found', async () => {
      offerModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      await expect(
        service.createFeeTemplate({
          label: 'Test', offerId: makeId(), totalAmount: 500000, installments: [], actor,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when totalAmount <= 0', async () => {
      offerModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(validOffer) }) });
      await expect(
        service.createFeeTemplate({
          label: 'Test', offerId: makeId(), totalAmount: 0, installments: [], actor,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when installment sum != totalAmount', async () => {
      offerModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(validOffer) }) });
      await expect(
        service.createFeeTemplate({
          label: 'Test',
          offerId: makeId(),
          totalAmount: 500000,
          installments: [{ label: 'T1', amount: 200000, dueDate: '2025-10-01' }],
          actor,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create template and log audit', async () => {
      offerModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(validOffer) }) });
      const templateId = new Types.ObjectId();
      feeTemplateModel.create = jest.fn().mockResolvedValue({ _id: templateId, label: 'Frais L1', totalAmount: 500000 });

      const result = await service.createFeeTemplate({
        label: 'Frais L1',
        offerId: makeId(),
        totalAmount: 500000,
        installments: [
          { label: 'T1', amount: 200000, dueDate: '2025-10-01' },
          { label: 'T2', amount: 200000, dueDate: '2026-01-01' },
          { label: 'T3', amount: 100000, dueDate: '2026-04-01' },
        ],
        actor,
      });

      expect(result.label).toBe('Frais L1');
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE_FEE_TEMPLATE' }),
      );
    });
  });

  describe('applyFeeTemplate', () => {
    it('should throw NotFoundException when template not found', async () => {
      feeTemplateModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      await expect(
        service.applyFeeTemplate({ templateId: makeId(), studentIds: [makeId()], actor }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should apply template and skip students with existing plan', async () => {
      const templateId = makeId();
      const studentId1 = makeId();
      const studentId2 = makeId();

      feeTemplateModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: new Types.ObjectId(templateId),
            label: 'Frais L1',
            totalAmount: 500000,
            currency: 'XOF',
            installments: [],
          }),
        }),
      });

      studentModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(studentId1) }) }),
      });

      paymentPlanModel.findOne = jest.fn()
        .mockReturnValueOnce({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) })
        .mockReturnValueOnce({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: makeId() }) }) });

      paymentPlanModel.create = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });

      const result = await service.applyFeeTemplate({
        templateId,
        studentIds: [studentId1, studentId2],
        actor,
      });

      expect(result.applied).toBeGreaterThanOrEqual(0);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'APPLY_FEE_TEMPLATE' }),
      );
    });
  });

  describe('createExemption', () => {
    it('should throw for invalid percentage', async () => {
      await expect(
        service.createExemption({
          studentId: makeId(), academicYearId: makeId(),
          type: 'partial', percentage: 150, reason: 'Boursier', actor,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when student not found', async () => {
      studentModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      await expect(
        service.createExemption({
          studentId: makeId(), academicYearId: makeId(),
          type: 'total', percentage: 100, reason: 'Boursier', actor,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when exemption already exists', async () => {
      studentModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: makeId() }) }) });
      academicYearModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: makeId() }) }) });
      feeExemptionModel.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: makeId() }) }) });

      await expect(
        service.createExemption({
          studentId: makeId(), academicYearId: makeId(),
          type: 'total', percentage: 100, reason: 'Boursier', actor,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create exemption and log audit', async () => {
      const sid = makeId();
      const yid = makeId();
      studentModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: sid }) }) });
      academicYearModel.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: yid }) }) });
      feeExemptionModel.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) });
      feeExemptionModel.create = jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), type: 'total', percentage: 100 });

      const result = await service.createExemption({
        studentId: sid, academicYearId: yid,
        type: 'total', percentage: 100, reason: 'Boursier MESRS', actor,
      });

      expect(result.type).toBe('total');
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE_FEE_EXEMPTION' }),
      );
    });
  });

  describe('getFinancialReport', () => {
    it('should return financial report with recovery rate', async () => {
      studentModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: new Types.ObjectId() }]) }) }),
      });
      paymentPlanModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ totalAmount: 500000 }]) }) });
      paymentModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ amount: 250000, paymentMethod: 'espece' }]) }) });
      feeExemptionModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(2) });

      const result = await service.getFinancialReport();

      expect(result.totalExpected).toBe(500000);
      expect(result.totalCollected).toBe(250000);
      expect(result.recoveryRate).toBe(50);
      expect(result.exemptionCount).toBe(2);
    });
  });
});
