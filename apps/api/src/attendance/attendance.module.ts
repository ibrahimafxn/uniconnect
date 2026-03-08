import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { Attendance, AttendanceSchema } from './attendance.schema';
import { AbsenceJustification, AbsenceJustificationSchema } from './absence-justification.schema';
import { StudentProfile, StudentProfileSchema } from '../students/student-profile.schema';
import { Session, SessionSchema } from '../planning/session.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: AbsenceJustification.name, schema: AbsenceJustificationSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  providers: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
