import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentPlan, PaymentInstallment } from './payment-plan.schema';
import { Payment } from './payment.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { EmailService } from '../common/email.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(PaymentPlan.name)
    private readonly planModel: Model<PaymentPlan>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    private readonly emailService: EmailService,
  ) {}

  listPlans() {
    return this.planModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).exec();
  }

  createPlan(data: {
    studentId: string;
    label: string;
    totalAmount: number;
    currency: string;
    installments?: { amount: number; dueDate: string; label?: string }[];
  }) {
    const installments: PaymentInstallment[] = (data.installments ?? []).map(
      (inst) => ({
        amount: inst.amount,
        dueDate: new Date(inst.dueDate),
        label: inst.label,
      }),
    );
    return this.planModel.create({
      ...data,
      installments,
    });
  }

  listPayments() {
    return this.paymentModel.find({ isDeleted: { $ne: true } }).sort({ paidAt: -1 }).exec();
  }

  async createPayment(data: {
    studentId: string;
    planId?: string;
    installmentId?: string;
    amount: number;
    currency: string;
    paidAt: Date;
    reference?: string;
    paymentMethod?: 'carte_bancaire' | 'espece' | 'mobile_money';
    provider?: string;
    status?: 'pending' | 'confirmed' | 'failed';
  }) {
    if (data.planId) {
      if (!data.installmentId) {
        throw new BadRequestException('installmentId required for plan payment');
      }
      const plan = await this.planModel.findById(data.planId).lean().exec();
      if (!plan) {
        throw new NotFoundException('Payment plan not found');
      }
      const installment = plan.installments?.find(
        (inst) => String(inst._id) === data.installmentId,
      );
      if (!installment) {
        throw new BadRequestException('Installment not found in plan');
      }

      const paidAgg = await this.paymentModel
        .aggregate([
          {
            $match: {
              planId: new Types.ObjectId(data.planId),
              installmentId: new Types.ObjectId(data.installmentId),
            },
          },
          { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
        ])
        .exec();
      const alreadyPaid = paidAgg[0]?.totalPaid ?? 0;
      const remaining = Math.max(0, (installment.amount ?? 0) - alreadyPaid);
      if (data.amount > remaining) {
        throw new BadRequestException(
          'Payment exceeds remaining amount for installment',
        );
      }
    }

    const payment = await this.paymentModel.create(data);
    this.sendPaymentConfirmationIfPossible(
      data.studentId,
      data.amount,
      data.currency,
    ).catch(() => undefined);
    return payment;
  }

  updatePlan(id: string, data: Partial<PaymentPlan>) {
    return this.planModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  deletePlan(id: string) {
    return this.planModel
      .findByIdAndUpdate(id, { $set: { isDeleted: true, deletedAt: new Date() } }, { returnDocument: 'after' })
      .exec();
  }

  updatePayment(id: string, data: Partial<Payment>) {
    return this.paymentModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  deletePayment(id: string) {
    return this.paymentModel
      .findByIdAndUpdate(id, { $set: { isDeleted: true, deletedAt: new Date() } }, { returnDocument: 'after' })
      .exec();
  }

  async listUnpaid(asOf: Date) {
    const plans = await this.planModel.find().lean().exec();
    if (plans.length === 0) return [];

    // Get all payments (even those without planId, we'll link by studentId)
    const payments = await this.paymentModel.find().lean().exec();

    // Map payments to plans by studentId
    // payments can either have planId (direct link) or be linked by studentId
    const paidByPlanInstallment = new Map<string, Map<string, number>>();
    
    payments.forEach((payment) => {
      // Find the plan this payment belongs to
      let planId = payment.planId ? String(payment.planId) : null;
      
      if (!planId) {
        // Try to find plan by studentId
        const plan = plans.find((p) => String(p.studentId) === String(payment.studentId));
        planId = plan ? String(plan._id) : null;
      }
      
      if (planId && plans.some((p) => String(p._id) === planId)) {
        // Only process if plan exists
        if (!paidByPlanInstallment.has(planId)) {
          paidByPlanInstallment.set(planId, new Map());
        }
        const instId = payment.installmentId
          ? String(payment.installmentId)
          : 'none';
        const byInst = paidByPlanInstallment.get(planId)!;
        byInst.set(instId, (byInst.get(instId) ?? 0) + (payment.amount ?? 0));
      }
    });

    const studentIds = plans.map((plan) => plan.studentId);
    const students = await this.studentModel
      .find({ _id: { $in: studentIds } })
      .lean()
      .exec();
    const studentsById = new Map(
      students.map((s) => [String(s._id), s]),
    );

    return plans
      .map((plan) => {
        const planKey = String(plan._id);
        const byInst = paidByPlanInstallment.get(planKey) ?? new Map();
        const hasInstallments =
          plan.installments && plan.installments.length > 0;

        const dueInstallments = hasInstallments
          ? plan.installments.filter((inst) => {
              const due = new Date(inst.dueDate);
              return !Number.isNaN(due.getTime()) && due <= asOf;
            })
          : [];

        const totalDueAmount = hasInstallments
          ? dueInstallments.reduce((sum, inst) => sum + (inst.amount ?? 0), 0)
          : plan.totalAmount;

        const totalPaid = hasInstallments
          ? dueInstallments.reduce((sum, inst) => {
              const key = String(inst._id ?? '');
              return sum + (byInst.get(key) ?? 0);
            }, 0)
          : Array.from(byInst.values()).reduce((a, b) => a + b, 0);

        const balanceDue = Math.max(0, totalDueAmount - totalPaid);
        const student = studentsById.get(String(plan.studentId));
        
        // Only return if there's actually an unpaid balance
        return {
          planId: plan._id,
          studentId: plan.studentId,
          studentName: student
            ? `${student.lastName} ${student.firstName}`
            : 'N/A',
          studentNumber: student?.studentNumber ?? 'N/A',
          totalAmount: plan.totalAmount,
          dueAmount: totalDueAmount,
          totalPaid,
          balanceDue,
          currency: plan.currency,
        };
      })
      .filter((row) => row.balanceDue > 0)
      .sort((a, b) => b.balanceDue - a.balanceDue);
  }

  async buildReceipt(paymentId: string) {
    const payment = await this.paymentModel.findById(paymentId).lean().exec();
    if (!payment) throw new NotFoundException('Payment not found');
    const student = await this.studentModel
      .findById(payment.studentId)
      .lean()
      .exec();
    const plan = payment.planId
      ? await this.planModel.findById(payment.planId).lean().exec()
      : null;
    return { payment, student, plan };
  }

  async buildPlanExport(planId: string) {
    const plan = await this.planModel.findById(planId).lean().exec();
    if (!plan) throw new NotFoundException('Plan not found');
    
    const student = await this.studentModel
      .findById(plan.studentId)
      .lean()
      .exec();
    
    // Get all payments for this plan
    const payments = await this.paymentModel
      .find({ planId })
      .lean()
      .exec();
    
    // Calculate paid amount per installment
    const installmentStats: Record<string, { paid: number; status: 'paid' | 'partial' | 'unpaid' }> = {};
    (plan.installments ?? []).forEach((inst: any) => {
      const paidForInst = payments
        .filter((p) => p.installmentId === (inst._id || ''))
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const dueAmount = inst.amount || 0;
      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (paidForInst >= dueAmount) {
        status = 'paid';
      } else if (paidForInst > 0) {
        status = 'partial';
      }
      
      installmentStats[inst._id || ''] = { paid: paidForInst, status };
    });
    
    return { plan, student, installmentStats };
  }

  async listMyPayments(email: string) {
    const student = await this.studentModel
      .findOne({ email: email.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) return [];
    return this.paymentModel.find({ studentId: student._id }).sort({ paidAt: -1 }).exec();
  }

  findStudentByEmail(email: string) {
    return this.studentModel.findOne({ email: email.toLowerCase().trim() }).lean().exec();
  }

  async getMyPlan(email: string) {
    const student = await this.studentModel
      .findOne({ email: email.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) return null;
    const plan = await this.planModel.findOne({ studentId: student._id }).lean().exec();
    if (!plan) return null;
    const payments = await this.paymentModel.find({ planId: plan._id }).lean().exec();
    const installmentStats: Record<string, { paid: number; status: 'paid' | 'partial' | 'unpaid' }> = {};
    (plan.installments ?? []).forEach((inst: any) => {
      const paidForInst = payments
        .filter((p) => String(p.installmentId) === String(inst._id))
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const dueAmount = inst.amount || 0;
      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (paidForInst >= dueAmount) status = 'paid';
      else if (paidForInst > 0) status = 'partial';
      installmentStats[String(inst._id)] = { paid: paidForInst, status };
    });
    return { plan, installmentStats, student }; 
  }

  async createStudentPayment(email: string, data: {
    planId?: string;
    installmentId?: string;
    amount: number;
    currency: string;
    reference?: string;
    provider?: string;
  }) {
    const student = await this.studentModel
      .findOne({ email: email.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) throw new NotFoundException('Profil étudiant introuvable');
    if (data.planId) {
      const plan = await this.planModel.findById(data.planId).lean().exec();
      if (!plan) throw new NotFoundException('Plan de paiement introuvable');
      if (String(plan.studentId) !== String(student._id)) {
        throw new BadRequestException('Plan non autorisé');
      }
    }
    return this.createPayment({
      studentId: String(student._id),
      planId: data.planId,
      installmentId: data.installmentId,
      amount: data.amount,
      currency: data.currency,
      paidAt: new Date(),
      reference: data.reference,
      paymentMethod: 'mobile_money',
      provider: data.provider,
      status: 'confirmed',
    });
  }

  private async sendPaymentConfirmationIfPossible(
    studentId: string,
    amount: number,
    currency: string,
  ) {
    const student = await this.studentModel.findById(studentId).lean().exec();
    if (!student?.email) return;
    await this.emailService.sendMail({
      to: student.email,
      subject: 'Confirmation de paiement',
      text: `Paiement recu: ${amount} ${currency}. Merci.`,
    });
  }
}
