import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Group } from '../academic/group.schema';
import { User } from '../users/user.schema';

export enum AnnouncementScope {
  All = 'all',
  Students = 'students',
  Teachers = 'teachers',
  Group = 'group',
}

export enum AnnouncementCategory {
  Official = 'official',
  Event = 'event',
  Internship = 'internship',
  Service = 'service',
}

@Schema({ timestamps: true })
export class Announcement extends Document {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  body!: string;

  @Prop({ enum: AnnouncementScope, default: AnnouncementScope.All })
  scope!: AnnouncementScope;

  @Prop({ enum: AnnouncementCategory, default: AnnouncementCategory.Official })
  category!: AnnouncementCategory;

  @Prop({ type: Types.ObjectId, ref: Group.name })
  groupId?: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  createdBy!: Types.ObjectId;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
AnnouncementSchema.index({ scope: 1, createdAt: -1 });
AnnouncementSchema.index({ category: 1, createdAt: -1 });
