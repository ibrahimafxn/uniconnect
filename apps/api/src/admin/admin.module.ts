import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// External schemas
import { User, UserSchema } from '../users/user.schema';
import { StudentProfile, StudentProfileSchema } from '../students/student-profile.schema';
import { Enrollment, EnrollmentSchema } from '../students/enrollment.schema';
import { Payment, PaymentSchema } from '../payments/payment.schema';
import { PaymentPlan, PaymentPlanSchema } from '../payments/payment-plan.schema';
import { AuditLog, AuditLogSchema } from '../audit/audit-log.schema';
import { AcademicYear, AcademicYearSchema } from '../academic/academic-year.schema';
import { Semester, SemesterSchema } from '../academic/semester.schema';
import { ProgramOffer, ProgramOfferSchema } from '../academic/program-offer.schema';
import { Group, GroupSchema } from '../academic/group.schema';
import { Program, ProgramSchema } from '../academic/program.schema';
import { Level, LevelSchema } from '../academic/level.schema';
import { TeacherProfile, TeacherProfileSchema } from '../teacher-profile/teacher-profile.schema';

// Admin schemas
import { BulkImportJob, BulkImportJobSchema } from './schemas/bulk-import-job.schema';
import { FeeTemplate, FeeTemplateSchema } from './schemas/fee-template.schema';
import { FeeExemption, FeeExemptionSchema } from './schemas/fee-exemption.schema';
import { AcademicCalendarEvent, AcademicCalendarEventSchema } from './schemas/academic-calendar-event.schema';

// Admin services & controllers
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminAcademicService } from './admin-academic.service';
import { AdminAcademicController } from './admin-academic.controller';
import { AdminFinanceService } from './admin-finance.service';
import { AdminFinanceController } from './admin-finance.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardController } from './admin-dashboard.controller';

// Shared
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: PaymentPlan.name, schema: PaymentPlanSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: AcademicYear.name, schema: AcademicYearSchema },
      { name: Semester.name, schema: SemesterSchema },
      { name: ProgramOffer.name, schema: ProgramOfferSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Program.name, schema: ProgramSchema },
      { name: Level.name, schema: LevelSchema },
      { name: TeacherProfile.name, schema: TeacherProfileSchema },
      // Admin-specific
      { name: BulkImportJob.name, schema: BulkImportJobSchema },
      { name: FeeTemplate.name, schema: FeeTemplateSchema },
      { name: FeeExemption.name, schema: FeeExemptionSchema },
      { name: AcademicCalendarEvent.name, schema: AcademicCalendarEventSchema },
    ]),
  ],
  controllers: [
    AdminUsersController,
    AdminAcademicController,
    AdminFinanceController,
    AdminDashboardController,
  ],
  providers: [
    AdminUsersService,
    AdminAcademicService,
    AdminFinanceService,
    AdminDashboardService,
  ],
})
export class AdminModule {}
