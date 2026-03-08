import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type JuryDecisionType = 'admitted' | 'retake' | 'aap' | 'excluded' | 'dispensed';
export type Mention = 'none' | 'ab' | 'b' | 'tb';

@Schema({ timestamps: true })
export class JuryDecision extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Deliberation', required: true })
  deliberationId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StudentProfile', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  decision: JuryDecisionType;

  @Prop({ default: 'none' })
  mention: Mention;

  @Prop({ default: '' })
  comment: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  decidedBy: Types.ObjectId;
}

export const JuryDecisionSchema = SchemaFactory.createForClass(JuryDecision);
JuryDecisionSchema.index({ deliberationId: 1, studentId: 1 }, { unique: true });
