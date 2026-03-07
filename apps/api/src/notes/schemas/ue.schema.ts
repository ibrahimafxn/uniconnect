import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Level } from '../../academic/level.schema';
import { Semester } from '../../academic/semester.schema';

/**
 * UE — Unité d'Enseignement (LMD)
 * Regroupe plusieurs ECUE (matières). Pondérée par crédits ECTS
 * pour le calcul de la moyenne semestrielle.
 */
@Schema({ timestamps: true })
export class UE extends Document {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  code?: string;

  /** Crédits ECTS (ex: 3, 6) */
  @Prop({ required: true, default: 3 })
  ects!: number;

  /** Niveau auquel appartient cette UE (L1, L2, M1…) */
  @Prop({ required: true, type: Types.ObjectId, ref: Level.name })
  levelId!: Types.ObjectId;

  /** Semestre optionnel (S1, S2…) */
  @Prop({ type: Types.ObjectId, ref: Semester.name })
  semesterId?: Types.ObjectId;
}

export const UESchema = SchemaFactory.createForClass(UE);
UESchema.index({ levelId: 1, name: 1 }, { unique: true });
