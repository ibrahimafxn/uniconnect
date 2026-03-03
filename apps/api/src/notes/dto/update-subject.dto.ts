import { IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  coefficient?: number;

  @IsOptional()
  @IsMongoId()
  levelId?: string;
}
