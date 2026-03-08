import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentPaymentDto {
  @IsOptional()
  @IsMongoId()
  planId?: string;

  @IsOptional()
  @IsMongoId()
  installmentId?: string;

  @IsNumber()
  @Type(() => Number)
  amount!: number;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  provider?: string; // Orange Money, MTN MoMo, Moov Money
}
