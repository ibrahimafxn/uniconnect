import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { StudentGender, StudentStatus } from '../student-profile.schema';
import { STUDENT_NUMBER_REGEX } from '../student-number';

export class CreateStudentProfileDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  @Matches(STUDENT_NUMBER_REGEX, {
    message:
      'Matricule invalide. Format attendu: ML{0|1}{MM}{Initiales}{YYYY}[N].',
  })
  studentNumber?: string;

  @IsEnum(StudentGender)
  gender!: StudentGender;

  @IsDateString()
  birthDate!: string;

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

  @IsOptional()
  @IsMongoId()
  offerId?: string;

  @IsMongoId()
  programId!: string;

  @IsMongoId()
  academicYearId!: string;
}
