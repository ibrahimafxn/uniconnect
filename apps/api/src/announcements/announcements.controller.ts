import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AnnouncementCategory } from './announcement.schema';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
  list(
    @Query('category') category: AnnouncementCategory | undefined,
    @Request() req: { user: { role: Role; email?: string } },
  ) {
    return this.service.listAnnouncements({
      category,
      user: { role: req.user.role, email: req.user.email },
    });
  }

  @Post()
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  create(
    @Body() dto: CreateAnnouncementDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.service.createAnnouncement(
      {
        ...dto,
        createdBy: req.user.userId,
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

  @Patch(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.service.updateAnnouncement(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.service.deleteAnnouncement(id, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }
}
