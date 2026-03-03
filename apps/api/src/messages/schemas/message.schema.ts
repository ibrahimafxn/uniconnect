import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/user.schema';
import { Conversation } from './conversation.schema';
import { MessageAttachment } from './message-attachment.schema';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: Conversation.name, required: true })
  conversationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  senderId!: Types.ObjectId;

  @Prop({ trim: true })
  body?: string;

  @Prop({ type: [Types.ObjectId], ref: MessageAttachment.name, default: [] })
  attachmentIds!: Types.ObjectId[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
