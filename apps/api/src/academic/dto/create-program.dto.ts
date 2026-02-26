import { IsOptional, IsString } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;
}
