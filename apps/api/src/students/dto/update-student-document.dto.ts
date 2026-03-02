import { IsOptional, IsString } from 'class-validator';

export class UpdateStudentDocumentDto {
  @IsOptional()
  @IsString()
  label?: string;
}
