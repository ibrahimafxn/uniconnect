import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { CreateResourceDto } from './dto/create-resource.dto';

const uploadRoot = join(process.cwd(), 'uploads', 'resources');
const ensureUploadDir = () => mkdirSync(uploadRoot, { recursive: true });

function buildFileName(originalName: string) {
  const ext = extname(originalName);
  const base = originalName.replace(ext, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}_${stamp}_${rand}${ext}`.slice(0, 180);
}

@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}

  @Get()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  list(
    @Request() req: { user: { userId: string; email?: string; role: Role } },
    @Query('groupId') groupId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.service.listResources({
      groupId,
      subjectId,
      sessionId,
      user: { userId: req.user.userId, email: req.user.email, role: req.user.role },
    });
  }

  @Post()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
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
        const allowed = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-powerpoint',
        ];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Unsupported file type'), false);
        }
        return cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateResourceDto,
    @UploadedFile() file: { originalname: string; filename: string; path: string; mimetype: string; size: number },
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.service.createResource(
      {
        ...dto,
        uploadedBy: req.user.userId,
        originalName: file.originalname,
        fileName: file.filename,
        path: file.path,
        mimeType: file.mimetype,
        size: file.size,
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

  @Get(':id/download')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
    @Request() req: { user: { role: Role; email?: string } },
  ) {
    const resource = await this.service.getResource(id, req.user);
    res.set({
      'Content-Type': resource.mimeType,
      'Content-Disposition': `attachment; filename="${resource.originalName}"`,
    });
    return new StreamableFile(createReadStream(resource.path));
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  delete(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.service.deleteResource(id, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }
}
