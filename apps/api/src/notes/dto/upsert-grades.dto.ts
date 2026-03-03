import { ArrayMinSize, IsArray, IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GradeItemDto {
  @IsMongoId()
  studentId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  score!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpsertGradesDto {
  @IsMongoId()
  evaluationId!: string;

  @IsArray()
  @ArrayMinSize(1)
  grades!: GradeItemDto[];
}
