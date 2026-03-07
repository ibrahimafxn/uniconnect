import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LevelCycle = 'L' | 'M' | 'D' | 'BTS' | 'BUT' | 'CPGE';

@Schema({ timestamps: true })
export class Level extends Document {
  @Prop({ required: true, trim: true })
  name!: string; // ex: L1, M2, BTS1, BUT3

  /** Cycle du système LMD : L (Licence), M (Master), D (Doctorat), BTS, BUT, CPGE */
  @Prop({ required: true, enum: ['L', 'M', 'D', 'BTS', 'BUT', 'CPGE'] })
  cycle!: LevelCycle;

  /** Crédits ECTS cumulés à ce niveau (ex: L1=60, L2=120, L3=180, M1=240, M2=300) */
  @Prop()
  ects?: number;

  /** Rang d'affichage dans le cycle (1=première année du cycle, etc.) */
  @Prop({ default: 1 })
  order!: number;
}

export const LevelSchema = SchemaFactory.createForClass(Level);
LevelSchema.index({ name: 1 }, { unique: true });
LevelSchema.index({ cycle: 1, order: 1 });
