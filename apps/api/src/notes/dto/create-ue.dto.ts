import { IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUEDto {
  @ApiProperty({ description: "Nom de l'UE", example: 'Mathématiques' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'UE-MATH' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'Crédits ECTS', example: 3 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  ects!: number;

  @ApiProperty({ description: 'ID du niveau (L1, L2…)' })
  @IsMongoId()
  levelId!: string;

  @ApiPropertyOptional({ description: 'ID du semestre (S1, S2…)' })
  @IsOptional()
  @IsMongoId()
  semesterId?: string;
}
