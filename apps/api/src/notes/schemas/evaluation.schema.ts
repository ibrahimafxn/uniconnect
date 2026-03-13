import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Subject } from './subject.schema';
import { Group } from '../../academic/group.schema';

@Schema({ timestamps: true })
export class Evaluation extends Document {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: Subject.name })
  subjectId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: Group.name })
  groupId!: Types.ObjectId;

  @Prop({ required: true, default: 20 })
  maxScore!: number;

  /** Identifiant de l'enseignant/intervenant créateur (pour contrôle de périmètre) */
  @Prop({ type: Types.ObjectId, default: null })
  teacherId!: Types.ObjectId | null;

  /** Notes publiées officiellement par la scolarité */
  @Prop({ default: false })
  isPublished!: boolean;

  @Prop({ type: Date, default: null })
  publishedAt!: Date | null;
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
EvaluationSchema.index({ groupId: 1, subjectId: 1, date: -1 });
