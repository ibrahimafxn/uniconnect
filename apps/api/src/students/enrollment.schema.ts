import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AcademicYear } from '../academic/academic-year.schema';
import { StudentProfile } from './student-profile.schema';

export enum EnrollmentStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

@Schema({ timestamps: true })
export class Enrollment extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: AcademicYear.name })
  academicYearId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: EnrollmentStatus,
    default: EnrollmentStatus.Pending,
  })
  status!: EnrollmentStatus;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index({ studentId: 1, academicYearId: 1 }, { unique: true });
