import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Level } from './level.schema';
import { Program } from './program.schema';
import { ProgramOffer } from './program-offer.schema';

@Schema({ timestamps: true })
export class Group extends Document {
  @Prop({ required: true, trim: true })
  name!: string; // ex: G1

  @Prop({ required: true, type: Types.ObjectId, ref: ProgramOffer.name })
  offerId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: Program.name })
  programId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: Level.name })
  levelId!: Types.ObjectId;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
GroupSchema.index({ offerId: 1, name: 1 }, { unique: true });
GroupSchema.index({ programId: 1, levelId: 1, name: 1 }, { unique: true });
