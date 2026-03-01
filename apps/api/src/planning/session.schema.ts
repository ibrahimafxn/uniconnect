import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Group } from '../academic/group.schema';
import { Room } from './room.schema';
import { User } from '../users/user.schema';

@Schema({ timestamps: true })
export class Session extends Document {
  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true })
  startTime!: string; // HH:mm

  @Prop({ required: true })
  endTime!: string; // HH:mm

  @Prop({ required: true })
  startMinutes!: number;

  @Prop({ required: true })
  endMinutes!: number;

  @Prop({ required: true, type: Types.ObjectId, ref: Group.name })
  groupId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  teacherId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: Room.name })
  roomId!: Types.ObjectId;

  @Prop({ trim: true })
  label?: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ date: 1, startMinutes: 1 });
SessionSchema.index({ roomId: 1, date: 1 });
SessionSchema.index({ teacherId: 1, date: 1 });
SessionSchema.index({ groupId: 1, date: 1 });
