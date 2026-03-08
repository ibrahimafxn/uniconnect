import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Schema({ _id: false })
export class ImportRowError {
  @Prop({ required: true })
  row!: number;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ trim: true })
  email?: string;
}

export const ImportRowErrorSchema = SchemaFactory.createForClass(ImportRowError);

@Schema({ timestamps: true })
export class BulkImportJob extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'ProgramOffer' })
  offerId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Group' })
  groupId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status!: ImportJobStatus;

  @Prop({ default: 0 })
  totalRows!: number;

  @Prop({ default: 0 })
  successCount!: number;

  @Prop({ default: 0 })
  errorCount!: number;

  @Prop({ type: [ImportRowErrorSchema], default: [] })
  rowErrors!: ImportRowError[];

  @Prop({ required: true })
  importedBy!: string;

  @Prop()
  completedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BulkImportJobSchema = SchemaFactory.createForClass(BulkImportJob);
BulkImportJobSchema.index({ offerId: 1, createdAt: -1 });
BulkImportJobSchema.index({ status: 1, createdAt: -1 });
