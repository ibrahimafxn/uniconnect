import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { ApplicationStatus } from './application.schema';

const uploadRoot = join(process.cwd(), 'uploads', 'applications');
const ensureUploadDir = () => mkdirSync(uploadRoot, { recursive: true });

function buildFileName(originalName: string) {
  const ext = extname(originalName);
  const base = originalName.replace(ext, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}_${stamp}_${rand}${ext}`.slice(0, 180);
}

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  // === Public dossier ===
  @Post('public')
  createPublic(@Body() dto: CreateApplicationDto) {
    return this.service.createPublic(dto as any);
  }

  @Get('public/:code')
  getPublic(
    @Param('code') code: string,
    @Query('email') email?: string,
  ) {
    if (!email) throw new BadRequestException('email is required');
    return this.service.getPublic(code, email);
  }

  @Patch('public/:code')
  updatePublic(
    @Param('code') code: string,
    @Body() dto: UpdateApplicationDto & { email?: string },
  ) {
    if (!dto.email) throw new BadRequestException('email is required');
    return this.service.updatePublic(code, dto.email, dto);
  }

  @Post('public/:code/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDir();
          cb(null, uploadRoot);
        },
        filename: (_req, file, cb) => cb(null, buildFileName(file.originalname)),
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Unsupported file type'), false);
        }
        return cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadPublicDocument(
    @Param('code') code: string,
    @UploadedFile()
    file: { originalname: string; filename: string; path: string; mimetype: string; size: number },
    @Body('email') email?: string,
    @Body('label') label?: string,
  ) {
    if (!email) throw new BadRequestException('email is required');
    const app = await this.service.getPublic(code, email);
    if (!app) throw new NotFoundException('Dossier introuvable');
    if (!file) throw new BadRequestException('file is required');
    return this.service.createDocument({
      applicationId: String(app._id),
      label: label?.trim() || undefined,
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  // === Authenticated ===
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  @Roles(Role.Student)
  listMy(@Request() req: { user: { email?: string } }) {
    return this.service.listByStudentEmail(req.user.email ?? '');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles(Role.Admin, Role.SuperAdmin)
  listAll(@Query('status') status?: ApplicationStatus) {
    return this.service.listAll(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  @Roles(Role.Admin, Role.SuperAdmin)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.service.updateStatus(
      id,
      { status: dto.status, decisionNote: dto.decisionNote },
      {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
      },
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/documents')
  @Roles(Role.Admin, Role.SuperAdmin)
  listDocuments(@Param('id') id: string) {
    return this.service.listDocuments(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('documents/:docId/download')
  @Roles(Role.Admin, Role.SuperAdmin)
  async downloadDocument(
    @Param('docId') docId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const doc = await this.service.getDocument(docId);
    if (!doc) throw new NotFoundException('Document introuvable');
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.originalName}"`,
    });
    return new StreamableFile(createReadStream(doc.path));
  }
}
