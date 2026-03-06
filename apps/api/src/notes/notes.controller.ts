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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
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

  @Get('evaluations/:id/export')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Exporter les notes d\'une evaluation en PDF' })
  async exportEvaluation(@Param('id') id: string, @Res() res: Response) {
    const { evaluation, subject, group, rows } = await this.notesService.buildEvaluationExport(id);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="notes-${id}.pdf"`);
      res.send(buffer);
    });

    // En-tête
    doc.fontSize(20).font('Helvetica-Bold').text('UniConnect ENT', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica').text('Relevé de notes', { align: 'center' });
    doc.moveDown(0.5);

    // Informations évaluation
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text('Évaluation : ', { continued: true });
    doc.font('Helvetica').text(String(evaluation.title ?? ''));
    doc.font('Helvetica-Bold').text('Matière : ', { continued: true });
    doc.font('Helvetica').text(String((subject as any)?.name ?? evaluation.subjectId));
    doc.font('Helvetica-Bold').text('Groupe : ', { continued: true });
    doc.font('Helvetica').text(String((group as any)?.name ?? evaluation.groupId));
    doc.font('Helvetica-Bold').text('Date : ', { continued: true });
    doc.font('Helvetica').text(new Date(evaluation.date).toLocaleDateString('fr-FR'));
    doc.font('Helvetica-Bold').text('Note maximale : ', { continued: true });
    doc.font('Helvetica').text(String(evaluation.maxScore ?? 20));
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // En-têtes du tableau
    const colX = { num: 50, nom: 110, prenom: 250, note: 390, commentaire: 430 };
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('N° Mat.', colX.num, doc.y, { width: 55 });
    const headerY = doc.y - doc.currentLineHeight();
    doc.text('Nom', colX.nom, headerY, { width: 135 });
    doc.text('Prénom', colX.prenom, headerY, { width: 135 });
    doc.text('Note', colX.note, headerY, { width: 35 });
    doc.text('Commentaire', colX.commentaire, headerY, { width: 115 });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    // Lignes
    doc.font('Helvetica').fontSize(10);
    for (const row of rows) {
      if (doc.y > 720) { doc.addPage(); }
      const rowY = doc.y;
      doc.text(row.studentNumber ?? '—', colX.num, rowY, { width: 55 });
      doc.text(row.lastName, colX.nom, rowY, { width: 135 });
      doc.text(row.firstName, colX.prenom, rowY, { width: 135 });
      doc.text(row.score !== null ? String(row.score) : '—', colX.note, rowY, { width: 35 });
      doc.text(row.comment || '', colX.commentaire, rowY, { width: 115 });
      doc.moveDown(0.4);
    }

    // Pied de page
    doc.moveDown();
    const scored = rows.filter((r) => r.score !== null);
    if (scored.length > 0) {
      const avg = scored.reduce((s, r) => s + (r.score as number), 0) / scored.length;
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text(`Moyenne de la promotion : ${avg.toFixed(2)} / ${evaluation.maxScore ?? 20}`);
      doc.text(`Étudiants notés : ${scored.length} / ${rows.length}`);
    }
    doc.end();
  }
}
