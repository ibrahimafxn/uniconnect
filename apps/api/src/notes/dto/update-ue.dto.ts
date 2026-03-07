import { IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUEDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  ects?: number;

  @IsOptional()
  @IsMongoId()
  levelId?: string;

  @IsOptional()
  @IsMongoId()
  semesterId?: string;
}
