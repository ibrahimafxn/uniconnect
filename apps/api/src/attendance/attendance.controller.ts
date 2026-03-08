import { Body, Controller, Get, Param, Post, Request, UseGuards, Patch, Query, Res, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { CreateJustificationDto } from './dto/create-justification.dto';
import { UpdateJustificationDto } from './dto/update-justification.dto';
import { AbsenceJustificationStatus } from './absence-justification.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';

const uploadRoot = join(process.cwd(), 'uploads', 'absences');
const ensureUploadDir = () => mkdirSync(uploadRoot, { recursive: true });

function buildFileName(originalName: string) {
  const ext = extname(originalName);
  const base = originalName.replace(ext, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}_${stamp}_${rand}${ext}`.slice(0, 180);
}

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Attendance')
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('sessions/:sessionId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Feuille de présence d\'une séance' })
  getSessionAttendance(@Param('sessionId') sessionId: string) {
    return this.attendanceService.getSessionAttendance(sessionId);
  }

  @Post('sessions/:sessionId')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Enregistrer les présences d\'une séance' })
  upsertAttendance(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpsertAttendanceDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.attendanceService.upsertAttendance(sessionId, dto.entries, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Get('groups/:groupId/summary')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Résumé des présences par groupe' })
  getGroupSummary(@Param('groupId') groupId: string) {
    return this.attendanceService.getGroupAttendanceSummary(groupId);
  }

  @Get('students/:studentId/summary')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Résumé des présences d\'un étudiant' })
  getStudentSummary(
    @Param('studentId') studentId: string,
    @Request() req: { user: { role: Role; email?: string } },
  ) {
    if (req.user.role === Role.Student) {
      return this.attendanceService.getMyAttendanceSummary(req.user.email ?? '');
    }
    return this.attendanceService.getStudentAttendanceSummary(studentId);
  }

  @Get('justifications/me')
  @Roles(Role.Student)
  @ApiOperation({ summary: 'Lister mes justificatifs d\'absence' })
  listMyJustifications(@Request() req: { user: { email?: string } }) {
    return this.attendanceService.listMyJustifications(req.user.email ?? '');
  }

  @Get('justifications')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Lister les justificatifs d\'absence' })
  listJustifications(
    @Query('status') status?: AbsenceJustificationStatus,
    @Query('groupId') groupId?: string,
  ) {
    return this.attendanceService.listJustifications({ status, groupId });
  }

  @Post('justifications')
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
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Soumettre un justificatif d\'absence' })
  createJustification(
    @Body() dto: CreateJustificationDto,
    @UploadedFile() file: { originalname: string; filename: string; path: string; mimetype: string; size: number } | undefined,
    @Request() req: { user: { email?: string } },
  ) {
    return this.attendanceService.createJustification({
      email: req.user.email ?? '',
      sessionId: dto.sessionId,
      absenceDate: dto.absenceDate,
      reason: dto.reason,
      originalName: file?.originalname,
      fileName: file?.filename,
      path: file?.path,
      mimeType: file?.mimetype,
      size: file?.size,
    });
  }

  @Patch('justifications/:id')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Mettre à jour un justificatif d\'absence' })
  updateJustification(
    @Param('id') id: string,
    @Body() dto: UpdateJustificationDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.attendanceService.updateJustification(
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

  @Get('justifications/:id/download')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Télécharger un justificatif' })
  async downloadJustification(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
    @Request() req: { user: { role: Role; email?: string } },
  ) {
    const justification = await this.attendanceService.getJustification(id);
    if (!justification?.path) throw new BadRequestException('Justificatif introuvable');
    if (req.user.role === Role.Student) {
      const list = await this.attendanceService.listMyJustifications(req.user.email ?? '');
      if (!list.find((j) => String(j._id) === String(justification._id))) {
        throw new BadRequestException('Accès refusé');
      }
    }
    res.set({
      'Content-Type': justification.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename=\"${justification.originalName ?? 'justificatif'}\"`,
    });
    return new StreamableFile(createReadStream(justification.path));
  }
}
