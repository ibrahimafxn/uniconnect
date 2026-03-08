import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString, IsBoolean } from 'class-validator';
import { StudentGender } from '../../students/student-profile.schema';

export class CreateApplicationDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEnum(StudentGender)
  gender!: StudentGender;

  @IsDateString()
  birthDate!: string;

  @IsString()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsMongoId()
  programId!: string;

  @IsMongoId()
  offerId!: string;

  @IsMongoId()
  academicYearId!: string;

  @IsOptional()
  @IsBoolean()
  submit?: boolean;
}
