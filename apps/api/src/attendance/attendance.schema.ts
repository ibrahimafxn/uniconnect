import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Session } from '../planning/session.schema';
import { StudentProfile } from '../students/student-profile.schema';

export enum AttendanceStatus {
  Present = 'present',
  Absent = 'absent',
  Excused = 'excused',
}

@Schema({ timestamps: true })
export class Attendance extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: Session.name })
  sessionId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  @Prop({ required: true, enum: AttendanceStatus, default: AttendanceStatus.Present })
  status!: AttendanceStatus;

  @Prop({ trim: true })
  note?: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
AttendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
AttendanceSchema.index({ studentId: 1 });
