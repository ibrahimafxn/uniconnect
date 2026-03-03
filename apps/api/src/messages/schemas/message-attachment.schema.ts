import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Conversation } from './conversation.schema';
import { User } from '../../users/user.schema';

@Schema({ timestamps: true })
export class MessageAttachment extends Document {
  @Prop({ type: Types.ObjectId, ref: Conversation.name, required: true })
  conversationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  uploadedBy!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  originalName!: string;

  @Prop({ required: true, trim: true })
  fileName!: string;

  @Prop({ required: true })
  path!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  size!: number;
}

export const MessageAttachmentSchema = SchemaFactory.createForClass(MessageAttachment);
MessageAttachmentSchema.index({ conversationId: 1, createdAt: -1 });
MessageAttachmentSchema.index({ uploadedBy: 1, createdAt: -1 });
