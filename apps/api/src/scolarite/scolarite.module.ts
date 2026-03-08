import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InscriptionService } from './inscription.service';
import { InscriptionController } from './inscription.controller';
import { LmdService } from './lmd.service';
import { LmdController } from './lmd.controller';
import { DeliberationService } from './deliberation.service';
import { DeliberationController } from './deliberation.controller';
import {
  InscriptionCampaign,
  InscriptionCampaignSchema,
} from './schemas/inscription-campaign.schema';
import {
  ApplicationDossier,
  ApplicationDossierSchema,
} from './schemas/application-dossier.schema';
import { LmdConfig, LmdConfigSchema } from './schemas/lmd-config.schema';
import {
  EvaluationPeriod,
  EvaluationPeriodSchema,
} from './schemas/evaluation-period.schema';
import {
  SemesterResult,
  SemesterResultSchema,
} from './schemas/semester-result.schema';
import {
  Deliberation,
  DeliberationSchema,
} from './schemas/deliberation.schema';
import {
  JuryDecision,
  JuryDecisionSchema,
} from './schemas/jury-decision.schema';
import {
  StudentProfile,
  StudentProfileSchema,
} from '../students/student-profile.schema';
import { Subject, SubjectSchema } from '../notes/schemas/subject.schema';
import { Evaluation, EvaluationSchema } from '../notes/schemas/evaluation.schema';
import { Grade, GradeSchema } from '../notes/schemas/grade.schema';
import { User, UserSchema } from '../users/user.schema';
import { Group, GroupSchema } from '../academic/group.schema';
import { AuditModule } from '../audit/audit.module';
import { EmailService } from '../common/email.service';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: InscriptionCampaign.name, schema: InscriptionCampaignSchema },
      { name: ApplicationDossier.name, schema: ApplicationDossierSchema },
      { name: LmdConfig.name, schema: LmdConfigSchema },
      { name: EvaluationPeriod.name, schema: EvaluationPeriodSchema },
      { name: SemesterResult.name, schema: SemesterResultSchema },
      { name: Deliberation.name, schema: DeliberationSchema },
      { name: JuryDecision.name, schema: JuryDecisionSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Evaluation.name, schema: EvaluationSchema },
      { name: Grade.name, schema: GradeSchema },
      { name: User.name, schema: UserSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  providers: [InscriptionService, LmdService, DeliberationService, EmailService],
  controllers: [InscriptionController, LmdController, DeliberationController],
  exports: [InscriptionService, LmdService, DeliberationService],
})
export class ScolariteModule {}
