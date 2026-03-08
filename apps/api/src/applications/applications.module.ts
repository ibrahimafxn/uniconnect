import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application, ApplicationSchema } from './application.schema';
import { ApplicationDocument, ApplicationDocumentSchema } from './application-document.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: ApplicationDocument.name, schema: ApplicationDocumentSchema },
    ]),
    AuditModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
