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
  Res,
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

  @Get('sessions/export')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Exporter le planning (PDF ou iCalendar)' })
  @ApiQuery({ name: 'format', required: true, enum: ['pdf', 'ics'] })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async exportSessions(
    @Request() req: { user: { userId: string; email: string; role: Role } },
    @Query('format') format: 'pdf' | 'ics',
    @Res() res: Response,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const sessions = await this.planningService.listSessions({
      dateFrom,
      dateTo,
      user: req.user,
    });

    if (format === 'ics') {
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Uniconnect//ENT//FR',
      ];
      sessions.forEach((s: any) => {
        const date = new Date(s.date);
        const [sh, sm] = (s.startTime || '00:00').split(':').map(Number);
        const [eh, em] = (s.endTime || '00:00').split(':').map(Number);
        const start = new Date(date); start.setHours(sh, sm, 0, 0);
        const end = new Date(date); end.setHours(eh, em, 0, 0);
        const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${s._id}@uniconnect`);
        lines.push(`DTSTAMP:${fmt(new Date())}`);
        lines.push(`DTSTART:${fmt(start)}`);
        lines.push(`DTEND:${fmt(end)}`);
        lines.push(`SUMMARY:${(s.label || 'Séance').replace(/\\n/g, ' ')}`);
        lines.push('END:VEVENT');
      });
      lines.push('END:VCALENDAR');
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename=\"planning.ics\"');
      res.send(lines.join('\\r\\n'));
      return;
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=\"planning.pdf\"');
      res.send(buffer);
    });
    doc.fontSize(18).text('Planning', { align: 'center' });
    doc.moveDown();
    sessions.forEach((s: any) => {
      doc.fontSize(12).text(`${new Date(s.date).toLocaleDateString('fr-FR')} — ${s.startTime}–${s.endTime}`);
      doc.fontSize(10).text(`Séance: ${s.label || '—'}`);
      doc.moveDown(0.5);
    });
    doc.end();
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
}
