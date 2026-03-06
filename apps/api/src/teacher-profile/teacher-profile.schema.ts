import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/user.schema';

export enum TeacherGrade {
  Assistant = 'assistant',
  MaitreConferences = 'maitre_conferences',
  Professeur = 'professeur',
  Vacataire = 'vacataire',
  Autre = 'autre',
}

@Schema({ timestamps: true })
export class TeacherProfile extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: User.name, unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ trim: true })
  specialty?: string;

  @Prop({ enum: TeacherGrade, default: TeacherGrade.Autre })
  grade?: TeacherGrade;

  @Prop({ trim: true })
  bio?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  office?: string;
}

export const TeacherProfileSchema = SchemaFactory.createForClass(TeacherProfile);
TeacherProfileSchema.index({ userId: 1 }, { unique: true });
