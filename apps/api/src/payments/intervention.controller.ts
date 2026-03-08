import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InterventionService } from './intervention.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';

type Actor = { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> };

@Controller('interventions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Interventions (vacataires)')
@ApiBearerAuth()
export class InterventionController {
  constructor(private readonly svc: InterventionService) {}

  @Get()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Lister les feuilles d\'intervention' })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'status', required: false })
  list(
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Request() req?: Actor,
  ) {
    return this.svc.listSheets({ teacherId, status, role: req!.user.role, userId: req!.user.userId });
  }

  @Post()
  @Roles(Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Créer une feuille d\'intervention (brouillon)' })
  create(
    @Body() body: {
      period: string;
      hoursCM?: number;
      hoursTD?: number;
      hoursTP?: number;
      hourlyRate: number;
      currency?: string;
      comment?: string;
    },
    @Request() req: Actor,
  ) {
    return this.svc.createSheet(body, {
      userId: req.user.userId, email: req.user.email,
      role: req.user.role, ip: req.ip, userAgent: req.headers?.['user-agent'],
    });
  }

  @Patch(':id/submit')
  @Roles(Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Soumettre une feuille pour validation' })
  submit(@Param('id') id: string, @Request() req: Actor) {
    return this.svc.submitSheet(id, {
      userId: req.user.userId, email: req.user.email,
      role: req.user.role, ip: req.ip, userAgent: req.headers?.['user-agent'],
    });
  }

  @Patch(':id/validate')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Valider une feuille d\'intervention (admin)' })
  validate(
    @Param('id') id: string,
    @Body() body: { adminComment?: string },
    @Request() req: Actor,
  ) {
    return this.svc.validateSheet(id, body.adminComment, {
      userId: req.user.userId, email: req.user.email,
      role: req.user.role, ip: req.ip, userAgent: req.headers?.['user-agent'],
    });
  }

  @Patch(':id/paid')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Marquer une feuille comme payée' })
  markPaid(@Param('id') id: string, @Request() req: Actor) {
    return this.svc.markPaid(id, {
      userId: req.user.userId, email: req.user.email,
      role: req.user.role, ip: req.ip, userAgent: req.headers?.['user-agent'],
    });
  }
}
