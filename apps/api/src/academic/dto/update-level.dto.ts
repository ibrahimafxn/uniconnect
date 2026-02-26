import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateLevelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsMongoId()
  programId?: string;
}
