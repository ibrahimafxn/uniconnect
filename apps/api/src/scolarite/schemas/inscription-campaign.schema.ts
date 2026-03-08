import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type CampaignStatus = 'draft' | 'open' | 'closed';

@Schema({ timestamps: true })
export class InscriptionCampaign extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProgramOffer', required: true })
  offerId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, min: 1 })
  capacity: number;

  @Prop({ default: 'draft' })
  status: CampaignStatus;

  @Prop({ type: [String], default: [] })
  requiredDocuments: string[];

  @Prop({ default: false })
  waitingListEnabled: boolean;

  @Prop({ default: 0 })
  waitingListLimit: number;
}

export const InscriptionCampaignSchema = SchemaFactory.createForClass(InscriptionCampaign);
InscriptionCampaignSchema.index({ offerId: 1, status: 1 });
