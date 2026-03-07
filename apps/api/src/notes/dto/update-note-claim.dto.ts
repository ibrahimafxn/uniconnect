import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { NoteClaimStatus } from '../schemas/note-claim.schema';

export class UpdateNoteClaimDto {
  @IsEnum(NoteClaimStatus)
  status!: NoteClaimStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  decisionNote?: string;
}
