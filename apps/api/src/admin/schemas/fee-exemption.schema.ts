import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExemptionType = 'partial' | 'total';

@Schema({ timestamps: true })
export class FeeExemption extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'StudentProfile' })
  studentId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'AcademicYear' })
  academicYearId!: Types.ObjectId;

  @Prop({ required: true, enum: ['partial', 'total'] })
  type!: ExemptionType;

  /** Percentage discount 0–100 (100 = total exemption) */
  @Prop({ required: true, min: 0, max: 100 })
  percentage!: number;

  @Prop({ required: true, trim: true })
  reason!: string; // ex: "Boursier MESRS", "Cas social"

  @Prop({ required: true })
  approvedBy!: string; // actorId

  createdAt?: Date;
  updatedAt?: Date;
}

export const FeeExemptionSchema = SchemaFactory.createForClass(FeeExemption);
FeeExemptionSchema.index({ studentId: 1, academicYearId: 1 }, { unique: true });
FeeExemptionSchema.index({ academicYearId: 1 });
