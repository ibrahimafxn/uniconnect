import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AttendanceAlertService } from './attendance-alert.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';

type AuthReq = {
  user: { userId: string; email?: string; role: Role };
  ip?: string;
  headers?: Record<string, string>;
};

const SCOLARITE_ROLES = [Role.SuperAdmin, Role.Admin, Role.Scolarite];

@Controller('scolarite/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Scolarité — Assiduité & Alertes')
@ApiBearerAuth()
export class AttendanceAlertController {
  constructor(private readonly alertService: AttendanceAlertService) {}

  @Post('check-alerts')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Lancer la détection des alertes d\'assiduité (seuil 30%)' })
  checkAlerts(@Body('offerId') offerId: string, @Request() req: AuthReq) {
    return this.alertService.checkAlerts(offerId, this.actor(req));
  }

  @Get('alerts')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Lister les alertes d\'assiduité' })
  @ApiQuery({ name: 'offerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'justified', 'convoked', 'excluded_exam'] })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listAlerts(
    @Query('offerId') offerId?: string,
    @Query('status') status?: any,
    @Query('skip') skip = '0',
    @Query('limit') limit = '50',
  ) {
    return this.alertService.listAlerts({ offerId, status, skip: Number(skip), limit: Number(limit) });
  }

  @Get('alerts/:id')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Détail d\'une alerte' })
  getAlert(@Param('id') id: string) {
    return this.alertService.getAlert(id);
  }

  @Patch('alerts/:id')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une alerte' })
  updateAlert(
    @Param('id') id: string,
    @Body('status') status: any,
    @Request() req: AuthReq,
  ) {
    return this.alertService.updateAlert(id, status, this.actor(req));
  }

  @Post('alerts/:id/convoke')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Envoyer une convocation à l\'étudiant' })
  convoke(@Param('id') id: string, @Request() req: AuthReq) {
    return this.alertService.convokeStudent(id, this.actor(req));
  }

  @Post('alerts/:id/exclude-exam')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Exclure l\'étudiant des examens' })
  excludeFromExam(@Param('id') id: string, @Request() req: AuthReq) {
    return this.alertService.excludeFromExam(id, this.actor(req));
  }

  @Get('report/:offerId')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Rapport d\'assiduité complet par promotion' })
  getReport(@Param('offerId') offerId: string) {
    return this.alertService.getAttendanceReport(offerId);
  }

  private actor(req: AuthReq) {
    return {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
  }
}
