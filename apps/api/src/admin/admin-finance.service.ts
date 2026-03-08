import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeeTemplate, PaymentMethodCode } from './schemas/fee-template.schema';
import { FeeExemption, ExemptionType } from './schemas/fee-exemption.schema';
import { PaymentPlan } from '../payments/payment-plan.schema';
import { Payment } from '../payments/payment.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { AcademicYear } from '../academic/academic-year.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';

export interface FeeInstallmentInput {
  label: string;
  amount: number;
  dueDate: string;
}

@Injectable()
export class AdminFinanceService {
  constructor(
    @InjectModel(FeeTemplate.name)
    private readonly feeTemplateModel: Model<FeeTemplate>,
    @InjectModel(FeeExemption.name)
    private readonly feeExemptionModel: Model<FeeExemption>,
    @InjectModel(PaymentPlan.name)
    private readonly paymentPlanModel: Model<PaymentPlan>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(AcademicYear.name)
    private readonly academicYearModel: Model<AcademicYear>,
    @InjectModel(ProgramOffer.name)
    private readonly offerModel: Model<ProgramOffer>,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ─── Fee templates ───────────────────────────────────────────────────────────

  async createFeeTemplate(params: {
    label: string;
    offerId: string;
    totalAmount: number;
    currency?: string;
    installments: FeeInstallmentInput[];
    acceptedMethods?: PaymentMethodCode[];
    actor: AuditActor;
  }) {
    const offer = await this.offerModel.findById(params.offerId).lean().exec();
    if (!offer) throw new NotFoundException('Offre introuvable.');

    if (params.totalAmount <= 0) {
      throw new BadRequestException('Le montant total doit être supérieur à 0.');
    }

    const installmentSum = params.installments.reduce((sum, i) => sum + i.amount, 0);
    if (params.installments.length > 0 && installmentSum !== params.totalAmount) {
      throw new BadRequestException(
        `La somme des tranches (${installmentSum}) doit égaler le montant total (${params.totalAmount}).`,
      );
    }

    const template = await this.feeTemplateModel.create({
      label: params.label,
      offerId: params.offerId,
      totalAmount: params.totalAmount,
      currency: params.currency ?? 'XOF',
      installments: params.installments.map((i) => ({
        ...i,
        dueDate: new Date(i.dueDate),
      })),
      acceptedMethods: params.acceptedMethods ?? ['espece'],
    });

    await this.auditLogService.log({
      action: 'CREATE_FEE_TEMPLATE',
      entity: 'FeeTemplate',
      entityId: String(template._id),
      actor: params.actor,
      metadata: { label: params.label, offerId: params.offerId, totalAmount: params.totalAmount },
    });

    return template;
  }

  async listFeeTemplates(params: {
    offerId?: string;
    skip: number;
    limit: number;
  }) {
    const filter: Record<string, any> = { isActive: true };
    if (params.offerId) filter.offerId = params.offerId;

    const [items, total] = await Promise.all([
      this.feeTemplateModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.feeTemplateModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async updateFeeTemplate(
    id: string,
    data: Partial<{
      label: string;
      totalAmount: number;
      installments: FeeInstallmentInput[];
      acceptedMethods: PaymentMethodCode[];
      isActive: boolean;
    }>,
    actor: AuditActor,
  ) {
    const template = await this.feeTemplateModel.findById(id).exec();
    if (!template) throw new NotFoundException('Modèle de frais introuvable.');

    const update: Record<string, any> = {};
    if (data.label !== undefined) update.label = data.label;
    if (data.totalAmount !== undefined) update.totalAmount = data.totalAmount;
    if (data.installments !== undefined) {
      update.installments = data.installments.map((i) => ({
        ...i,
        dueDate: new Date(i.dueDate),
      }));
    }
    if (data.acceptedMethods !== undefined) update.acceptedMethods = data.acceptedMethods;
    if (data.isActive !== undefined) update.isActive = data.isActive;

    const updated = await this.feeTemplateModel
      .findByIdAndUpdate(id, update, { returnDocument: 'after' })
      .exec();

    await this.auditLogService.log({
      action: 'UPDATE_FEE_TEMPLATE',
      entity: 'FeeTemplate',
      entityId: id,
      actor,
      metadata: update,
    });

    return updated;
  }

  /**
   * Apply a fee template to a list of students:
   * creates a PaymentPlan per student based on the template.
   */
  async applyFeeTemplate(params: {
    templateId: string;
    studentIds: string[];
    actor: AuditActor;
  }) {
    const template = await this.feeTemplateModel.findById(params.templateId).lean().exec();
    if (!template) throw new NotFoundException('Modèle de frais introuvable.');

    let applied = 0;
    const skipped: string[] = [];

    for (const studentId of params.studentIds) {
      const student = await this.studentModel.findById(studentId).lean().exec();
      if (!student) {
        skipped.push(studentId);
        continue;
      }

      // Check no plan already exists for this student with same label
      const existing = await this.paymentPlanModel
        .findOne({ studentId, label: template.label })
        .lean()
        .exec();
      if (existing) {
        skipped.push(studentId);
        continue;
      }

      await this.paymentPlanModel.create({
        studentId,
        label: template.label,
        totalAmount: template.totalAmount,
        currency: template.currency,
        installments: template.installments.map((i) => ({
          _id: new Types.ObjectId(),
          label: i.label,
          amount: i.amount,
          dueDate: i.dueDate,
        })),
      });
      applied++;
    }

    await this.auditLogService.log({
      action: 'APPLY_FEE_TEMPLATE',
      entity: 'FeeTemplate',
      entityId: params.templateId,
      actor: params.actor,
      metadata: { applied, skipped: skipped.length },
    });

    return { applied, skipped: skipped.length };
  }

  // ─── Fee exemptions ──────────────────────────────────────────────────────────

  async createExemption(params: {
    studentId: string;
    academicYearId: string;
    type: ExemptionType;
    percentage: number;
    reason: string;
    actor: AuditActor;
  }) {
    if (params.percentage < 0 || params.percentage > 100) {
      throw new BadRequestException('Le pourcentage doit être entre 0 et 100.');
    }

    const [student, year] = await Promise.all([
      this.studentModel.findById(params.studentId).lean().exec(),
      this.academicYearModel.findById(params.academicYearId).lean().exec(),
    ]);

    if (!student) throw new NotFoundException('Étudiant introuvable.');
    if (!year) throw new NotFoundException('Année académique introuvable.');

    const existing = await this.feeExemptionModel
      .findOne({ studentId: params.studentId, academicYearId: params.academicYearId })
      .lean()
      .exec();
    if (existing) {
      throw new BadRequestException('Une exonération existe déjà pour cet étudiant cette année.');
    }

    const exemption = await this.feeExemptionModel.create({
      studentId: params.studentId,
      academicYearId: params.academicYearId,
      type: params.type,
      percentage: params.percentage,
      reason: params.reason,
      approvedBy: params.actor.userId,
    });

    await this.auditLogService.log({
      action: 'CREATE_FEE_EXEMPTION',
      entity: 'FeeExemption',
      entityId: String(exemption._id),
      actor: params.actor,
      metadata: {
        studentId: params.studentId,
        type: params.type,
        percentage: params.percentage,
        reason: params.reason,
      },
    });

    return exemption;
  }

  async listExemptions(params: {
    academicYearId?: string;
    skip: number;
    limit: number;
  }) {
    const filter: Record<string, any> = {};
    if (params.academicYearId) filter.academicYearId = params.academicYearId;

    const [items, total] = await Promise.all([
      this.feeExemptionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.feeExemptionModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async deleteExemption(id: string, actor: AuditActor) {
    const exemption = await this.feeExemptionModel.findByIdAndDelete(id).exec();
    if (!exemption) throw new NotFoundException('Exonération introuvable.');

    await this.auditLogService.log({
      action: 'DELETE_FEE_EXEMPTION',
      entity: 'FeeExemption',
      entityId: id,
      actor,
    });

    return { success: true };
  }

  // ─── Financial report ────────────────────────────────────────────────────────

  async getFinancialReport(academicYearId?: string) {
    // Total expected (sum of all payment plan totalAmounts for students in the year)
    const studentFilter: Record<string, any> = {};
    if (academicYearId) studentFilter.academicYearId = academicYearId;

    const students = await this.studentModel
      .find(studentFilter)
      .select('_id')
      .lean()
      .exec();

    const studentIds = students.map((s) => s._id);

    const [plans, payments, exemptionCount] = await Promise.all([
      this.paymentPlanModel
        .find({ studentId: { $in: studentIds } })
        .lean()
        .exec(),
      this.paymentModel
        .find({ studentId: { $in: studentIds } })
        .lean()
        .exec(),
      this.feeExemptionModel
        .countDocuments(academicYearId ? { academicYearId } : {})
        .exec(),
    ]);

    const totalExpected = plans.reduce((sum, p) => sum + (p.totalAmount ?? 0), 0);
    const totalCollected = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const totalBalance = totalExpected - totalCollected;
    const recoveryRate =
      totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    // Payment method breakdown
    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      const method = p.paymentMethod ?? 'espece';
      byMethod[method] = (byMethod[method] ?? 0) + p.amount;
    }

    return {
      academicYearId,
      totalStudents: studentIds.length,
      totalExpected,
      totalCollected,
      totalBalance,
      recoveryRate,
      exemptionCount,
      byPaymentMethod: byMethod,
      currency: 'XOF',
    };
  }
}
