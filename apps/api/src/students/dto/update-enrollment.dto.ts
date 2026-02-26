import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { EnrollmentStatus } from '../enrollment.schema';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @IsOptional()
  @IsMongoId()
  academicYearId?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
