import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Evaluation } from './evaluation.schema';
import { StudentProfile } from '../../students/student-profile.schema';

export enum NoteClaimStatus {
  Pending = 'pending',
  InReview = 'in_review',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

@Schema({ timestamps: true })
export class NoteClaim extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: Evaluation.name })
  evaluationId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  reason!: string;

  @Prop()
  requestedScore?: number;

  @Prop({ required: true, enum: NoteClaimStatus, default: NoteClaimStatus.Pending })
  status!: NoteClaimStatus;

  @Prop()
  decisionNote?: string;

  @Prop()
  deadlineAt?: Date;

  @Prop({ type: Types.ObjectId })
  handledBy?: Types.ObjectId;

  @Prop()
  handledAt?: Date;
}

export const NoteClaimSchema = SchemaFactory.createForClass(NoteClaim);
NoteClaimSchema.index({ studentId: 1, evaluationId: 1 }, { unique: true });
NoteClaimSchema.index({ status: 1, createdAt: -1 });
