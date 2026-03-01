import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Room extends Document {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  capacity!: number;

  @Prop({ trim: true })
  location?: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.index({ name: 1 }, { unique: true });
