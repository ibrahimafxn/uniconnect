import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '../application.schema';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @IsOptional()
  @IsString()
  decisionNote?: string;
}
