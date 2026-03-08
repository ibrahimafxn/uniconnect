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
import { OfficialDocumentService } from './official-document.service';
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

@Controller('scolarite/documents')
@ApiTags('Scolarité — Documents Officiels')
export class OfficialDocumentController {
  constructor(private readonly docService: OfficialDocumentService) {}

  // ─── Demandes ─────────────────────────────────────────────────────────────

  @Post('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SCOLARITE_ROLES, Role.Student)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soumettre une demande de document' })
  @ApiResponse({ status: 201 })
  submitRequest(@Body() dto: any, @Request() req: AuthReq) {
    return this.docService.submitRequest(dto, this.actor(req));
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SCOLARITE_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les demandes de documents' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'documentType', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listRequests(
    @Query('status') status?: any,
    @Query('documentType') documentType?: any,
    @Query('skip') skip = '0',
    @Query('limit') limit = '20',
  ) {
    return this.docService.listRequests({ status, documentType, skip: Number(skip), limit: Number(limit) });
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SCOLARITE_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Détail d\'une demande' })
  getRequest(@Param('id') id: string) {
    return this.docService.getRequest(id);
  }

  @Patch('requests/:id/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SCOLARITE_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Traiter une demande (génération du document)' })
  processRequest(@Param('id') id: string, @Request() req: AuthReq) {
    return this.docService.processRequest(id, this.actor(req));
  }

  @Post('requests/:id/deliver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SCOLARITE_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marquer un document comme délivré' })
  deliverRequest(@Param('id') id: string, @Request() req: AuthReq) {
    return this.docService.deliverRequest(id, this.actor(req));
  }

  // ─── Génération directe ───────────────────────────────────────────────────

  @Post('transcripts/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SCOLARITE_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Générer un relevé de notes (semesterId requis dans le body)' })
  generateTranscript(
    @Param('studentId') studentId: string,
    @Body('semesterId') semesterId: string,
    @Request() req: AuthReq,
  ) {
    return this.docService.generateTranscript(studentId, semesterId, this.actor(req));
  }

  @Post('certificates/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SCOLARITE_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Générer une attestation (type requis dans le body)' })
  generateCertificate(
    @Param('studentId') studentId: string,
    @Body('type') type: any,
    @Request() req: AuthReq,
  ) {
    return this.docService.generateCertificate(studentId, type, this.actor(req));
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SCOLARITE_ROLES, Role.Student)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Télécharger un document officiel' })
  downloadDocument(@Param('id') id: string) {
    return this.docService.downloadDocument(id);
  }

  // ─── Vérification publique ────────────────────────────────────────────────

  @Get('verify/:qrCode')
  @ApiOperation({ summary: 'Vérifier l\'authenticité d\'un document via QR code (public)' })
  @ApiResponse({ status: 200, description: 'Résultat de la vérification' })
  verifyDocument(@Param('qrCode') qrCode: string) {
    return this.docService.verifyDocument(qrCode);
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
