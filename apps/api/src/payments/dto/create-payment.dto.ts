import {
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsMongoId()
  studentId!: string;

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

  @IsDateString()
  paidAt!: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
