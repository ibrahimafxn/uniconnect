import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type DeliberationStatus = 'planned' | 'in_progress' | 'completed' | 'signed';

@Schema({ timestamps: true })
export class Deliberation extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Semester', required: true })
  semesterId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProgramOffer', required: true })
  offerId: Types.ObjectId;

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop({ default: 'planned' })
  status: DeliberationStatus;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  juryMembers: Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  presidentId: Types.ObjectId;

  @Prop({ default: '' })
  pvPath: string;

  @Prop()
  pvSignedAt: Date;

  @Prop()
  resultsPublishedAt: Date;
}

export const DeliberationSchema = SchemaFactory.createForClass(Deliberation);
DeliberationSchema.index({ semesterId: 1, offerId: 1 });
