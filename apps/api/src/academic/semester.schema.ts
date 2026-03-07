import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AcademicYear } from './academic-year.schema';

@Schema({ timestamps: true })
export class Semester extends Document {
  @Prop({ required: true, trim: true })
  name!: string; // ex: S1, S2, T1...

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: AcademicYear.name })
  academicYearId!: Types.ObjectId;
}

export const SemesterSchema = SchemaFactory.createForClass(Semester);
SemesterSchema.index({ academicYearId: 1, name: 1 }, { unique: true });
