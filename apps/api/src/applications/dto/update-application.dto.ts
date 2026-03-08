import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString, IsBoolean } from 'class-validator';
import { StudentGender } from '../../students/student-profile.schema';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(StudentGender)
  gender?: StudentGender;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsMongoId()
  programId?: string;

  @IsOptional()
  @IsMongoId()
  offerId?: string;

  @IsOptional()
  @IsMongoId()
  academicYearId?: string;

  @IsOptional()
  @IsBoolean()
  submit?: boolean;
}
