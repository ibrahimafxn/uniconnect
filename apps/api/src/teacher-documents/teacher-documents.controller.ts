import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { TeacherDocumentsService } from './teacher-documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { CreateExamSubjectDto } from './dto/create-exam-subject.dto';
import { CreateAttestationDto } from './dto/create-attestation.dto';
import { CreateTeacherDocumentDto } from './dto/create-teacher-document.dto';
import { TeacherDocumentCategory, TeacherDocumentType } from './teacher-document.schema';

const uploadRoot = join(process.cwd(), 'uploads', 'teacher-documents');
const ensureUploadDir = () => mkdirSync(uploadRoot, { recursive: true });

function buildFileName(originalName: string) {
  const ext = extname(originalName);
  const base = originalName.replace(ext, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}_${stamp}_${rand}${ext}`.slice(0, 180);
}

const uploadConfig = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadDir();
      cb(null, uploadRoot);
    },
    filename: (_req, file, cb) => cb(null, buildFileName(file.originalname)),
  }),
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestException('Unsupported file type'), false);
    }
    return cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
};

@Controller('teacher/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherDocumentsController {
  constructor(private readonly service: TeacherDocumentsService) {}

  @Get()
  @Roles(Role.Teacher, Role.External)
  listMine(@Request() req: { user: { userId: string } }) {
    return this.service.listForTeacher(req.user.userId);
  }

  @Get('templates')
  @Roles(Role.Teacher, Role.External)
  listTemplates() {
    return this.service.listTemplates();
  }

  @Get('pv')
  @Roles(Role.Teacher, Role.External)
  listPv(@Request() req: { user: { userId: string } }) {
    return this.service.listPvForTeacher(req.user.userId);
  }

  @Post('exam-subjects')
  @Roles(Role.Teacher, Role.External)
  @UseInterceptors(FileInterceptor('file', uploadConfig))
  createExamSubject(
    @Body() dto: CreateExamSubjectDto,
    @UploadedFile() file: { originalname: string; filename: string; path: string; mimetype: string; size: number },
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.service.createExamSubject(
      req.user.userId,
      dto,
      file,
      {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
      },
    );
  }

  @Post('attestations')
  @Roles(Role.Teacher, Role.External)
  createAttestation(
    @Body() dto: CreateAttestationDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.service.createAttestation(
      req.user.userId,
      dto.purpose,
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
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
    @Request() req: { user: { userId: string; role: Role } },
  ) {
    const doc = await this.service.getDocumentForDownload(id, { userId: req.user.userId, role: req.user.role });
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.originalName}"`,
    });
    return new StreamableFile(createReadStream(doc.path));
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; role: Role } },
  ) {
    return this.service.deleteDocument(id, { userId: req.user.userId, role: req.user.role });
  }
}

@Controller('admin/teacher-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
export class AdminTeacherDocumentsController {
  constructor(private readonly service: TeacherDocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', uploadConfig))
  upload(
    @Body() dto: CreateTeacherDocumentDto,
    @UploadedFile() file: { originalname: string; filename: string; path: string; mimetype: string; size: number },
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    if (!file) throw new BadRequestException('file is required');
    if (!dto.category || !dto.type) throw new BadRequestException('category and type are required');
    if (dto.category === TeacherDocumentCategory.Official && !dto.ownerId) {
      throw new BadRequestException('ownerId is required for official documents');
    }
    if (dto.category === TeacherDocumentCategory.PvDeliberation) {
      dto.type = TeacherDocumentType.PvDeliberation;
    }
    if (dto.category === TeacherDocumentCategory.Template) {
      dto.type = TeacherDocumentType.ExamTemplate;
    }
    return this.service.createAdminDocument(dto, file, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }
}
