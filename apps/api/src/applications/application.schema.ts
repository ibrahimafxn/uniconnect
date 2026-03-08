import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Program } from '../academic/program.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { AcademicYear } from '../academic/academic-year.schema';
import { StudentProfile, StudentGender } from '../students/student-profile.schema';

export enum ApplicationStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  UnderReview = 'under_review',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

@Schema({ timestamps: true })
export class Application extends Document {
  @Prop({ required: true, trim: true, unique: true })
  trackingCode!: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, enum: StudentGender, type: String })
  gender!: StudentGender;

  @Prop({ required: true })
  birthDate!: Date;

  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ required: true, type: Types.ObjectId, ref: Program.name })
  programId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: ProgramOffer.name })
  offerId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: AcademicYear.name })
  academicYearId!: Types.ObjectId;

  @Prop({ enum: ApplicationStatus, default: ApplicationStatus.Draft })
  status!: ApplicationStatus;

  @Prop()
  submittedAt?: Date;

  @Prop({ trim: true })
  decisionNote?: string;

  @Prop({ type: Types.ObjectId, ref: StudentProfile.name })
  studentId?: Types.ObjectId;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
ApplicationSchema.index({ email: 1, createdAt: -1 });
ApplicationSchema.index({ status: 1, createdAt: -1 });
