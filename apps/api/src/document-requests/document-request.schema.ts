import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StudentProfile } from '../students/student-profile.schema';
import { StudentDocument } from '../students/student-document.schema';

export enum DocumentRequestType {
  Transcript = 'releve_notes',
  EnrollmentCertificate = 'attestation_scolarite',
  GraduationCertificate = 'certificat_reussite',
  StudentCard = 'carte_etudiante',
  Other = 'autre',
}

export enum DocumentRequestStatus {
  Received = 'recu',
  Processing = 'en_cours',
  Available = 'disponible',
  Rejected = 'rejete',
}

@Schema({ timestamps: true })
export class DocumentRequest extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  @Prop({ required: true, enum: DocumentRequestType })
  type!: DocumentRequestType;

  @Prop({ enum: DocumentRequestStatus, default: DocumentRequestStatus.Received })
  status!: DocumentRequestStatus;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: StudentDocument.name })
  documentId?: Types.ObjectId;
}

export const DocumentRequestSchema = SchemaFactory.createForClass(DocumentRequest);
DocumentRequestSchema.index({ studentId: 1, createdAt: -1 });
DocumentRequestSchema.index({ status: 1, createdAt: -1 });
