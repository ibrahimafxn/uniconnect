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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeliberationService } from './deliberation.service';
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

@Controller('scolarite/deliberations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Scolarité — Délibérations')
@ApiBearerAuth()
export class DeliberationController {
  constructor(private readonly deliberationService: DeliberationService) {}

  @Post()
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Planifier une délibération' })
  @ApiResponse({ status: 201, description: 'Délibération créée' })
  create(@Body() dto: any, @Request() req: AuthReq) {
    return this.deliberationService.createDeliberation(dto, this.actor(req));
  }

  @Get()
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Lister les délibérations' })
  @ApiQuery({ name: 'semesterId', required: false })
  @ApiQuery({ name: 'offerId', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'limit', required: false })
  list(
    @Query('semesterId') semesterId?: string,
    @Query('offerId') offerId?: string,
    @Query('skip') skip = '0',
    @Query('limit') limit = '20',
  ) {
    return this.deliberationService.listDeliberations({ semesterId, offerId, skip: Number(skip), limit: Number(limit) });
  }

  @Get(':id')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Détail d\'une délibération' })
  get(@Param('id') id: string) {
    return this.deliberationService.getDeliberation(id);
  }

  @Patch(':id')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Modifier une délibération (date, jury)' })
  update(@Param('id') id: string, @Body() dto: any, @Request() req: AuthReq) {
    return this.deliberationService.updateDeliberation(id, dto, this.actor(req));
  }

  @Post(':id/start')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Démarrer la séance de délibération' })
  start(@Param('id') id: string, @Request() req: AuthReq) {
    return this.deliberationService.startDeliberation(id, this.actor(req));
  }

  @Get(':id/decisions')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Tableau de délibération (tous les étudiants + décisions)' })
  getBoard(@Param('id') id: string) {
    return this.deliberationService.getDeliberationBoard(id);
  }

  @Post(':id/decisions')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Enregistrer/modifier les décisions en masse' })
  bulkUpdateDecisions(@Param('id') id: string, @Body() body: { decisions: any[] }, @Request() req: AuthReq) {
    return this.deliberationService.bulkUpdateDecisions(id, body.decisions, this.actor(req));
  }

  @Patch(':id/decisions/:studentId')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Modifier la décision d\'un étudiant' })
  updateDecision(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() dto: any,
    @Request() req: AuthReq,
  ) {
    return this.deliberationService.updateSingleDecision(id, studentId, dto, this.actor(req));
  }

  @Post(':id/close')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Clore la délibération' })
  close(@Param('id') id: string, @Request() req: AuthReq) {
    return this.deliberationService.closeDeliberation(id, this.actor(req));
  }

  @Post(':id/pv')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Générer le PV officiel PDF' })
  generatePv(@Param('id') id: string, @Request() req: AuthReq) {
    return this.deliberationService.generatePv(id, this.actor(req));
  }

  @Post(':id/sign')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Signer le PV (verrouillage définitif)' })
  sign(@Param('id') id: string, @Request() req: AuthReq) {
    return this.deliberationService.signPv(id, this.actor(req));
  }

  @Post(':id/publish')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Publier les résultats aux étudiants' })
  publish(@Param('id') id: string, @Request() req: AuthReq) {
    return this.deliberationService.publishResults(id, this.actor(req));
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
