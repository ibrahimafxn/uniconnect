import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLevelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['L', 'M', 'D', 'BTS', 'BUT', 'CPGE'])
  cycle?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ects?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;
}
