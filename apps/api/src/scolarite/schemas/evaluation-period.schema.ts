import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type PeriodStatus = 'open' | 'locked' | 'closed';

@Schema({ timestamps: true })
export class EvaluationPeriod extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Semester', required: true })
  semesterId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProgramOffer', required: true })
  offerId: Types.ObjectId;

  @Prop({ required: true })
  gradeDeadline: Date;

  @Prop({ default: 'open' })
  status: PeriodStatus;

  @Prop()
  lockedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  lockedBy: Types.ObjectId;

  @Prop({ type: [Date], default: [] })
  remindersSentAt: Date[];
}

export const EvaluationPeriodSchema = SchemaFactory.createForClass(EvaluationPeriod);
EvaluationPeriodSchema.index({ semesterId: 1, offerId: 1 }, { unique: true });
