import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeacherProfileService } from './teacher-profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { UpsertTeacherProfileDto } from './dto/upsert-teacher-profile.dto';

@Controller('teacher-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Teacher Profile')
@ApiBearerAuth()
export class TeacherProfileController {
  constructor(private readonly service: TeacherProfileService) {}

  @Get('me')
  @Roles(Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Obtenir son profil enseignant' })
  getMyProfile(
    @Request() req: { user: { userId: string } },
  ) {
    return this.service.getByUserId(req.user.userId);
  }

  @Put('me')
  @Roles(Role.Teacher, Role.External)
  @ApiOperation({ summary: 'Créer ou mettre à jour son profil enseignant' })
  upsertMyProfile(
    @Body() dto: UpsertTeacherProfileDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.service.upsert(req.user.userId, dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }
}
