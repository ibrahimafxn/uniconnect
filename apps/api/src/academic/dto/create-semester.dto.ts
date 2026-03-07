import { IsDateString, IsMongoId, IsString } from 'class-validator';

export class CreateSemesterDto {
  @IsString()
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsMongoId()
  academicYearId!: string;
}
