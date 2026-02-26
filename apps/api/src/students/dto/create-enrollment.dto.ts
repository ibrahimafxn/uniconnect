import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { EnrollmentStatus } from '../enrollment.schema';

export class CreateEnrollmentDto {
  @IsMongoId()
  studentId!: string;

  @IsMongoId()
  academicYearId!: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
