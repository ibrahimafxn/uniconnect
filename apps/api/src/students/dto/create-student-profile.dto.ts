import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { StudentStatus } from '../student-profile.schema';

export class CreateStudentProfileDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  studentNumber!: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsMongoId()
  groupId!: string;

  @IsMongoId()
  academicYearId!: string;
}
