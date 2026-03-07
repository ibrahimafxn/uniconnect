import { IsInt, IsMongoId, IsOptional, Min } from 'class-validator';

export class UpdateProgramOfferDto {
  @IsOptional()
  @IsMongoId()
  programId?: string;

  @IsOptional()
  @IsMongoId()
  levelId?: string;

  @IsOptional()
  @IsMongoId()
  academicYearId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}
