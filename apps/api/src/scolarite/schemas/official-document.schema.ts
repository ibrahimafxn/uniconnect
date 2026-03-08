import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type OfficialDocumentType =
  | 'transcript'
  | 'enrollment_certificate'
  | 'success_certificate'
  | 'diploma'
  | 'presence_certificate';

export type OfficialDocumentStatus = 'pending' | 'generated' | 'delivered';

@Schema({ timestamps: true })
export class OfficialDocument extends Document {
  @Prop({ required: true })
  type: OfficialDocumentType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StudentProfile', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Semester' })
  semesterId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ required: true })
  qrCode: string;

  @Prop({ default: '' })
  filePath: string;

  @Prop({ default: 'pending' })
  status: OfficialDocumentStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  generatedBy: Types.ObjectId;

  @Prop()
  deliveredAt: Date;
}

export const OfficialDocumentSchema = SchemaFactory.createForClass(OfficialDocument);
OfficialDocumentSchema.index({ studentId: 1, type: 1 });
OfficialDocumentSchema.index({ qrCode: 1 }, { unique: true });
