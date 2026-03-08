import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewDossierDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'waitlisted', 'incomplete'] })
  @IsIn(['approved', 'rejected', 'waitlisted', 'incomplete'])
  decision: 'approved' | 'rejected' | 'waitlisted' | 'incomplete';

  @ApiPropertyOptional({ description: 'Motif de refus (obligatoire si rejected)' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Documents manquants (si incomplete)' })
  @IsOptional()
  missingDocuments?: string[];
}
