import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InscriptionService } from './inscription.service';
import { InscriptionController } from './inscription.controller';
import {
  InscriptionCampaign,
  InscriptionCampaignSchema,
} from './schemas/inscription-campaign.schema';
import {
  ApplicationDossier,
  ApplicationDossierSchema,
} from './schemas/application-dossier.schema';
import {
  StudentProfile,
  StudentProfileSchema,
} from '../students/student-profile.schema';
import { AuditModule } from '../audit/audit.module';
import { EmailService } from '../common/email.service';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: InscriptionCampaign.name, schema: InscriptionCampaignSchema },
      { name: ApplicationDossier.name, schema: ApplicationDossierSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
    ]),
  ],
  providers: [InscriptionService, EmailService],
  controllers: [InscriptionController],
  exports: [InscriptionService],
})
export class ScolariteModule {}
