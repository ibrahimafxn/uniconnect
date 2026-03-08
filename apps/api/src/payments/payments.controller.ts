import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentPlanDto } from './dto/update-payment-plan.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreateStudentPaymentDto } from './dto/create-student-payment.dto';

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

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePaymentPlanDto) {
    const installments = dto.installments
      ? dto.installments.map((inst) => ({
          ...inst,
          dueDate: inst.dueDate ? new Date(inst.dueDate) : undefined,
        }))
      : undefined;
    return this.paymentsService.updatePlan(id, {
      ...dto,
      installments,
    } as any);
  }

  @Delete('plans/:id')
  deletePlan(@Param('id') id: string) {
    return this.paymentsService.deletePlan(id);
  }

  @Get('plans/:id/export-pdf')
  async exportPlanPdf(@Param('id') id: string, @Res() res: Response) {
    const { plan, student, installmentStats } =
      await this.paymentsService.buildPlanExport(id);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="plan-${plan.label?.replace(/\s+/g, '_')}-${new Date().getTime()}.pdf"`,
      );
      res.send(buffer);
    });

    // Header
    doc.fontSize(20).text('Plan de Paiement', { align: 'center' });
    doc.moveDown();

    // Student info
    doc
      .fontSize(12)
      .text(
        `Étudiant: ${student?.lastName ?? ''} ${student?.firstName ?? ''}`,
      );
    doc.text(`Matricule: ${student?.studentNumber ?? ''}`);
    doc.moveDown();

    // Plan info
    doc.fontSize(14).text('Détails du Plan');
    doc
      .strokeColor('#999')
      .lineWidth(0.5)
      .moveTo(50, doc.y - 5)
      .lineTo(200, doc.y - 5)
      .stroke();
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Libellé: ${plan.label}`);
    doc.text(`Montant total: ${plan.totalAmount} ${plan.currency}`);
    doc.text(`Nombre d'échéances: ${plan.installments?.length || 0}`);
    doc.moveDown();

    // Installments table
    if (plan.installments && plan.installments.length > 0) {
      doc.fontSize(12).text('Détail des Échéances');
      doc
        .strokeColor('#999')
        .lineWidth(0.5)
        .moveTo(50, doc.y - 5)
        .lineTo(250, doc.y - 5)
        .stroke();
      doc.moveDown(0.5);

      // Table headers
      const col1 = 50;
      const col2 = 150;
      const col3 = 250;
      const col4 = 350;
      const col5 = 450;
      const rowHeight = 20;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Date', col1, doc.y);
      doc.text('Montant', col2, doc.y);
      doc.text('Statut', col3, doc.y);
      doc.text('Payé', col4, doc.y);
      doc.text('Solde', col5, doc.y);
      doc.moveDown();

      // Horizontal line
      doc
        .strokeColor('#999')
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.font('Helvetica').fontSize(10);
      (plan.installments ?? []).forEach((inst: any) => {
        const stat =
          installmentStats[inst._id || ''] || { paid: 0, status: 'unpaid' };
        const status =
          stat.status === 'paid'
            ? '✓ Payée'
            : stat.status === 'partial'
              ? '⊘ Partielle'
              : '✗ Impayée';

        doc.text(
          new Date(inst.dueDate).toLocaleDateString('fr-FR'),
          col1,
          doc.y,
        );
        doc.text(`${inst.amount} ${plan.currency}`, col2, doc.y);
        doc.text(status, col3, doc.y);
        doc.text(`${stat.paid} ${plan.currency}`, col4, doc.y);
        doc.text(`${(inst.amount || 0) - stat.paid} ${plan.currency}`, col5, doc.y);
        doc.moveDown();
      });

      // Horizontal line
      doc
        .strokeColor('#999')
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown();
    }

    // Export date
    doc
      .fontSize(10)
      .fillColor('#999')
      .text(
        `Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        { align: 'right' },
      );

    doc.end();
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
  @Roles(Role.Admin, Role.SuperAdmin, Role.Student)
  async getReceipt(
    @Param('id') id: string,
    @Res() res: Response,
    @Request() req: { user: { role: Role; email?: string } },
  ) {
    const { payment, student, plan } = await this.paymentsService.buildReceipt(
      id,
    );
    if (req.user.role === Role.Student) {
      const me = await this.paymentsService.findStudentByEmail(req.user.email ?? '');
      if (!me || String(payment.studentId) !== String(me._id)) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
    }

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

  @Get('me')
  @Roles(Role.Student)
  listMyPayments(@Request() req: { user: { email?: string } }) {
    return this.paymentsService.listMyPayments(req.user.email ?? '');
  }

  @Get('me/plan')
  @Roles(Role.Student)
  getMyPlan(@Request() req: { user: { email?: string } }) {
    return this.paymentsService.getMyPlan(req.user.email ?? '');
  }

  @Post('me')
  @Roles(Role.Student)
  createMyPayment(
    @Body() dto: CreateStudentPaymentDto,
    @Request() req: { user: { email?: string } },
  ) {
    return this.paymentsService.createStudentPayment(req.user.email ?? '', dto);
  }

  @Patch(':id')
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    const payload = {
      ...dto,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
    };
    return this.paymentsService.updatePayment(id, payload as any);
  }

  @Delete(':id')
  deletePayment(@Param('id') id: string) {
    return this.paymentsService.deletePayment(id);
  }
}
