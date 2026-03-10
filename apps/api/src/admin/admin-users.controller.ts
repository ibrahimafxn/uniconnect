import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { AdminUsersService, ImportStudentRow } from './admin-users.service';

@ApiTags('admin/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les utilisateurs' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'suspended', required: false, type: Boolean })
  listUsers(
    @Query('skip') skip = '0',
    @Query('limit') limit = '50',
    @Query('role') role?: Role,
    @Query('q') q?: string,
    @Query('suspended') suspended?: string,
  ) {
    return this.service.listUsers({
      skip: parseInt(skip, 10),
      limit: Math.min(parseInt(limit, 10), 200),
      role,
      q,
      suspended: suspended !== undefined ? suspended === 'true' : undefined,
    });
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Journal des activités (tous utilisateurs)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'actorId', required: false, type: String })
  listAuditLogs(
    @Query('skip') skip = '0',
    @Query('limit') limit = '50',
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.service.listAuditLogs({
      skip: parseInt(skip, 10),
      limit: Math.min(parseInt(limit, 10), 200),
      action,
      entity,
      actorId,
    });
  }

  @Get('import-jobs')
  @ApiOperation({ summary: 'Historique des imports en masse' })
  listImportJobs(
    @Query('skip') skip = '0',
    @Query('limit') limit = '20',
  ) {
    return this.service.listImportJobs({
      skip: parseInt(skip, 10),
      limit: Math.min(parseInt(limit, 10), 100),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un utilisateur' })
  getUser(@Param('id') id: string) {
    return this.service.getUser(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspendre un compte utilisateur' })
  @ApiResponse({ status: 200, description: 'Compte suspendu' })
  suspendUser(@Param('id') id: string, @Request() req: any) {
    return this.service.suspendUser(id, this.buildActor(req));
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Réactiver un compte utilisateur suspendu' })
  reactivateUser(@Param('id') id: string, @Request() req: any) {
    return this.service.reactivateUser(id, this.buildActor(req));
  }

  @Patch(':id/reset-password')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe d\'un utilisateur' })
  resetPassword(@Param('id') id: string, @Request() req: any) {
    return this.service.resetPassword(id, this.buildActor(req));
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Modifier le rôle d\'un utilisateur' })
  assignRole(
    @Param('id') id: string,
    @Body() body: { role: Role },
    @Request() req: any,
  ) {
    return this.service.assignRole(id, body.role, this.buildActor(req));
  }

  @Post('create-teacher')
  @ApiOperation({ summary: 'Créer un compte enseignant avec profil' })
  @ApiResponse({ status: 201, description: 'Compte enseignant créé' })
  createTeacher(
    @Body() body: {
      firstName: string;
      lastName: string;
      email: string;
      specialty?: string;
      grade?: string;
      bio?: string;
      phone?: string;
      office?: string;
    },
    @Request() req: any,
  ) {
    return this.service.createTeacher(body, this.buildActor(req));
  }

  @Post('import-students')
  @ApiOperation({
    summary: 'Import en masse d\'étudiants (UC-A02)',
    description:
      'Crée les comptes User + StudentProfile pour chaque ligne. Retourne les identifiants provisoires.',
  })
  @ApiResponse({ status: 201, description: 'Import terminé' })
  importStudents(
    @Body()
    body: {
      offerId: string;
      groupId: string;
      rows: ImportStudentRow[];
    },
    @Request() req: any,
  ) {
    return this.service.importStudents({
      rows: body.rows,
      offerId: body.offerId,
      groupId: body.groupId,
      actor: this.buildActor(req),
    });
  }

  @Post('parse-xlsx')
  @ApiOperation({
    summary: 'Prévisualiser un fichier XLSX avant import (UC-A02)',
    description:
      'Parse un fichier Excel et retourne les lignes validées + les erreurs sans créer de comptes.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'imports');
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `import_${Date.now()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];
        if (!allowed.includes(file.mimetype)) {
          return cb(new Error('Seuls les fichiers .xlsx et .xls sont acceptés'), false);
        }
        return cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  parseXlsx(
    @UploadedFile() file: { path: string },
  ) {
    if (!file) throw new Error('file is required');
    return this.service.parseXlsxImport(file.path);
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
