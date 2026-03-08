import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../common/roles.enum';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: String, required: true, enum: Role, default: Role.Student })
  role!: Role;

  @Prop({ type: String, default: null })
  refreshTokenHash?: string | null;

  @Prop({ type: Boolean, default: false })
  suspended!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });
