import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import type { OfficialDocumentType } from './official-document.schema';

export type DocumentRequestStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'delivered'
  | 'rejected';

@Schema({ timestamps: true })
export class DocumentRequest extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StudentProfile', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, type: String })
  documentType: OfficialDocumentType;

  @Prop({ default: 'pending', type: String })
  status: DocumentRequestStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Semester' })
  semesterId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'OfficialDocument' })
  documentId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  processedBy: Types.ObjectId;

  @Prop()
  processedAt: Date;

  @Prop({ default: '' })
  comment: string;
}

export const DocumentRequestSchema = SchemaFactory.createForClass(DocumentRequest);
DocumentRequestSchema.index({ studentId: 1, status: 1 });
DocumentRequestSchema.index({ createdAt: -1 });
