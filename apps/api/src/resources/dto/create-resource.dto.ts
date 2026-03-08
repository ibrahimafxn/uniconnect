import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateResourceDto {
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
}
