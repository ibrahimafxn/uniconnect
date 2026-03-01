import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentPlan, PaymentPlanSchema } from './payment-plan.schema';
import { Payment, PaymentSchema } from './payment.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StudentProfile, StudentProfileSchema } from '../students/student-profile.schema';
import { EmailService } from '../common/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentPlan.name, schema: PaymentPlanSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
    ]),
  ],
  providers: [PaymentsService, EmailService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
