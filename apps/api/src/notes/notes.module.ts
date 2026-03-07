import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { Subject, SubjectSchema } from './schemas/subject.schema';
import { Evaluation, EvaluationSchema } from './schemas/evaluation.schema';
import { Grade, GradeSchema } from './schemas/grade.schema';
import { NoteClaim, NoteClaimSchema } from './schemas/note-claim.schema';
import { StudentProfile, StudentProfileSchema } from '../students/student-profile.schema';
import { Group, GroupSchema } from '../academic/group.schema';
import { AuditModule } from '../audit/audit.module';
import { EmailService } from '../common/email.service';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: Subject.name, schema: SubjectSchema },
      { name: Evaluation.name, schema: EvaluationSchema },
      { name: Grade.name, schema: GradeSchema },
      { name: NoteClaim.name, schema: NoteClaimSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  providers: [NotesService, EmailService],
  controllers: [NotesController],
})
export class NotesModule {}
