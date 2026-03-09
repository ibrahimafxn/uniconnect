import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  from: string;
  secure?: boolean;
};

export type EmailTemplate = {
  key: string;
  subject: string;
  body: string;
};

export type SystemParams = {
  maxStudentsPerGroup: number;
  paymentGraceDays: number;
  supportEmail: string;
  maintenanceMode: boolean;
  maxUploadSizeMb: number;
};

@Schema({ timestamps: true, collection: 'systemconfigs' })
export class SystemConfig extends Document {
  @Prop({ default: 'default', unique: true })
  key: string;

  @Prop({ type: Object, default: null })
  smtp: SmtpConfig | null;

  @Prop({ type: Array, default: [] })
  emailTemplates: EmailTemplate[];

  @Prop({
    type: Object,
    default: () => ({
      maxStudentsPerGroup: 40,
      paymentGraceDays: 7,
      supportEmail: 'support@uniconnect.local',
      maintenanceMode: false,
      maxUploadSizeMb: 20,
    }),
  })
  systemParams: SystemParams;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
