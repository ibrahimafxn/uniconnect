import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StudentProfile } from '../students/student-profile.schema';
import { Group } from '../academic/group.schema';

/**
 * InterventionSheet — feuille d'intervention d'un enseignant vacataire.
 * Soumise pour validation et paiement.
 */
@Schema({ timestamps: true })
export class InterventionSheet extends Document {
  /** Enseignant vacataire (userId) */
  @Prop({ required: true, type: Types.ObjectId })
  teacherId!: Types.ObjectId;

  /** Mois de l'intervention (ex: 2026-03) */
  @Prop({ required: true, trim: true })
  period!: string;

  /** Nombre d'heures CM */
  @Prop({ default: 0 })
  hoursCM!: number;

  /** Nombre d'heures TD */
  @Prop({ default: 0 })
  hoursTD!: number;

  /** Nombre d'heures TP */
  @Prop({ default: 0 })
  hoursTP!: number;

  /** Taux horaire brut */
  @Prop({ required: true })
  hourlyRate!: number;

  /** Devise */
  @Prop({ default: 'XOF' })
  currency!: string;

  /** Montant total calculé */
  @Prop({ default: 0 })
  totalAmount!: number;

  /** Statut: draft → submitted → validated → paid */
  @Prop({ enum: ['draft', 'submitted', 'validated', 'paid'], default: 'draft' })
  status!: string;

  /** Commentaire de l'enseignant */
  @Prop({ trim: true })
  comment?: string;

  /** Commentaire de l'administration */
  @Prop({ trim: true })
  adminComment?: string;

  /** Date de validation */
  @Prop()
  validatedAt?: Date;

  /** Date de paiement */
  @Prop()
  paidAt?: Date;
}

export const InterventionSheetSchema = SchemaFactory.createForClass(InterventionSheet);
InterventionSheetSchema.index({ teacherId: 1, period: 1 });
InterventionSheetSchema.index({ status: 1 });
