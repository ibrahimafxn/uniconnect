import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SubmissionStatus } from '../assignment-submission.schema';

export class UpdateSubmissionDto {
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
