import { IsIn, IsOptional, IsString } from 'class-validator';
import type { ProgramType } from '../program.schema';

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  domaine?: string;

  @IsOptional()
  @IsIn(['universitaire', 'bts', 'but', 'cpge'])
  type?: ProgramType;
}
