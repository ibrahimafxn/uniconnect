import { IsMongoId } from 'class-validator';
import { IsInt, Min } from 'class-validator';

export class CreateProgramOfferDto {
  @IsMongoId()
  programId!: string;

  @IsMongoId()
  levelId!: string;

  @IsMongoId()
  academicYearId!: string;

  @IsInt()
  @Min(0)
  capacity!: number;
}
