import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type StudentDecision = 'pending' | 'admitted' | 'retake' | 'aap' | 'excluded';

export class UeResult {
  ueName: string;
  average: number;
  ects: number;
  validated: boolean;
}

@Schema({ timestamps: true })
export class SemesterResult extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StudentProfile', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Semester', required: true })
  semesterId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProgramOffer', required: true })
  offerId: Types.ObjectId;

  @Prop({
    type: [
      {
        ueName: String,
        average: Number,
        ects: Number,
        validated: Boolean,
      },
    ],
    default: [],
  })
  ueResults: UeResult[];

  @Prop({ required: true, default: 0 })
  semesterAverage: number;

  @Prop({ default: 0 })
  ectsValidated: number;

  @Prop({ default: 'pending' })
  status: StudentDecision;

  @Prop({ default: false })
  compensated: boolean;

  @Prop({ default: true })
  isProvisional: boolean;

  @Prop({ default: true })
  examEligible: boolean;
}

export const SemesterResultSchema = SchemaFactory.createForClass(SemesterResult);
SemesterResultSchema.index({ studentId: 1, semesterId: 1, offerId: 1 }, { unique: true });
SemesterResultSchema.index({ semesterId: 1, offerId: 1 });
