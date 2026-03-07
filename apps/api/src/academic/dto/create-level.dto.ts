import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLevelDto {
  @IsString()
  name!: string;

  @IsIn(['L', 'M', 'D', 'BTS', 'BUT', 'CPGE'])
  cycle!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ects?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;
}
