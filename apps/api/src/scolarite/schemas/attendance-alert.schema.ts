import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type AlertStatus = 'open' | 'justified' | 'convoked' | 'excluded_exam';

@Schema({ timestamps: true })
export class AttendanceAlert extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StudentProfile', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProgramOffer', required: true })
  offerId: Types.ObjectId;

  @Prop({ required: true })
  absenceRate: number;

  @Prop({ default: 'open', type: String })
  status: AlertStatus;

  @Prop()
  notifiedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  handledBy: Types.ObjectId;
}

export const AttendanceAlertSchema = SchemaFactory.createForClass(AttendanceAlert);
AttendanceAlertSchema.index({ studentId: 1, offerId: 1 });
AttendanceAlertSchema.index({ status: 1 });
