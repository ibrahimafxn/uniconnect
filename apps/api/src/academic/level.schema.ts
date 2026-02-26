import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Program } from './program.schema';

@Schema({ timestamps: true })
export class Level extends Document {
  @Prop({ required: true, trim: true })
  name!: string; // ex: L1

  @Prop({ required: true, type: Types.ObjectId, ref: Program.name })
  programId!: Types.ObjectId;
}

export const LevelSchema = SchemaFactory.createForClass(Level);
LevelSchema.index({ programId: 1, name: 1 }, { unique: true });
