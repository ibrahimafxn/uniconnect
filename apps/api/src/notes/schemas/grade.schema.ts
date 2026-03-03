import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Evaluation } from './evaluation.schema';
import { StudentProfile } from '../../students/student-profile.schema';

@Schema({ timestamps: true })
export class Grade extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: Evaluation.name })
  evaluationId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  @Prop({ required: true })
  score!: number;

  @Prop({ trim: true })
  comment?: string;
}

export const GradeSchema = SchemaFactory.createForClass(Grade);
GradeSchema.index({ evaluationId: 1, studentId: 1 }, { unique: true });
