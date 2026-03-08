import {
  Body,
  Controller,
  Get,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('admin/dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Tableau de bord exécutif (UC-A07)',
    description:
      'KPIs : effectifs, taux de paiement, activité récente, année académique active.',
  })
  getExecutiveDashboard() {
    return this.service.getExecutiveDashboard();
  }

  @Get('mesrs-report')
  @ApiOperation({
    summary: 'Rapport statistique MESRS (UC-A05)',
    description:
      'Rapport réglementaire : effectifs par genre, filière, niveau, taux de remplissage.',
  })
  @ApiQuery({ name: 'academicYearId', required: false })
  getMesrsReport(@Query('academicYearId') academicYearId?: string) {
    return this.service.getMesrsReport(academicYearId);
  }

  @Get('system-status')
  @ApiOperation({
    summary: 'Supervision système : activité 24h, utilisateurs suspendus',
  })
  getSystemStatus() {
    return this.service.getSystemStatus();
  }

  @Post('announcements')
  @ApiOperation({
    summary: 'Diffuser une annonce officielle (UC-A08)',
    description:
      'Envoie une annonce à un ou plusieurs groupes de la communauté universitaire.',
  })
  broadcastAnnouncement(
    @Body()
    body: {
      title: string;
      content: string;
      targetRoles?: string[];
    },
    @Request() req: any,
  ) {
    return this.service.broadcastAnnouncement({
      ...body,
      actor: this.buildActor(req),
    });
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
