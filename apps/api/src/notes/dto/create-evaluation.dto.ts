import { IsDateString, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEvaluationDto {
  @IsString()
  title!: string;

  @IsDateString()
  date!: string;

  @IsMongoId()
  subjectId!: string;

  @IsMongoId()
  groupId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxScore?: number;
}
