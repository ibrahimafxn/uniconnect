import { IsDateString, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEvaluationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsMongoId()
  subjectId?: string;

  @IsOptional()
  @IsMongoId()
  groupId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxScore?: number;
}
