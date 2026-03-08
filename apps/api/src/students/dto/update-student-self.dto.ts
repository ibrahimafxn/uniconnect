import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateStudentSelfDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsObject()
  notificationPrefs?: { email: boolean; sms: boolean; push: boolean };
}
