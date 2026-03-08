import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Session } from '../planning/session.schema';
import { User } from '../users/user.schema';
import { Group } from '../academic/group.schema';

/**
 * Resource — fichier pédagogique déposé par un enseignant.
 * Rattaché à une séance et accessible aux étudiants du groupe.
 */
@Schema({ timestamps: true })
export class Resource extends Document {
  /** Titre de la ressource */
  @Prop({ required: true, trim: true })
  title!: string;

  /** Description optionnelle */
  @Prop({ trim: true })
  description?: string;

  /** Nom original du fichier */
  @Prop({ required: true })
  originalName!: string;

  /** Nom du fichier sur le serveur */
  @Prop({ required: true })
  fileName!: string;

  /** Chemin d'accès */
  @Prop({ required: true })
  path!: string;

  /** Type MIME */
  @Prop({ required: true })
  mimeType!: string;

  /** Taille en octets */
  @Prop({ required: true })
  size!: number;

  /** Enseignant ayant déposé la ressource */
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  teacherId!: Types.ObjectId;

  /** Séance associée (optionnel — peut être une ressource de cours générale) */
  @Prop({ type: Types.ObjectId, ref: Session.name })
  sessionId?: Types.ObjectId;

  /** Groupe cible (peut être déduit de la séance) */
  @Prop({ type: Types.ObjectId, ref: Group.name })
  groupId?: Types.ObjectId;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
ResourceSchema.index({ teacherId: 1, createdAt: -1 });
ResourceSchema.index({ sessionId: 1 });
ResourceSchema.index({ groupId: 1, createdAt: -1 });
