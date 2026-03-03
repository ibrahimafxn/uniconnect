import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/user.schema';

export type ConversationType = 'direct' | 'group';

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ required: true, enum: ['direct', 'group'] })
  type!: ConversationType;

  @Prop({ trim: true })
  title?: string;

  @Prop({ type: [Types.ObjectId], ref: User.name, required: true })
  participantIds!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy!: Types.ObjectId;

  @Prop()
  lastMessageAt?: Date;

  @Prop({ trim: true })
  lastMessageSnippet?: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
ConversationSchema.index({ type: 1, createdBy: 1 });
