import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { StreamableFile } from '@nestjs/common';
import { createReadStream, unlink } from 'fs';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { StudentsService } from './students.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { UpdateStudentDocumentDto } from './dto/update-student-document.dto';
import { UpdateStudentSelfDto } from './dto/update-student-self.dto';
import { parsePagination } from '../common/pagination';
import { toObjectId } from '../common/object-id';
import type { CalendarEventType } from '../admin/schemas/academic-calendar-event.schema';

const uploadRoot = join(process.cwd(), 'uploads', 'students');

function ensureUploadDir() {
  mkdirSync(uploadRoot, { recursive: true });
}

function buildFileName(originalName: string) {
  const ext = extname(originalName);
  const base = originalName.replace(ext, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}_${stamp}_${rand}${ext}`.slice(0, 180);
}

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async listStudents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    const result = await this.studentsService.listStudents({
      ...pagination,
      q: q?.trim() || undefined,
    });
    return { ...result, ...pagination };
  }

  @Post()
  createStudent(@Body() dto: CreateStudentProfileDto) {
    return this.studentsService.createStudent(dto);
  }

  @Get('me')
  @Roles(Role.Student)
  async getMe(@Req() req: any) {
    const student = await this.studentsService.findByEmail(req.user.email);
    if (!student) {
      throw new HttpException('Profil étudiant introuvable', HttpStatus.NOT_FOUND);
    }
    return student;
  }

  @Get('me/calendar-events')
  @Roles(Role.Student)
  async listMyCalendarEvents(
    @Req() req: any,
    @Query('type') type?: CalendarEventType,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
  ) {
    const limitValue = limit ? Number(limit) : undefined;
    return this.studentsService.listMyCalendarEvents(req.user.email, {
      type,
      dateFrom,
      dateTo,
      limit: Number.isFinite(limitValue) ? limitValue : undefined,
    });
  }

  @Patch('me')
  @Roles(Role.Student)
  updateMe(@Req() req: any, @Body() dto: UpdateStudentSelfDto) {
    return this.studentsService.updateStudentSelfByEmail(req.user.email, dto as any);
  }

  @Get(':id')
  getStudent(@Param('id') id: string) {
    return this.studentsService.getStudent(id);
  }

  @Patch(':id')
  updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentProfileDto) {
    const payload = {
      ...dto,
      groupId: toObjectId(dto.groupId),
      offerId: toObjectId(dto.offerId),
      programId: toObjectId(dto.programId),
      academicYearId: toObjectId(dto.academicYearId),
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
    };
    return this.studentsService.updateStudent(id, payload);
  }

  @Delete(':id')
  deleteStudent(@Param('id') id: string) {
    return this.studentsService.deleteStudent(id);
  }

  @Get('enrollments')
  async listEnrollments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    const result = await this.studentsService.listEnrollments(pagination);
    return { ...result, ...pagination };
  }

  @Post('enrollments')
  createEnrollment(@Body() dto: CreateEnrollmentDto) {
    return this.studentsService.createEnrollment(dto);
  }

  @Patch('enrollments/:id')
  updateEnrollment(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    const payload = {
      ...dto,
      studentId: toObjectId(dto.studentId),
      academicYearId: toObjectId(dto.academicYearId),
    };
    return this.studentsService.updateEnrollment(id, payload);
  }

  @Delete('enrollments/:id')
  deleteEnrollment(@Param('id') id: string) {
    return this.studentsService.deleteEnrollment(id);
  }

  @Get('me/documents')
  @Roles(Role.Student)
  async listMyDocuments(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    const result = await this.studentsService.listMyDocuments(req.user.email, pagination);
    return { ...result, ...pagination };
  }

  @Get(':id/documents')
  async listDocuments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    const result = await this.studentsService.listDocuments(id, pagination);
    return { ...result, ...pagination };
  }

  @Post(':id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDir();
          cb(null, uploadRoot);
        },
        filename: (_req, file, cb) => {
          cb(null, buildFileName(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new HttpException('Unsupported file type', HttpStatus.BAD_REQUEST),
            false,
          );
        }
        return cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile()
    file: {
      originalname: string;
      filename: string;
      path: string;
      mimetype: string;
      size: number;
    },
    @Body('label') label?: string,
  ) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }
    return this.studentsService.createDocument({
      studentId: id,
      label: label?.trim() || undefined,
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  @Get('documents/:docId/download')
  async downloadDocument(
    @Param('docId') docId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const doc = await this.studentsService.getDocument(docId);
    if (!doc) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.originalName}"`,
    });
    return new StreamableFile(createReadStream(doc.path));
  }

  @Get('me/documents/:docId/download')
  @Roles(Role.Student)
  async downloadMyDocument(
    @Param('docId') docId: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const doc = await this.studentsService.getDocument(docId);
    if (!doc) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }
    const student = await this.studentsService.findByEmail(req.user.email);
    if (!student || String(doc.studentId) !== String((student as any)._id)) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.originalName}"`,
    });
    return new StreamableFile(createReadStream(doc.path));
  }

  @Delete('documents/:docId')
  async deleteDocument(@Param('docId') docId: string) {
    const doc = await this.studentsService.getDocument(docId);
    if (!doc) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }
    await this.studentsService.deleteDocument(docId);
    unlink(doc.path, () => undefined);
    return { success: true };
  }

  @Patch('documents/:docId')
  async updateDocument(
    @Param('docId') docId: string,
    @Body() dto: UpdateStudentDocumentDto,
  ) {
    const doc = await this.studentsService.getDocument(docId);
    if (!doc) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }
    return this.studentsService.updateDocument(docId, dto);
  }
}
