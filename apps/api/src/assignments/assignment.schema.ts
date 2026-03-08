import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Group } from '../academic/group.schema';
import { Subject } from '../notes/schemas/subject.schema';
import { Session } from '../planning/session.schema';
import { User } from '../users/user.schema';

@Schema({ timestamps: true })
export class Assignment extends Document {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, type: Types.ObjectId, ref: Group.name })
  groupId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Subject.name })
  subjectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Session.name })
  sessionId?: Types.ObjectId;

  @Prop({ required: true })
  dueDate!: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  createdBy!: Types.ObjectId;

  @Prop({ trim: true })
  originalName?: string;

  @Prop({ trim: true })
  fileName?: string;

  @Prop({ trim: true })
  path?: string;

  @Prop({ trim: true })
  mimeType?: string;

  @Prop()
  size?: number;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
AssignmentSchema.index({ groupId: 1, dueDate: 1 });
AssignmentSchema.index({ subjectId: 1, dueDate: 1 });
