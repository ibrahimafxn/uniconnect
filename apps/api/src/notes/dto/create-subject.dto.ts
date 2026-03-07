import { IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubjectDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  coefficient!: number;

  @IsMongoId()
  levelId!: string;

  /** UE parente (structure LMD) */
  @IsOptional()
  @IsMongoId()
  ueId?: string;
}
