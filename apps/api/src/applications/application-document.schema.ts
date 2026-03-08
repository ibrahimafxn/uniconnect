import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Application } from './application.schema';

@Schema({ timestamps: true })
export class ApplicationDocument extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: Application.name })
  applicationId!: Types.ObjectId;

  @Prop({ trim: true })
  label?: string;

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

export const ApplicationDocumentSchema = SchemaFactory.createForClass(ApplicationDocument);
ApplicationDocumentSchema.index({ applicationId: 1, createdAt: -1 });
