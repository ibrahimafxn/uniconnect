import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AdminDashboardService } from './admin-dashboard.service';
import { User } from '../users/user.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Enrollment } from '../students/enrollment.schema';
import { Payment } from '../payments/payment.schema';
import { PaymentPlan } from '../payments/payment-plan.schema';
import { AuditLog } from '../audit/audit-log.schema';
import { AcademicYear } from '../academic/academic-year.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { Program } from '../academic/program.schema';
import { AuditLogService } from '../audit/audit-log.service';

const makeId = () => new Types.ObjectId().toHexString();

const makeModel = () => ({
  find: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  aggregate: jest.fn().mockReturnThis(),
  countDocuments: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
});

const actor = { userId: makeId(), role: 'admin', email: 'admin@test.com' };

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let userModel: ReturnType<typeof makeModel>;
  let studentModel: ReturnType<typeof makeModel>;
  let enrollmentModel: ReturnType<typeof makeModel>;
  let paymentModel: ReturnType<typeof makeModel>;
  let paymentPlanModel: ReturnType<typeof makeModel>;
  let auditLogModel: ReturnType<typeof makeModel>;
  let academicYearModel: ReturnType<typeof makeModel>;
  let offerModel: ReturnType<typeof makeModel>;
  let programModel: ReturnType<typeof makeModel>;
  let auditLogService: { log: jest.Mock };

  beforeEach(async () => {
    userModel = makeModel();
    studentModel = makeModel();
    enrollmentModel = makeModel();
    paymentModel = makeModel();
    paymentPlanModel = makeModel();
    auditLogModel = makeModel();
    academicYearModel = makeModel();
    offerModel = makeModel();
    programModel = makeModel();
    auditLogService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(StudentProfile.name), useValue: studentModel },
        { provide: getModelToken(Enrollment.name), useValue: enrollmentModel },
        { provide: getModelToken(Payment.name), useValue: paymentModel },
        { provide: getModelToken(PaymentPlan.name), useValue: paymentPlanModel },
        { provide: getModelToken(AuditLog.name), useValue: auditLogModel },
        { provide: getModelToken(AcademicYear.name), useValue: academicYearModel },
        { provide: getModelToken(ProgramOffer.name), useValue: offerModel },
        { provide: getModelToken(Program.name), useValue: programModel },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get(AdminDashboardService);
  });

  describe('getExecutiveDashboard', () => {
    it('should return dashboard with finance and student KPIs', async () => {
      const yearId = new Types.ObjectId();
      academicYearModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: yearId, name: '2025-2026' }),
        }),
      });
      studentModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(200) });
      userModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(220) });
      programModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(5) });
      offerModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(12) });
      paymentModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ amount: 300000 }]) }) });
      paymentPlanModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ totalAmount: 500000 }]) }) });
      auditLogModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      enrollmentModel.aggregate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'active', count: 180 }]) });

      const result = await service.getExecutiveDashboard();

      expect(result.activeAcademicYear?.name).toBe('2025-2026');
      expect(result.finance.recoveryRate).toBe(60);
      expect(result.students.total).toBe(200);
    });
  });

  describe('getMesrsReport', () => {
    it('should return structured MESRS report', async () => {
      academicYearModel.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), name: '2025-2026' }),
        }),
      });
      studentModel.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { _id: makeId(), gender: 'female', offerId: new Types.ObjectId() },
            { _id: makeId(), gender: 'male', offerId: new Types.ObjectId() },
            { _id: makeId(), gender: 'female', offerId: new Types.ObjectId() },
          ]),
        }),
      });
      enrollmentModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });
      programModel.find = jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });
      offerModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getMesrsReport();

      expect(result.totalStudents).toBe(3);
      expect(result.byGender.female).toBe(2);
      expect(result.byGender.male).toBe(1);
    });
  });

  describe('broadcastAnnouncement', () => {
    it('should log announcement and return recipient count', async () => {
      userModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(150) });

      const result = await service.broadcastAnnouncement({
        title: 'Rentrée 2025-2026',
        content: 'La rentrée est fixée au 1er septembre 2025.',
        targetRoles: ['student'],
        actor,
      });

      expect(result.success).toBe(true);
      expect(result.recipientCount).toBe(150);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BROADCAST_ANNOUNCEMENT' }),
      );
    });
  });

  describe('getSystemStatus', () => {
    it('should return system status with activity breakdown', async () => {
      auditLogModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(45) });
      auditLogModel.aggregate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { _id: 'SUSPEND_USER', count: 3 },
          { _id: 'ASSIGN_ROLE', count: 12 },
        ]),
      });
      userModel.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(2) });

      const result = await service.getSystemStatus();

      expect(result.system.status).toBe('operational');
      expect(result.users.suspended).toBe(2);
    });
  });
});
