import { IsMongoId, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  name!: string;

  @IsMongoId()
  offerId!: string;
}
