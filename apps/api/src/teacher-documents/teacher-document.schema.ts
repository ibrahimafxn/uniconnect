import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/user.schema';

export enum TeacherDocumentCategory {
  Official = 'official',
  Template = 'template',
  ExamSubject = 'exam_subject',
  PvDeliberation = 'pv_deliberation',
}

export enum TeacherDocumentType {
  TeachingAttestation = 'teaching_attestation',
  Contract = 'contract',
  Payslip = 'payslip',
  ExamTemplate = 'exam_template',
  ExamSubject = 'exam_subject',
  PvDeliberation = 'pv_deliberation',
  Other = 'other',
}

@Schema({ timestamps: true })
export class TeacherDocument extends Document {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, enum: TeacherDocumentCategory })
  category!: TeacherDocumentCategory;

  @Prop({ required: true, enum: TeacherDocumentType })
  type!: TeacherDocumentType;

  @Prop({ type: Types.ObjectId, ref: User.name })
  ownerId?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: User.name, default: [] })
  participantIds?: Types.ObjectId[];

  @Prop({ type: Number, default: 1 })
  version?: number;

  @Prop({ type: Types.ObjectId })
  academicYearId?: Types.ObjectId;

  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  fileName!: string;

  @Prop({ required: true })
  path!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  size!: number;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy!: Types.ObjectId;
}

export const TeacherDocumentSchema = SchemaFactory.createForClass(TeacherDocument);
TeacherDocumentSchema.index({ ownerId: 1, category: 1, createdAt: -1 });
TeacherDocumentSchema.index({ category: 1, createdAt: -1 });
TeacherDocumentSchema.index({ participantIds: 1 });
