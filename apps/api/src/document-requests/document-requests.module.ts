import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentRequestsController } from './document-requests.controller';
import { DocumentRequestsService } from './document-requests.service';
import { DocumentRequest, DocumentRequestSchema } from './document-request.schema';
import { StudentProfile, StudentProfileSchema } from '../students/student-profile.schema';
import { StudentDocument, StudentDocumentSchema } from '../students/student-document.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentRequest.name, schema: DocumentRequestSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: StudentDocument.name, schema: StudentDocumentSchema },
    ]),
    AuditModule,
  ],
  controllers: [DocumentRequestsController],
  providers: [DocumentRequestsService],
})
export class DocumentRequestsModule {}
