import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { LevelCycle } from '../level.schema';

export class CreateLevelDto {
  @IsString()
  name!: string;

  @IsIn(['L', 'M', 'D', 'BTS', 'BUT', 'CPGE'])
  cycle!: LevelCycle;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ects?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;
}
