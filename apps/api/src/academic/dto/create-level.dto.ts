import { IsMongoId, IsString } from 'class-validator';

export class CreateLevelDto {
  @IsString()
  name!: string;

  @IsMongoId()
  programId!: string;
}
