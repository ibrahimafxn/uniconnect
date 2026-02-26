import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StudentProfile } from './student-profile.schema';

@Schema({ timestamps: true })
export class StudentDocument extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  @Prop({ trim: true })
  label?: string;

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
}

export const StudentDocumentSchema = SchemaFactory.createForClass(StudentDocument);
StudentDocumentSchema.index({ studentId: 1, createdAt: -1 });
