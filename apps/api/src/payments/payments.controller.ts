import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('plans')
  listPlans() {
    return this.paymentsService.listPlans();
  }

  @Post('plans')
  createPlan(@Body() dto: CreatePaymentPlanDto) {
    return this.paymentsService.createPlan(dto);
  }

  @Get()
  listPayments() {
    return this.paymentsService.listPayments();
  }

  @Post()
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment({
      ...dto,
      paidAt: new Date(dto.paidAt),
    });
  }
}
