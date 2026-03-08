import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StudentProfile } from '../students/student-profile.schema';
import { Session } from '../planning/session.schema';

export enum AbsenceJustificationStatus {
  Submitted = 'submitted',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

@Schema({ timestamps: true })
export class AbsenceJustification extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Session.name })
  sessionId?: Types.ObjectId;

  @Prop({ required: true })
  absenceDate!: Date;

  @Prop({ required: true, trim: true })
  reason!: string;

  @Prop({ enum: AbsenceJustificationStatus, default: AbsenceJustificationStatus.Submitted })
  status!: AbsenceJustificationStatus;

  @Prop({ trim: true })
  decisionNote?: string;

  @Prop({ trim: true })
  originalName?: string;

  @Prop({ trim: true })
  fileName?: string;

  @Prop({ trim: true })
  path?: string;

  @Prop({ trim: true })
  mimeType?: string;

  @Prop()
  size?: number;
}

export const AbsenceJustificationSchema = SchemaFactory.createForClass(AbsenceJustification);
AbsenceJustificationSchema.index({ studentId: 1, createdAt: -1 });
AbsenceJustificationSchema.index({ status: 1, createdAt: -1 });
