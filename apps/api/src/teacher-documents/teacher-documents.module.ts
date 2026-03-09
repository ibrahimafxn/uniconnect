import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherDocument, TeacherDocumentSchema } from './teacher-document.schema';
import { TeacherDocumentsService } from './teacher-documents.service';
import { TeacherDocumentsController, AdminTeacherDocumentsController } from './teacher-documents.controller';
import { TeacherProfile, TeacherProfileSchema } from '../teacher-profile/teacher-profile.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeacherDocument.name, schema: TeacherDocumentSchema },
      { name: TeacherProfile.name, schema: TeacherProfileSchema },
    ]),
    AuditModule,
  ],
  providers: [TeacherDocumentsService],
  controllers: [TeacherDocumentsController, AdminTeacherDocumentsController],
})
export class TeacherDocumentsModule {}
