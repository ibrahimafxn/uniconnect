import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
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

  @Get('unpaid')
  listUnpaid(@Query('asOf') asOf?: string) {
    const date = asOf ? new Date(asOf) : new Date();
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
    return this.paymentsService.listUnpaid(safeDate);
  }

  @Get(':id/receipt')
  async getReceipt(@Param('id') id: string, @Res() res: Response) {
    const { payment, student, plan } = await this.paymentsService.buildReceipt(
      id,
    );

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="receipt-${payment._id}.pdf"`,
      );
      res.send(buffer);
    });

    doc.fontSize(18).text('Recu de paiement', { align: 'center' });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Etudiant: ${student?.lastName ?? ''} ${student?.firstName ?? ''}`,
      );
    doc.text(`Matricule: ${student?.studentNumber ?? ''}`);
    doc.text(`Date: ${new Date(payment.paidAt).toLocaleDateString('fr-FR')}`);
    doc.moveDown();
    doc.text(`Montant: ${payment.amount} ${payment.currency}`);
    if (payment.reference) {
      doc.text(`Reference: ${payment.reference}`);
    }
    if (plan) {
      doc.moveDown();
      doc.text(`Plan: ${plan.label}`);
      doc.text(`Total plan: ${plan.totalAmount} ${plan.currency}`);
    }
    doc.end();
  }

  @Post()
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment({
      ...dto,
      paidAt: new Date(dto.paidAt),
    });
  }
}
