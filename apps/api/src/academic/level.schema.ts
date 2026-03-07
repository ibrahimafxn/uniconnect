import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Level extends Document {
  @Prop({ required: true, trim: true })
  name!: string; // ex: L1
}

export const LevelSchema = SchemaFactory.createForClass(Level);
LevelSchema.index({ name: 1 });
