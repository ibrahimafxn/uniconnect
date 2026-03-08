import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentPlan } from './payment-plan.schema';
import { StudentProfile } from '../students/student-profile.schema';

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  @Prop({ required: false, type: Types.ObjectId, ref: PaymentPlan.name })
  planId?: Types.ObjectId;

  @Prop({ required: false, type: Types.ObjectId })
  installmentId?: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  currency!: string;

  @Prop({ required: true })
  paidAt!: Date;

  @Prop({ trim: true })
  reference?: string;

  @Prop({ 
    enum: ['carte_bancaire', 'espece', 'mobile_money'],
    default: 'espece'
  })
  paymentMethod?: 'carte_bancaire' | 'espece' | 'mobile_money';

  @Prop({ enum: ['pending', 'confirmed', 'failed'], default: 'confirmed' })
  status?: 'pending' | 'confirmed' | 'failed';

  @Prop({ trim: true })
  provider?: string; // ex: Orange Money, MTN MoMo, Moov Money
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ studentId: 1, paidAt: -1 });
PaymentSchema.index({ planId: 1, paidAt: -1 });
