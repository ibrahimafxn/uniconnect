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
import { PlanningService } from './planning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('planning')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Planning')
@ApiBearerAuth()
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get('rooms')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Lister les salles' })
  @ApiResponse({ status: 200, description: 'Liste des salles' })
  listRooms() {
    return this.planningService.listRooms();
  }

  @Post('rooms')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Créer une salle' })
  @ApiResponse({ status: 201, description: 'Salle créée' })
  createRoom(
    @Body() dto: CreateRoomDto,
    @Request()
    req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.planningService.createRoom(dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Patch('rooms/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Mettre à jour une salle' })
  @ApiResponse({ status: 200, description: 'Salle mise à jour' })
  updateRoom(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @Request()
    req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.planningService.updateRoom(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Delete('rooms/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Supprimer une salle' })
  @ApiResponse({ status: 200, description: 'Salle supprimée' })
  deleteRoom(
    @Param('id') id: string,
    @Request()
    req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.planningService.deleteRoom(id, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Get('sessions')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Lister les séances' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'groupId', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  @ApiResponse({ status: 200, description: 'Liste des séances' })
  listSessions(
    @Request() req: { user: { userId: string; email: string; role: Role } },
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('groupId') groupId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('roomId') roomId?: string,
  ) {
    return this.planningService.listSessions({
      dateFrom,
      dateTo,
      groupId,
      teacherId,
      roomId,
      user: req.user,
    });
  }

  @Post('sessions')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Créer une séance' })
  @ApiResponse({ status: 201, description: 'Séance créée' })
  createSession(
    @Body() dto: CreateSessionDto,
    @Request()
    req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.planningService.createSession(dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Patch('sessions/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Mettre à jour une séance' })
  @ApiResponse({ status: 200, description: 'Séance mise à jour' })
  updateSession(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @Request()
    req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.planningService.updateSession(id, dto as any, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Delete('sessions/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Supprimer une séance' })
  @ApiResponse({ status: 200, description: 'Séance supprimée' })
  deleteSession(
    @Param('id') id: string,
    @Request()
    req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.planningService.deleteSession(id, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Patch('sessions/:id/content')
  @Roles(Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Mettre à jour le cahier de texte d\'une séance' })
  @ApiResponse({ status: 200, description: 'Contenu mis à jour' })
  updateSessionContent(
    @Param('id') id: string,
    @Body() body: { content?: string; homework?: string },
    @Request()
    req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.planningService.updateSessionContent(id, body, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  /** UC-E08 — Export planning en PDF */
  @Get('sessions/export/pdf')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Exporter le planning en PDF' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'groupId', required: false })
  async exportPdf(
    @Query('dateFrom') dateFrom: string | undefined,
    @Query('dateTo') dateTo: string | undefined,
    @Query('groupId') groupId: string | undefined,
    @Request() req: { user: { userId: string; email?: string; role: Role } },
    @Res() res: Response,
  ) {
    const sessions = await this.planningService.listSessions({
      dateFrom,
      dateTo,
      groupId,
      teacherId: undefined,
      roomId: undefined,
      user: { userId: req.user.userId, email: req.user.email ?? '', role: req.user.role },
    });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="planning.pdf"');
      res.send(buf);
    });

    doc.fontSize(18).font('Helvetica-Bold').text('Planning — UniConnect', { align: 'center' });
    if (dateFrom || dateTo) {
      doc.moveDown(0.3).fontSize(11).font('Helvetica').text(
        `Période : ${dateFrom ?? '—'} → ${dateTo ?? '—'}`, { align: 'center' },
      );
    }
    doc.moveDown().moveTo(40, doc.y).lineTo(555, doc.y).stroke().moveDown(0.5);

    const colX = { date: 40, time: 120, label: 205, group: 355, room: 460 };
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Date', colX.date, doc.y, { width: 75 });
    const hY = doc.y - doc.currentLineHeight();
    doc.text('Horaire', colX.time, hY, { width: 80 });
    doc.text('Intitulé', colX.label, hY, { width: 145 });
    doc.text('Groupe', colX.group, hY, { width: 100 });
    doc.text('Salle', colX.room, hY, { width: 95 });
    doc.moveDown(0.3).moveTo(40, doc.y).lineTo(555, doc.y).stroke().moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    for (const s of sessions as any[]) {
      if (doc.y > 750) doc.addPage();
      const rowY = doc.y;
      const dateStr = new Date(s.date).toLocaleDateString('fr-FR');
      doc.text(dateStr, colX.date, rowY, { width: 75 });
      doc.text(`${s.startTime}–${s.endTime}`, colX.time, rowY, { width: 80 });
      doc.text(s.label ?? '—', colX.label, rowY, { width: 145 });
      doc.text(String((s.groupId as any)?._id ?? s.groupId ?? ''), colX.group, rowY, { width: 100 });
      doc.text(String((s.roomId as any)?._id ?? s.roomId ?? ''), colX.room, rowY, { width: 95 });
      doc.moveDown(0.4);
    }

    if ((sessions as any[]).length === 0) {
      doc.text('Aucune séance pour cette période.', { align: 'center' });
    }

    doc.end();
  }

  /** UC-E08 — Export planning au format iCalendar (.ics) */
  @Get('sessions/export/ical')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Exporter le planning au format iCal (.ics)' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'groupId', required: false })
  async exportIcal(
    @Query('dateFrom') dateFrom: string | undefined,
    @Query('dateTo') dateTo: string | undefined,
    @Query('groupId') groupId: string | undefined,
    @Request() req: { user: { userId: string; email?: string; role: Role } },
    @Res() res: Response,
  ) {
    const sessions = await this.planningService.listSessions({
      dateFrom,
      dateTo,
      groupId,
      teacherId: undefined,
      roomId: undefined,
      user: { userId: req.user.userId, email: req.user.email ?? '', role: req.user.role },
    });

    const fmt = (d: Date, time: string) => {
      const [h, m] = time.split(':');
      const dt = new Date(d);
      dt.setHours(Number(h), Number(m), 0, 0);
      return dt.toISOString().replace(/[-:]/g, '').replace('.000', '');
    };

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UniConnect//Planning//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const s of sessions as any[]) {
      const date = new Date(s.date);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${s._id}@uniconnect`,
        `DTSTART:${fmt(date, s.startTime)}`,
        `DTEND:${fmt(date, s.endTime)}`,
        `SUMMARY:${s.label ?? 'Séance'}`,
        `DESCRIPTION:Groupe ${s.groupId} — Salle ${s.roomId}`,
        'END:VEVENT',
      );
    }

    lines.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="planning.ics"');
    res.send(lines.join('\r\n'));
  }
}
