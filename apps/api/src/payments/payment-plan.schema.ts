import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StudentProfile } from '../students/student-profile.schema';

@Schema({ _id: true })
export class PaymentInstallment {
  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  dueDate!: Date;

  @Prop({ trim: true })
  label?: string;
}

export const PaymentInstallmentSchema =
  SchemaFactory.createForClass(PaymentInstallment);

@Schema({ timestamps: true })
export class PaymentPlan extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  label!: string; // ex: Mensuel 2025-2026

  @Prop({ required: true })
  totalAmount!: number;

  @Prop({ required: true })
  currency!: string; // XOF, EUR, etc

  @Prop({ type: [PaymentInstallmentSchema], default: [] })
  installments!: PaymentInstallment[];
}

export const PaymentPlanSchema = SchemaFactory.createForClass(PaymentPlan);
PaymentPlanSchema.index({ studentId: 1 });
