import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Nom de la campagne' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'ID de l\'offre de formation ciblée' })
  @IsMongoId()
  offerId: string;

  @ApiProperty({ description: 'Date d\'ouverture' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Date de fermeture' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Capacité maximale d\'accueil' })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ description: 'Pièces justificatives obligatoires', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Activer la liste d\'attente' })
  @IsOptional()
  @IsBoolean()
  waitingListEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Limite de la liste d\'attente (0 = illimitée)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  waitingListLimit?: number;
}
