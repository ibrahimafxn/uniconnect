import { IsArray, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { TeacherDocumentCategory, TeacherDocumentType } from '../teacher-document.schema';

export class CreateTeacherDocumentDto {
  @IsString()
  title!: string;

  @IsEnum(TeacherDocumentCategory)
  category!: TeacherDocumentCategory;

  @IsEnum(TeacherDocumentType)
  type!: TeacherDocumentType;

  @IsOptional()
  @IsMongoId()
  ownerId?: string;

  @IsOptional()
  @IsArray()
  participantIds?: string[];

  @IsOptional()
  @IsMongoId()
  academicYearId?: string;
}
