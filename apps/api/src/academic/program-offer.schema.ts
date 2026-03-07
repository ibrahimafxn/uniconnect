import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Program } from './program.schema';
import { Level } from './level.schema';
import { AcademicYear } from './academic-year.schema';

@Schema({ timestamps: true })
export class ProgramOffer extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: Program.name })
  programId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: Level.name })
  levelId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: AcademicYear.name })
  academicYearId!: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  capacity!: number;
}

export const ProgramOfferSchema = SchemaFactory.createForClass(ProgramOffer);
ProgramOfferSchema.index(
  { programId: 1, levelId: 1, academicYearId: 1 },
  { unique: true },
);
