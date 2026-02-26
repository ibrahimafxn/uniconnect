import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Level } from './level.schema';

@Schema({ timestamps: true })
export class Group extends Document {
  @Prop({ required: true, trim: true })
  name!: string; // ex: G1

  @Prop({ required: true, type: Types.ObjectId, ref: Level.name })
  levelId!: Types.ObjectId;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
GroupSchema.index({ levelId: 1, name: 1 }, { unique: true });
