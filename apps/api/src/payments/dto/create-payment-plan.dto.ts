import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInstallmentDto {
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class CreatePaymentPlanDto {
  @IsMongoId()
  studentId!: string;

  @IsString()
  label!: string;

  @IsNumber()
  @Type(() => Number)
  totalAmount!: number;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInstallmentDto)
  installments?: CreateInstallmentDto[];
}
