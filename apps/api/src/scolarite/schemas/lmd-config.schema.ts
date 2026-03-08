import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export class UeDefinition {
  name: string;
  subjectIds: Types.ObjectId[];
  ectsCredits: number;
}

@Schema({ timestamps: true })
export class LmdConfig extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProgramOffer', required: true, unique: true })
  offerId: Types.ObjectId;

  @Prop({ default: true })
  compensationEnabled: boolean;

  @Prop({ default: 10 })
  compensationMinAverage: number;

  @Prop({ default: 10 })
  passThreshold: number;

  @Prop({ default: 8 })
  retakeThreshold: number;

  @Prop({ default: 30 })
  ectsPerSemester: number;

  @Prop({ default: true })
  aapEnabled: boolean;

  @Prop({ default: 2 })
  aapMaxDebts: number;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        subjectIds: [{ type: MongooseSchema.Types.ObjectId, ref: 'Subject' }],
        ectsCredits: { type: Number, required: true },
      },
    ],
    default: [],
  })
  ue: UeDefinition[];
}

export const LmdConfigSchema = SchemaFactory.createForClass(LmdConfig);
