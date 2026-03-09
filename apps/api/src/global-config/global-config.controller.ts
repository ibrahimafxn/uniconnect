import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { GlobalConfigService } from './global-config.service';
import { SmtpConfig, SystemParams } from './system-config.schema';

@ApiTags('admin/config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SuperAdmin)
@Controller('admin/config')
export class GlobalConfigController {
  constructor(private readonly service: GlobalConfigService) {}

  // ── SMTP ──────────────────────────────────────────────────────────────────

  @Get('smtp')
  @ApiOperation({ summary: 'Lire la configuration SMTP active (UC-A06)' })
  getSmtp() {
    return this.service.getSmtpConfig();
  }

  @Patch('smtp')
  @ApiOperation({ summary: 'Mettre à jour la configuration SMTP (UC-A06)' })
  updateSmtp(@Body() body: SmtpConfig, @Request() req: any) {
    return this.service.updateSmtpConfig(body, this.buildActor(req));
  }

  // ── Email templates ───────────────────────────────────────────────────────

  @Get('email-templates')
  @ApiOperation({ summary: 'Lister les templates d\'emails configurés (UC-A06)' })
  listTemplates() {
    return this.service.listEmailTemplates();
  }

  @Post('email-templates/:key')
  @ApiOperation({ summary: 'Créer ou mettre à jour un template d\'email (UC-A06)' })
  upsertTemplate(
    @Param('key') key: string,
    @Body() body: { subject: string; body: string },
    @Request() req: any,
  ) {
    return this.service.upsertEmailTemplate(key, body, this.buildActor(req));
  }

  @Delete('email-templates/:key')
  @ApiOperation({ summary: 'Supprimer un template d\'email (UC-A06)' })
  deleteTemplate(@Param('key') key: string, @Request() req: any) {
    return this.service.deleteEmailTemplate(key, this.buildActor(req));
  }

  // ── System parameters ─────────────────────────────────────────────────────

  @Get('system-params')
  @ApiOperation({ summary: 'Lire les paramètres système (UC-A06)' })
  getSystemParams() {
    return this.service.getSystemParams();
  }

  @Patch('system-params')
  @ApiOperation({ summary: 'Mettre à jour les paramètres système (UC-A06)' })
  updateSystemParams(
    @Body() body: Partial<SystemParams>,
    @Request() req: any,
  ) {
    return this.service.updateSystemParams(body, this.buildActor(req));
  }

  private buildActor(req: any) {
    return {
      userId: req.user?.userId ?? req.user?._id ?? 'unknown',
      role: req.user?.role ?? 'superadmin',
      email: req.user?.email,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
  }
}
