import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AnnotateDossierDto {
  @ApiProperty({ description: 'Annotation interne (visible scolarité uniquement)' })
  @IsString()
  internalNote: string;
}
