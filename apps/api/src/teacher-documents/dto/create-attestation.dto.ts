import { IsOptional, IsString } from 'class-validator';

export class CreateAttestationDto {
  @IsOptional()
  @IsString()
  purpose?: string;
}
