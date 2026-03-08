import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type DossierStatus =
  | 'pending'
  | 'complete'
  | 'incomplete'
  | 'approved'
  | 'rejected'
  | 'waitlisted';

@Schema({ timestamps: true })
export class ApplicationDossier extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'InscriptionCampaign', required: true })
  campaignId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StudentProfile', required: true })
  studentId: Types.ObjectId;

  @Prop({ default: 'pending' })
  status: DossierStatus;

  @Prop({ type: [String], default: [] })
  submittedDocuments: string[];

  @Prop({ type: [String], default: [] })
  missingDocuments: string[];

  @Prop({ default: '' })
  internalNote: string;

  @Prop({ default: '' })
  rejectionReason: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reviewedBy: Types.ObjectId;

  @Prop()
  reviewedAt: Date;

  @Prop({ default: 0 })
  waitingListPosition: number;
}

export const ApplicationDossierSchema = SchemaFactory.createForClass(ApplicationDossier);
ApplicationDossierSchema.index({ campaignId: 1, status: 1 });
ApplicationDossierSchema.index({ studentId: 1 });
