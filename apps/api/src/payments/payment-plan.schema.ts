import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StudentProfile } from '../students/student-profile.schema';

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
}

export const PaymentPlanSchema = SchemaFactory.createForClass(PaymentPlan);
PaymentPlanSchema.index({ studentId: 1 });
