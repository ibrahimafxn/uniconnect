import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Program extends Document {
  @Prop({ required: true, trim: true })
  name!: string; // ex: Informatique

  @Prop({ trim: true })
  code?: string;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);
ProgramSchema.index({ name: 1 }, { unique: true });
