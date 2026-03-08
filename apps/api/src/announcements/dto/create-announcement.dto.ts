import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { AnnouncementCategory, AnnouncementScope } from '../announcement.schema';

export class CreateAnnouncementDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsEnum(AnnouncementScope)
  scope?: AnnouncementScope;

  @IsOptional()
  @IsEnum(AnnouncementCategory)
  category?: AnnouncementCategory;

  @IsOptional()
  @IsMongoId()
  groupId?: string;
}
