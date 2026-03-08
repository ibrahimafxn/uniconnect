import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';

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
  getStudentSummary(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentAttendanceSummary(studentId);
  }

  /** UC-E04 — Alertes étudiants en difficulté (taux d'absence > seuil) */
  @Get('groups/:groupId/alerts')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Étudiants en difficulté (absences > seuil)' })
  getAbsenceAlerts(
    @Param('groupId') groupId: string,
    @Query('threshold') threshold?: string,
  ) {
    return this.attendanceService.getAbsenceAlerts(groupId, threshold ? Number(threshold) : 30);
  }
}
