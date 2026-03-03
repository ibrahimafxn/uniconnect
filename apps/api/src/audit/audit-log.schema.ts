import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ required: true, trim: true })
  action!: string;

  @Prop({ required: true, trim: true })
  entity!: string;

  @Prop({ required: true })
  entityId!: string;

  @Prop({ required: true })
  actorId!: string;

  @Prop({ required: true, trim: true })
  actorRole!: string;

  @Prop({ trim: true })
  actorEmail?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ trim: true })
  ip?: string;

  @Prop({ trim: true })
  userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
