import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { DocumentRequestStatus } from '../document-request.schema';

export class UpdateDocumentRequestDto {
  @IsEnum(DocumentRequestStatus)
  status!: DocumentRequestStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsMongoId()
  documentId?: string;
}
