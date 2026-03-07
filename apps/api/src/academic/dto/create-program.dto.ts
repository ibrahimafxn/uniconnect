import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  domaine?: string;

  @IsOptional()
  @IsIn(['universitaire', 'bts', 'but', 'cpge'])
  type?: string;
}
