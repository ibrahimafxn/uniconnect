import { IsBoolean, IsDateString, IsString } from 'class-validator';

export class CreateAcademicYearDto {
  @IsString()
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsBoolean()
  isActive!: boolean;
}
