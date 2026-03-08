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
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InscriptionService } from './inscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ReviewDossierDto } from './dto/review-dossier.dto';
import { AnnotateDossierDto } from './dto/annotate-dossier.dto';
import { SubmitDossierDto } from './dto/submit-dossier.dto';

type AuthReq = {
  user: { userId: string; email?: string; role: Role };
  ip?: string;
  headers?: Record<string, string>;
};

const SCOLARITE_ROLES = [Role.SuperAdmin, Role.Admin, Role.Scolarite];

@Controller('scolarite/inscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Scolarité — Inscriptions')
@ApiBearerAuth()
export class InscriptionController {
  constructor(private readonly inscriptionService: InscriptionService) {}

  // ─── Campagnes ────────────────────────────────────────────────────────────

  @Post('campaigns')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Créer une campagne d\'inscription' })
  @ApiResponse({ status: 201, description: 'Campagne créée' })
  createCampaign(@Body() dto: CreateCampaignDto, @Request() req: AuthReq) {
    return this.inscriptionService.createCampaign(dto, this.actor(req));
  }

  @Get('campaigns')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Lister les campagnes d\'inscription' })
  @ApiQuery({ name: 'offerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'open', 'closed'] })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listCampaigns(
    @Query('offerId') offerId?: string,
    @Query('status') status?: string,
    @Query('skip') skip = '0',
    @Query('limit') limit = '20',
  ) {
    return this.inscriptionService.listCampaigns({
      offerId,
      status,
      skip: Number(skip),
      limit: Number(limit),
    });
  }

  @Get('campaigns/:id')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Détail d\'une campagne' })
  getCampaign(@Param('id') id: string) {
    return this.inscriptionService.getCampaign(id);
  }

  @Patch('campaigns/:id')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Modifier une campagne' })
  updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @Request() req: AuthReq,
  ) {
    return this.inscriptionService.updateCampaign(id, dto, this.actor(req));
  }

  @Delete('campaigns/:id')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Supprimer une campagne (brouillon uniquement)' })
  deleteCampaign(@Param('id') id: string, @Request() req: AuthReq) {
    return this.inscriptionService.deleteCampaign(id, this.actor(req));
  }

  @Get('campaigns/:id/stats')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Statistiques d\'une campagne (taux de remplissage, etc.)' })
  getCampaignStats(@Param('id') id: string) {
    return this.inscriptionService.getCampaignStats(id);
  }

  // ─── Dossiers ─────────────────────────────────────────────────────────────

  @Post('dossiers')
  @Roles(...SCOLARITE_ROLES, Role.Student)
  @ApiOperation({ summary: 'Soumettre un dossier de candidature' })
  @ApiResponse({ status: 201, description: 'Dossier soumis' })
  submitDossier(@Body() dto: SubmitDossierDto, @Request() req: AuthReq) {
    return this.inscriptionService.submitDossier(dto, this.actor(req));
  }

  @Get('dossiers')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Lister les dossiers' })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listDossiers(
    @Query('campaignId') campaignId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
    @Query('skip') skip = '0',
    @Query('limit') limit = '20',
  ) {
    return this.inscriptionService.listDossiers({
      campaignId,
      studentId,
      status,
      skip: Number(skip),
      limit: Number(limit),
    });
  }

  @Get('dossiers/:id')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Détail d\'un dossier' })
  getDossier(@Param('id') id: string) {
    return this.inscriptionService.getDossier(id);
  }

  @Patch('dossiers/:id/review')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Statuer sur un dossier (approve/reject/waitlist/incomplete)' })
  reviewDossier(
    @Param('id') id: string,
    @Body() dto: ReviewDossierDto,
    @Request() req: AuthReq,
  ) {
    return this.inscriptionService.reviewDossier(id, dto, this.actor(req));
  }

  @Patch('dossiers/:id/annotate')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Ajouter une annotation interne au dossier' })
  annotateDossier(
    @Param('id') id: string,
    @Body() dto: AnnotateDossierDto,
    @Request() req: AuthReq,
  ) {
    return this.inscriptionService.annotateDossier(id, dto.internalNote, this.actor(req));
  }

  @Post('dossiers/:id/notify')
  @Roles(...SCOLARITE_ROLES)
  @ApiOperation({ summary: 'Envoyer une notification manuelle à l\'étudiant' })
  notifyDossier(@Param('id') id: string, @Request() req: AuthReq) {
    return this.inscriptionService.notifyDossier(id, this.actor(req));
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
