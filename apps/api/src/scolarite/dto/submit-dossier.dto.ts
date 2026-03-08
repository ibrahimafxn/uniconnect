import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';

export class SubmitDossierDto {
  @ApiProperty({ description: 'ID de la campagne' })
  @IsMongoId()
  campaignId: string;

  @ApiProperty({ description: 'ID du profil étudiant' })
  @IsMongoId()
  studentId: string;

  @ApiPropertyOptional({ description: 'Documents soumis', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  submittedDocuments?: string[];
}
