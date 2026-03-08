import { IsDateString, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  groupId!: string;

  @IsOptional()
  @IsMongoId()
  subjectId?: string;

  @IsOptional()
  @IsMongoId()
  sessionId?: string;

  @IsDateString()
  dueDate!: string;
}
