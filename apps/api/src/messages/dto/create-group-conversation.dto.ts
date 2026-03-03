import { ArrayMinSize, IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateGroupConversationDto {
  @IsString()
  title!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  participantIds!: string[];

  @IsOptional()
  @IsString()
  description?: string;
}
