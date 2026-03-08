import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentRequestType } from '../document-request.schema';

export class CreateDocumentRequestDto {
  @IsEnum(DocumentRequestType)
  type!: DocumentRequestType;

  @IsOptional()
  @IsString()
  note?: string;
}
