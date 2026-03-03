import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Level } from '../../academic/level.schema';

@Schema({ timestamps: true })
export class Subject extends Document {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  code?: string;

  @Prop({ required: true })
  coefficient!: number;

  @Prop({ required: true, type: Types.ObjectId, ref: Level.name })
  levelId!: Types.ObjectId;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
SubjectSchema.index({ levelId: 1, name: 1 }, { unique: true });
