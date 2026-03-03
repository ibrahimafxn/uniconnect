import {
  Body,
  Controller,
  Delete,
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
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { UpsertGradesDto } from './dto/upsert-grades.dto';

@Controller('notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Notes')
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('subjects')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Lister les matieres' })
  @ApiQuery({ name: 'levelId', required: false })
  listSubjects(@Query('levelId') levelId?: string) {
    return this.notesService.listSubjects(levelId);
  }

  @Post('subjects')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Creer une matiere' })
  createSubject(
    @Body() dto: CreateSubjectDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.notesService.createSubject(dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Patch('subjects/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Mettre a jour une matiere' })
  updateSubject(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.notesService.updateSubject(id, dto as any, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Delete('subjects/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Supprimer une matiere' })
  deleteSubject(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.notesService.deleteSubject(id, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Get('evaluations')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Lister les evaluations' })
  @ApiQuery({ name: 'groupId', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  listEvaluations(
    @Query('groupId') groupId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.notesService.listEvaluations({ groupId, subjectId });
  }

  @Post('evaluations')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Creer une evaluation' })
  createEvaluation(
    @Body() dto: CreateEvaluationDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.notesService.createEvaluation(dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Patch('evaluations/:id')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Mettre a jour une evaluation' })
  updateEvaluation(
    @Param('id') id: string,
    @Body() dto: UpdateEvaluationDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.notesService.updateEvaluation(id, dto as any, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Get('groups/:id/students')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Lister les etudiants d\'un groupe' })
  listGroupStudents(@Param('id') id: string) {
    return this.notesService.listGroupStudents(id);
  }

  @Get('evaluations/:id/grades')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Lister les notes d\'une evaluation' })
  listGrades(@Param('id') id: string) {
    return this.notesService.listGrades(id);
  }

  @Post('grades/bulk')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Saisir ou mettre a jour des notes' })
  upsertGrades(
    @Body() dto: UpsertGradesDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.notesService.upsertGrades(dto.evaluationId, dto.grades, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Get('students/:id/summary')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Resume des notes d\'un etudiant' })
  @ApiResponse({ status: 200, description: 'Resume notes + moyennes' })
  studentSummary(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; email?: string; role: Role } },
  ) {
    return this.notesService.getStudentSummary(id, req.user);
  }

  @Get('students/me/summary')
  @Roles(Role.Student)
  @ApiOperation({ summary: 'Resume des notes (etudiant connecte)' })
  meSummary(@Request() req: { user: { userId: string; email?: string; role: Role } }) {
    return this.notesService.getStudentSummaryForEmail(req.user.email, req.user);
  }
}
