import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Assignment } from './assignment.schema';
import { StudentProfile } from '../students/student-profile.schema';

export enum SubmissionStatus {
  Submitted = 'submitted',
  Reviewed = 'reviewed',
  Late = 'late',
}

@Schema({ timestamps: true })
export class AssignmentSubmission extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: Assignment.name })
  assignmentId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  @Prop({ trim: true })
  comment?: string;

  @Prop({ required: true, trim: true })
  originalName!: string;

  @Prop({ required: true, trim: true })
  fileName!: string;

  @Prop({ required: true, trim: true })
  path!: string;

  @Prop({ required: true, trim: true })
  mimeType!: string;

  @Prop({ required: true })
  size!: number;

  @Prop({ enum: SubmissionStatus, default: SubmissionStatus.Submitted })
  status!: SubmissionStatus;

  @Prop()
  score?: number;

  @Prop({ trim: true })
  feedback?: string;
}

export const AssignmentSubmissionSchema = SchemaFactory.createForClass(AssignmentSubmission);
AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
AssignmentSubmissionSchema.index({ studentId: 1, createdAt: -1 });
