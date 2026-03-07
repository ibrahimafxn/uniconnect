import { IsDateString, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateSemesterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsMongoId()
  academicYearId?: string;
}
