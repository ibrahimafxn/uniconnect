import { IsDateString, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateJustificationDto {
  @IsOptional()
  @IsMongoId()
  sessionId?: string;

  @IsDateString()
  absenceDate!: string;

  @IsString()
  reason!: string;
}
