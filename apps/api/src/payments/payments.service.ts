import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    return this.planModel.find().sort({ createdAt: -1 }).exec();
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
    return this.paymentModel.find().sort({ paidAt: -1 }).exec();
  }

  createPayment(data: {
    studentId: string;
    planId?: string;
    installmentId?: string;
    amount: number;
    currency: string;
    paidAt: Date;
    reference?: string;
  }) {
    return this.paymentModel.create(data).then((payment) => {
      this.sendPaymentConfirmationIfPossible(
        data.studentId,
        data.amount,
        data.currency,
      ).catch(() => undefined);
      return payment;
    });
  }

  updatePlan(id: string, data: Partial<PaymentPlan>) {
    return this.planModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  deletePlan(id: string) {
    return this.planModel.findByIdAndDelete(id).exec();
  }

  updatePayment(id: string, data: Partial<Payment>) {
    return this.paymentModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  deletePayment(id: string) {
    return this.paymentModel.findByIdAndDelete(id).exec();
  }

  async listUnpaid(asOf: Date) {
    const plans = await this.planModel.find().lean().exec();
    if (plans.length === 0) return [];

    const planIds = plans.map((plan) => plan._id);
    const paymentsAgg = await this.paymentModel
      .aggregate([
        { $match: { planId: { $in: planIds } } },
        { $group: { _id: '$planId', totalPaid: { $sum: '$amount' } } },
      ])
      .exec();

    const paidByPlan = new Map<string, number>();
    paymentsAgg.forEach((row) => {
      paidByPlan.set(String(row._id), row.totalPaid ?? 0);
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
        const totalPaid = paidByPlan.get(String(plan._id)) ?? 0;
        const dueAmount =
          plan.installments && plan.installments.length > 0
            ? plan.installments
                .filter((inst) => new Date(inst.dueDate) <= asOf)
                .reduce((sum, inst) => sum + (inst.amount ?? 0), 0)
            : plan.totalAmount;
        const balanceDue = Math.max(0, dueAmount - totalPaid);
        const student = studentsById.get(String(plan.studentId));
        return {
          planId: plan._id,
          studentId: plan.studentId,
          studentName: student
            ? `${student.lastName} ${student.firstName}`
            : 'N/A',
          studentNumber: student?.studentNumber ?? 'N/A',
          totalAmount: plan.totalAmount,
          dueAmount,
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
