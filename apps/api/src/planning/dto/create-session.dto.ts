import {
  IsDateString,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateSessionDto {
  @IsDateString()
  date!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime!: string;

  @IsMongoId()
  groupId!: string;

  @IsMongoId()
  teacherId!: string;

  @IsMongoId()
  roomId!: string;

  @IsOptional()
  @IsString()
  label?: string;
}
