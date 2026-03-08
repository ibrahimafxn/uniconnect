import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';

const UPLOAD_DIR = './uploads/resources';

@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Ressources')
@ApiBearerAuth()
export class ResourcesController {
  constructor(private readonly svc: ResourcesService) {}

  @Post('upload')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Déposer une ressource pédagogique (PDF, image…)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${base}${ext}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
      fileFilter: (req, file, cb) => {
        const allowed = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  async uploadResource(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; description?: string; sessionId?: string; groupId?: string },
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    if (!file) throw new NotFoundException('Fichier manquant ou format non supporté.');

    return this.svc.createResource(
      {
        title: body.title ?? file.originalname,
        description: body.description,
        originalName: file.originalname,
        fileName: file.filename,
        path: file.path,
        mimeType: file.mimetype,
        size: file.size,
        sessionId: body.sessionId,
        groupId: body.groupId,
      },
      {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
      },
    );
  }

  @Get()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Lister les ressources' })
  @ApiQuery({ name: 'sessionId', required: false })
  @ApiQuery({ name: 'groupId', required: false })
  listResources(
    @Query('sessionId') sessionId?: string,
    @Query('groupId') groupId?: string,
    @Request() req?: { user: { userId: string; role: Role } },
  ) {
    return this.svc.listResources({
      sessionId,
      groupId,
      role: req!.user.role,
      userId: req!.user.userId,
    });
  }

  @Get(':id/download')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Télécharger une ressource' })
  async downloadResource(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; role: Role } },
    @Res() res: Response,
  ) {
    const resource = await this.svc.getResource(id, req.user);
    res.setHeader('Content-Type', resource.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${resource.originalName}"`);
    res.sendFile(path.resolve(resource.path));
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Supprimer une ressource' })
  deleteResource(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.svc.deleteResource(id, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }
}
