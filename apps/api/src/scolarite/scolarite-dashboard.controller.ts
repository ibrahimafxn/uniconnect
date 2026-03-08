import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ScolariteDashboardService } from './scolarite-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';

const SCOLARITE_ROLES = [Role.SuperAdmin, Role.Admin, Role.Scolarite];

@Controller('scolarite/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Scolarité — Dashboard & Rapports')
@ApiBearerAuth()
export class ScolariteDashboardController {
  constructor(private readonly dashService: ScolariteDashboardService) {}

  // ─── Dashboard principal ──────────────────────────────────────────────────

  @Get()
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Tableau de bord principal scolarité (KPIs agrégés)' })
  getDashboard() {
    return this.dashService.getDashboard();
  }

  @Get('inscriptions')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Statistiques de remplissage par campagne d\'inscription' })
  getInscriptionStats() {
    return this.dashService.getInscriptionStats();
  }

  @Get('alerts-summary')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Résumé des alertes d\'assiduité par statut' })
  getAlertsSummary() {
    return this.dashService.getAlertsSummary();
  }

  @Get('financial')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Statistiques financières (scolarité)' })
  getFinancialStats() {
    return this.dashService.getFinancialStats();
  }

  // ─── Rapports MESRS ───────────────────────────────────────────────────────

  @Get('mesrs-report')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Rapport MESRS : distribution étudiants par genre, statut, taux de réussite' })
  @ApiQuery({ name: 'academicYearId', required: false })
  getMesrsReport(@Query('academicYearId') academicYearId?: string) {
    return this.dashService.getMesrsReport(academicYearId);
  }

  @Get('results-report/:offerId')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Rapport de résultats par promotion (distribution des notes, taux de réussite)' })
  getResultsReport(@Param('offerId') offerId: string) {
    return this.dashService.getResultsReport(offerId);
  }

  // ─── Logs d'audit ─────────────────────────────────────────────────────────

  @Get('audit-logs')
  @Roles(Role.SuperAdmin, Role.Admin)
  @ApiOperation({ summary: 'Consulter les logs d\'audit scolarité' })
  @ApiQuery({ name: 'entity',  required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'action',  required: false })
  @ApiQuery({ name: 'from',    required: false })
  @ApiQuery({ name: 'to',      required: false })
  @ApiQuery({ name: 'skip',    required: false })
  @ApiQuery({ name: 'limit',   required: false })
  listAuditLogs(
    @Query('entity')  entity?: string,
    @Query('actorId') actorId?: string,
    @Query('action')  action?: string,
    @Query('from')    from?: string,
    @Query('to')      to?: string,
    @Query('skip')    skip = '0',
    @Query('limit')   limit = '50',
  ) {
    return this.dashService.listAuditLogs({
      entity,
      actorId,
      action,
      from,
      to,
      skip: Number(skip),
      limit: Number(limit),
    });
  }
}
