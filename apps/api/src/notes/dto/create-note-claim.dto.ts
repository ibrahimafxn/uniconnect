import { IsMongoId, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNoteClaimDto {
  @IsMongoId()
  evaluationId!: string;

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsNumber()
  requestedScore?: number;
}
