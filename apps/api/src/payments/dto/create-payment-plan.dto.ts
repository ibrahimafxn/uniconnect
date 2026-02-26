import { IsMongoId, IsNumber, IsString } from 'class-validator';

export class CreatePaymentPlanDto {
  @IsMongoId()
  studentId!: string;

  @IsString()
  label!: string;

  @IsNumber()
  totalAmount!: number;

  @IsString()
  currency!: string;
}
