import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateExamSubjectDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsMongoId()
  academicYearId?: string;
}
