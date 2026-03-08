import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Group } from '../academic/group.schema';
import { Program } from '../academic/program.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { AcademicYear } from '../academic/academic-year.schema';

export enum StudentStatus {
  Active = 'active',
  Suspended = 'suspended',
  Graduated = 'graduated',
}

export enum StudentGender {
  Female = 'female',
  Male = 'male',
}

@Schema({ timestamps: true })
export class StudentProfile extends Document {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, trim: true })
  studentNumber!: string; // matricule

  @Prop({ required: true, enum: StudentGender })
  gender!: StudentGender;

  @Prop({ required: true })
  birthDate!: Date;

  @Prop({
    required: true,
    enum: StudentStatus,
    default: StudentStatus.Active,
  })
  status!: StudentStatus;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ required: true, type: Types.ObjectId, ref: Group.name })
  groupId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: ProgramOffer.name })
  offerId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: Program.name })
  programId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: AcademicYear.name })
  academicYearId!: Types.ObjectId;

  @Prop({
    type: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    default: { email: true, sms: true, push: true },
  })
  notificationPrefs?: { email: boolean; sms: boolean; push: boolean };
}

export const StudentProfileSchema = SchemaFactory.createForClass(StudentProfile);
StudentProfileSchema.index({ studentNumber: 1 }, { unique: true });
StudentProfileSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string', $ne: '' } },
  },
);
StudentProfileSchema.index({ lastName: 1, firstName: 1 });
StudentProfileSchema.index({ programId: 1 });
StudentProfileSchema.index({ offerId: 1 });
