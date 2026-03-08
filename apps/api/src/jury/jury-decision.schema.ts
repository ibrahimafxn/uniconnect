import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StudentProfile } from '../students/student-profile.schema';
import { Group } from '../academic/group.schema';

/**
 * JuryDecision — décision de jury pour un étudiant (délibération LMD).
 */
@Schema({ timestamps: true })
export class JuryDecision extends Document {
  /** Étudiant concerné */
  @Prop({ required: true, type: Types.ObjectId, ref: StudentProfile.name })
  studentId!: Types.ObjectId;

  /** Groupe de l'étudiant */
  @Prop({ required: true, type: Types.ObjectId, ref: Group.name })
  groupId!: Types.ObjectId;

  /** Session de délibération (ex: "Juin 2026 — L1 Informatique") */
  @Prop({ required: true, trim: true })
  session!: string;

  /** Décision: admis, ajourné, redoublant, admis_avec_dettes */
  @Prop({
    enum: ['admis', 'ajourne', 'redoublant', 'admis_avec_dettes'],
    required: true,
  })
  decision!: string;

  /** Moyenne générale au moment de la délibération */
  @Prop()
  overallAverage?: number;

  /** Crédits ECTS obtenus */
  @Prop({ default: 0 })
  ectsObtained!: number;

  /** Mention (Passable, Assez Bien, Bien, Très Bien) */
  @Prop({ enum: ['passable', 'assez_bien', 'bien', 'tres_bien', null], default: null })
  mention?: string | null;

  /** Commentaire du jury */
  @Prop({ trim: true })
  comment?: string;

  /** Enseignant permanent ayant validé */
  @Prop({ required: true, type: Types.ObjectId })
  validatedBy!: Types.ObjectId;
}

export const JuryDecisionSchema = SchemaFactory.createForClass(JuryDecision);
JuryDecisionSchema.index({ studentId: 1, session: 1 }, { unique: true });
JuryDecisionSchema.index({ groupId: 1, session: 1 });
