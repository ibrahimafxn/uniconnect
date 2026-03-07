import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Level } from '../../academic/level.schema';
import { UE } from './ue.schema';

/**
 * Subject — ECUE (Élément Constitutif d'Unité d'Enseignement) dans le système LMD.
 * Peut appartenir à une UE (recommandé) ou être rattaché directement à un niveau.
 */
@Schema({ timestamps: true })
export class Subject extends Document {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  code?: string;

  /** Coefficient de l'ECUE au sein de l'UE (ou du semestre si pas d'UE) */
  @Prop({ required: true })
  coefficient!: number;

  /** Niveau auquel appartient la matière (peut être déduit de l'UE) */
  @Prop({ required: true, type: Types.ObjectId, ref: Level.name })
  levelId!: Types.ObjectId;

  /** UE parente (structure LMD) — optionnel pour compatibilité ascendante */
  @Prop({ type: Types.ObjectId, ref: UE.name })
  ueId?: Types.ObjectId;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
SubjectSchema.index({ levelId: 1, name: 1 }, { unique: true });
SubjectSchema.index({ ueId: 1 });
