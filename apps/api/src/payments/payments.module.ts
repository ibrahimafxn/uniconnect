import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentPlan, PaymentPlanSchema } from './payment-plan.schema';
import { Payment, PaymentSchema } from './payment.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { InterventionService } from './intervention.service';
import { InterventionController } from './intervention.controller';
import { InterventionSheet, InterventionSheetSchema } from './intervention-sheet.schema';
import { StudentProfile, StudentProfileSchema } from '../students/student-profile.schema';
import { EmailService } from '../common/email.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: PaymentPlan.name, schema: PaymentPlanSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: InterventionSheet.name, schema: InterventionSheetSchema },
    ]),
  ],
  providers: [PaymentsService, EmailService, InterventionService],
  controllers: [PaymentsController, InterventionController],
})
export class PaymentsModule {}
