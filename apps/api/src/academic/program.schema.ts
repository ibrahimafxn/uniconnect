import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProgramType = 'universitaire' | 'bts' | 'but' | 'cpge';

@Schema({ timestamps: true })
export class Program extends Document {
  @Prop({ required: true, trim: true })
  name!: string; // ex: Informatique, Droit, BTS Informatique

  @Prop({ trim: true })
  code?: string; // ex: INFO, DROIT, BTS-INFO

  /** Domaine disciplinaire (ex: "Sciences et Technologies", "Droit, Économie, Gestion") */
  @Prop({ trim: true })
  domaine?: string;

  /** Type de formation dans le système français */
  @Prop({ trim: true, enum: ['universitaire', 'bts', 'but', 'cpge'], default: 'universitaire' })
  type!: ProgramType;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);
ProgramSchema.index({ name: 1 }, { unique: true });
ProgramSchema.index({ type: 1 });
