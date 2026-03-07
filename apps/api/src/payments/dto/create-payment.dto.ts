import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsMongoId()
  studentId!: string;

  @IsOptional()
  @IsMongoId()
  planId?: string;

  @ValidateIf((o) => !!o.planId)
  @IsMongoId()
  @IsNotEmpty()
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

  @IsOptional()
  @IsIn(['carte_bancaire', 'espece', 'mobile_money'])
  paymentMethod?: 'carte_bancaire' | 'espece' | 'mobile_money';
}
