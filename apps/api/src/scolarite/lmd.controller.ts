import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LmdService } from './lmd.service';
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

@Controller('scolarite/lmd')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Scolarité — LMD & Clôture Notes')
@ApiBearerAuth()
export class LmdController {
  constructor(private readonly lmdService: LmdService) {}

  // ─── Configuration LMD ───────────────────────────────────────────────────

  @Get('config/:offerId')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Lire la configuration LMD d\'une offre' })
  getConfig(@Param('offerId') offerId: string) {
    return this.lmdService.getConfig(offerId);
  }

  @Put('config/:offerId')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Créer ou mettre à jour la configuration LMD d\'une offre' })
  upsertConfig(
    @Param('offerId') offerId: string,
    @Body() dto: any,
    @Request() req: AuthReq,
  ) {
    return this.lmdService.upsertConfig(offerId, dto, this.actor(req));
  }

  // ─── Calcul des résultats ─────────────────────────────────────────────────

  @Post('calculate/:semesterId')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Lancer le calcul des résultats LMD pour un semestre' })
  @ApiResponse({ status: 201, description: 'Résultats calculés' })
  calculateResults(
    @Param('semesterId') semesterId: string,
    @Body('offerId') offerId: string,
    @Request() req: AuthReq,
  ) {
    return this.lmdService.calculateResults(semesterId, offerId, this.actor(req));
  }

  @Get('results/:semesterId')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Lister les résultats LMD d\'un semestre' })
  @ApiQuery({ name: 'offerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'admitted', 'retake', 'aap', 'excluded'] })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listResults(
    @Param('semesterId') semesterId: string,
    @Query('offerId') offerId?: string,
    @Query('status') status?: string,
    @Query('skip') skip = '0',
    @Query('limit') limit = '50',
  ) {
    return this.lmdService.listResults({ semesterId, offerId, status, skip: Number(skip), limit: Number(limit) });
  }

  @Get('results/:semesterId/student/:studentId')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Résultat LMD d\'un étudiant pour un semestre' })
  getStudentResult(
    @Param('semesterId') semesterId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.lmdService.getStudentResult(semesterId, studentId);
  }

  // ─── Périodes d'évaluation ────────────────────────────────────────────────

  @Get('periods')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Lister les périodes d\'évaluation' })
  @ApiQuery({ name: 'semesterId', required: false })
  @ApiQuery({ name: 'offerId', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listPeriods(
    @Query('semesterId') semesterId?: string,
    @Query('offerId') offerId?: string,
    @Query('skip') skip = '0',
    @Query('limit') limit = '20',
  ) {
    return this.lmdService.listPeriods({ semesterId, offerId, skip: Number(skip), limit: Number(limit) });
  }

  @Post('periods')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Créer une période d\'évaluation' })
  createPeriod(@Body() dto: any, @Request() req: AuthReq) {
    return this.lmdService.createPeriod(dto, this.actor(req));
  }

  @Patch('periods/:id/lock')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Verrouiller la saisie des notes (irréversible)' })
  lockPeriod(@Param('id') id: string, @Request() req: AuthReq) {
    return this.lmdService.lockPeriod(id, this.actor(req));
  }

  @Patch('periods/:id/remind')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Envoyer des rappels aux enseignants retardataires' })
  remindTeachers(@Param('id') id: string, @Request() req: AuthReq) {
    return this.lmdService.remindTeachers(id, this.actor(req));
  }

  @Get('periods/:id/completion')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Taux de complétude des notes par enseignant/matière' })
  getPeriodCompletion(@Param('id') id: string) {
    return this.lmdService.getPeriodCompletion(id);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

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
