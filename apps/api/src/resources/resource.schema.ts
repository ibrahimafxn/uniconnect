import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Group } from '../academic/group.schema';
import { Subject } from '../notes/schemas/subject.schema';
import { Session } from '../planning/session.schema';
import { User } from '../users/user.schema';

@Schema({ timestamps: true })
export class Resource extends Document {
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

  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  uploadedBy!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  originalName!: string;

  @Prop({ required: true, trim: true })
  fileName!: string;

  @Prop({ required: true, trim: true })
  path!: string;

  @Prop({ required: true, trim: true })
  mimeType!: string;

  @Prop({ required: true })
  size!: number;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
ResourceSchema.index({ groupId: 1, createdAt: -1 });
ResourceSchema.index({ subjectId: 1, createdAt: -1 });
