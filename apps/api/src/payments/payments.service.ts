import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentPlan } from './payment-plan.schema';
import { Payment } from './payment.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(PaymentPlan.name)
    private readonly planModel: Model<PaymentPlan>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
  ) {}

  listPlans() {
    return this.planModel.find().sort({ createdAt: -1 }).exec();
  }

  createPlan(data: {
    studentId: string;
    label: string;
    totalAmount: number;
    currency: string;
  }) {
    return this.planModel.create(data);
  }

  listPayments() {
    return this.paymentModel.find().sort({ paidAt: -1 }).exec();
  }

  createPayment(data: {
    studentId: string;
    planId?: string;
    amount: number;
    currency: string;
    paidAt: Date;
    reference?: string;
  }) {
    return this.paymentModel.create(data);
  }
}
