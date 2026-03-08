import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

const uploadRoot = join(process.cwd(), 'uploads', 'assignments');
const ensureUploadDir = () => mkdirSync(uploadRoot, { recursive: true });

function buildFileName(originalName: string) {
  const ext = extname(originalName);
  const base = originalName.replace(ext, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}_${stamp}_${rand}${ext}`.slice(0, 180);
}

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  @Get()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  list(
    @Request() req: { user: { userId: string; email?: string; role: Role } },
    @Query('groupId') groupId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.service.listAssignments({
      groupId,
      subjectId,
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
        const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Unsupported file type'), false);
        }
        return cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateAssignmentDto,
    @UploadedFile() file: { originalname: string; filename: string; path: string; mimetype: string; size: number } | undefined,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.service.createAssignment(
      {
        ...dto,
        createdBy: req.user.userId,
        originalName: file?.originalname,
        fileName: file?.filename,
        path: file?.path,
        mimeType: file?.mimetype,
        size: file?.size,
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
  async downloadAssignment(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
    @Request() req: { user: { role: Role; email?: string } },
  ) {
    const assignment = await this.service.getAssignment(id, req.user);
    if (!assignment?.path) throw new BadRequestException('Fichier introuvable');
    res.set({
      'Content-Type': assignment.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename=\"${assignment.originalName ?? 'travail'}\"`,
    });
    return new StreamableFile(createReadStream(assignment.path));
  }

  @Post(':id/submissions')
  @Roles(Role.Student)
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
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  submit(
    @Param('id') id: string,
    @UploadedFile() file: { originalname: string; filename: string; path: string; mimetype: string; size: number },
    @Body('comment') comment: string | undefined,
    @Request() req: { user: { email?: string } },
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.service.submitAssignment(id, req.user.email ?? '', {
      comment,
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  @Get(':id/submissions')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  listSubmissions(@Param('id') id: string) {
    return this.service.listSubmissions(id);
  }

  @Get(':id/submissions/me')
  @Roles(Role.Student)
  mySubmission(@Param('id') id: string, @Request() req: { user: { email?: string } }) {
    return this.service.getMySubmission(id, req.user.email ?? '');
  }

  @Patch('submissions/:submissionId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  updateSubmission(
    @Param('submissionId') submissionId: string,
    @Body() dto: UpdateSubmissionDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.service.updateSubmission(submissionId, dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Get('submissions/:submissionId/download')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  async downloadSubmission(
    @Param('submissionId') submissionId: string,
    @Res({ passthrough: true }) res: Response,
    @Request() req: { user: { role: Role; email?: string } },
  ) {
    const submission = await this.service.getSubmissionById(submissionId, req.user);
    res.set({
      'Content-Type': submission.mimeType,
      'Content-Disposition': `attachment; filename="${submission.originalName}"`,
    });
    return new StreamableFile(createReadStream(submission.path));
  }
}
