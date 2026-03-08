import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JuryDecision, JuryDecisionSchema } from './jury-decision.schema';
import { JuryService } from './jury.service';
import { JuryController } from './jury.controller';
import { StudentProfile, StudentProfileSchema } from '../students/student-profile.schema';
import { Group, GroupSchema } from '../academic/group.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: JuryDecision.name, schema: JuryDecisionSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  providers: [JuryService],
  controllers: [JuryController],
})
export class JuryModule {}
