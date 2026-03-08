import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CalendarEventType =
  | 'rentree'
  | 'vacances'
  | 'examens'
  | 'deliberations'
  | 'rattrapage'
  | 'autre';

@Schema({ timestamps: true })
export class AcademicCalendarEvent extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'AcademicYear' })
  academicYearId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['rentree', 'vacances', 'examens', 'deliberations', 'rattrapage', 'autre'],
  })
  type!: CalendarEventType;

  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  /** Optional: target a specific program offer */
  @Prop({ type: Types.ObjectId, ref: 'ProgramOffer' })
  offerId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AcademicCalendarEventSchema =
  SchemaFactory.createForClass(AcademicCalendarEvent);
AcademicCalendarEventSchema.index({ academicYearId: 1, type: 1 });
AcademicCalendarEventSchema.index({ academicYearId: 1, startDate: 1 });
