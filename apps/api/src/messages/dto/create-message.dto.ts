import { IsArray, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  body?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  attachmentIds?: string[];
}
