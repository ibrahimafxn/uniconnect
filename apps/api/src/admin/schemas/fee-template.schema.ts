import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentMethodCode = 'espece' | 'virement' | 'orange_money' | 'mtn_momo' | 'moov_money';

@Schema({ _id: true })
export class FeeInstallment {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  label!: string; // ex: "Tranche 1"

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  dueDate!: Date;
}

export const FeeInstallmentSchema = SchemaFactory.createForClass(FeeInstallment);

@Schema({ timestamps: true })
export class FeeTemplate extends Document {
  @Prop({ required: true, trim: true })
  label!: string; // ex: "Frais L1 Informatique 2025-2026"

  @Prop({ required: true, type: Types.ObjectId, ref: 'ProgramOffer' })
  offerId!: Types.ObjectId;

  @Prop({ required: true })
  totalAmount!: number;

  @Prop({ required: true, trim: true, default: 'XOF' })
  currency!: string;

  @Prop({ type: [FeeInstallmentSchema], default: [] })
  installments!: FeeInstallment[];

  @Prop({
    type: [String],
    enum: ['espece', 'virement', 'orange_money', 'mtn_momo', 'moov_money'],
    default: ['espece'],
  })
  acceptedMethods!: PaymentMethodCode[];

  @Prop({ default: true })
  isActive!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FeeTemplateSchema = SchemaFactory.createForClass(FeeTemplate);
FeeTemplateSchema.index({ offerId: 1 });
FeeTemplateSchema.index({ isActive: 1 });
