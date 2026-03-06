import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TeacherGrade } from '../teacher-profile.schema';

export class UpsertTeacherProfileDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsEnum(TeacherGrade)
  grade?: TeacherGrade;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  office?: string;
}
