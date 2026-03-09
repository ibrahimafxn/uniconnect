import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { AnnouncementCategory, AnnouncementScope } from '../announcement.schema';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

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
