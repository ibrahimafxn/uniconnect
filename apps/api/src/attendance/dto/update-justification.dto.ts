import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AbsenceJustificationStatus } from '../absence-justification.schema';

export class UpdateJustificationDto {
  @IsEnum(AbsenceJustificationStatus)
  status!: AbsenceJustificationStatus;

  @IsOptional()
  @IsString()
  decisionNote?: string;
}
