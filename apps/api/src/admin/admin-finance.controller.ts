import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { AdminFinanceService, FeeInstallmentInput } from './admin-finance.service';
import { ExemptionType } from './schemas/fee-exemption.schema';
import { PaymentMethodCode } from './schemas/fee-template.schema';

@ApiTags('admin/finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
@Controller('admin/finance')
export class AdminFinanceController {
  constructor(private readonly service: AdminFinanceService) {}

  // ── Fee templates ─────────────────────────────────────────────────────────

  @Post('fee-templates')
  @ApiOperation({
    summary: 'Créer un modèle de frais de scolarité (UC-A03)',
    description: 'Définit les frais, tranches et modes de paiement pour une offre.',
  })
  createFeeTemplate(
    @Body()
    body: {
      label: string;
      offerId: string;
      totalAmount: number;
      currency?: string;
      installments: FeeInstallmentInput[];
      acceptedMethods?: PaymentMethodCode[];
    },
    @Request() req: any,
  ) {
    return this.service.createFeeTemplate({ ...body, actor: this.buildActor(req) });
  }

  @Get('fee-templates')
  @ApiOperation({ summary: 'Lister les modèles de frais actifs' })
  @ApiQuery({ name: 'offerId', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listFeeTemplates(
    @Query('offerId') offerId?: string,
    @Query('skip') skip = '0',
    @Query('limit') limit = '50',
  ) {
    return this.service.listFeeTemplates({
      offerId,
      skip: parseInt(skip, 10),
      limit: Math.min(parseInt(limit, 10), 200),
    });
  }

  @Patch('fee-templates/:id')
  @ApiOperation({ summary: 'Modifier un modèle de frais' })
  updateFeeTemplate(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      label: string;
      totalAmount: number;
      installments: FeeInstallmentInput[];
      acceptedMethods: PaymentMethodCode[];
      isActive: boolean;
    }>,
    @Request() req: any,
  ) {
    return this.service.updateFeeTemplate(id, body, this.buildActor(req));
  }

  @Post('fee-templates/:id/apply')
  @ApiOperation({
    summary: 'Appliquer un modèle de frais à une liste d\'étudiants',
    description: 'Crée un PaymentPlan par étudiant basé sur le modèle sélectionné.',
  })
  applyFeeTemplate(
    @Param('id') id: string,
    @Body() body: { studentIds: string[] },
    @Request() req: any,
  ) {
    return this.service.applyFeeTemplate({
      templateId: id,
      studentIds: body.studentIds,
      actor: this.buildActor(req),
    });
  }

  // ── Exemptions ────────────────────────────────────────────────────────────

  @Post('exemptions')
  @ApiOperation({ summary: 'Créer une exonération de frais (boursier, cas social)' })
  createExemption(
    @Body()
    body: {
      studentId: string;
      academicYearId: string;
      type: ExemptionType;
      percentage: number;
      reason: string;
    },
    @Request() req: any,
  ) {
    return this.service.createExemption({ ...body, actor: this.buildActor(req) });
  }

  @Get('exemptions')
  @ApiOperation({ summary: 'Lister les exonérations' })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listExemptions(
    @Query('academicYearId') academicYearId?: string,
    @Query('skip') skip = '0',
    @Query('limit') limit = '50',
  ) {
    return this.service.listExemptions({
      academicYearId,
      skip: parseInt(skip, 10),
      limit: Math.min(parseInt(limit, 10), 200),
    });
  }

  @Delete('exemptions/:id')
  @ApiOperation({ summary: 'Supprimer une exonération' })
  deleteExemption(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteExemption(id, this.buildActor(req));
  }

  // ── Financial report ──────────────────────────────────────────────────────

  @Get('report')
  @ApiOperation({
    summary: 'Rapport financier : encaissements, taux de recouvrement',
  })
  @ApiQuery({ name: 'academicYearId', required: false })
  getFinancialReport(@Query('academicYearId') academicYearId?: string) {
    return this.service.getFinancialReport(academicYearId);
  }

  private buildActor(req: any) {
    return {
      userId: req.user?.userId ?? req.user?._id ?? 'unknown',
      role: req.user?.role ?? 'admin',
      email: req.user?.email,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
  }
}
