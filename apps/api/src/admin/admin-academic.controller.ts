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
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import {
  AdminAcademicService,
  SemesterInit,
  OfferInit,
} from './admin-academic.service';
import type { CalendarEventType } from './schemas/academic-calendar-event.schema';

@ApiTags('admin/academic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
@Controller('admin/academic')
export class AdminAcademicController {
  constructor(private readonly service: AdminAcademicService) {}

  @Post('years/initialize')
  @ApiOperation({
    summary: 'Initialiser une nouvelle année académique (UC-A01)',
    description:
      "Crée l'année + les semestres + les offres de formation en une seule opération.",
  })
  initializeYear(
    @Body()
    body: {
      name: string;
      startDate: string;
      endDate: string;
      isActive?: boolean;
      semesters: SemesterInit[];
      offers: OfferInit[];
    },
    @Request() req: any,
  ) {
    return this.service.initializeYear({
      ...body,
      actor: this.buildActor(req),
    });
  }

  @Patch('years/:id/close')
  @ApiOperation({ summary: 'Clôturer une année académique (UC-A06)' })
  closeYear(@Param('id') id: string, @Request() req: any) {
    return this.service.closeYear(id, this.buildActor(req));
  }

  @Get('years/:id/summary')
  @ApiOperation({ summary: "Bilan détaillé d'une année académique" })
  getYearSummary(@Param('id') id: string) {
    return this.service.getYearSummary(id);
  }

  @Patch('offers/:id/capacity')
  @ApiOperation({ summary: "Modifier la capacité d'accueil d'une offre" })
  updateOfferCapacity(
    @Param('id') id: string,
    @Body() body: { capacity: number },
    @Request() req: any,
  ) {
    return this.service.updateOfferCapacity(id, body.capacity, this.buildActor(req));
  }

  @Post('calendar-events')
  @ApiOperation({ summary: 'Créer un événement du calendrier universitaire' })
  createCalendarEvent(
    @Body()
    body: {
      academicYearId: string;
      type: CalendarEventType;
      label: string;
      startDate: string;
      endDate: string;
      offerId?: string;
    },
    @Request() req: any,
  ) {
    return this.service.createCalendarEvent({ ...body, actor: this.buildActor(req) });
  }

  @Get('calendar-events')
  @ApiOperation({ summary: 'Lister les événements du calendrier universitaire' })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listCalendarEvents(
    @Query('academicYearId') academicYearId?: string,
    @Query('type') type?: CalendarEventType,
    @Query('skip') skip = '0',
    @Query('limit') limit = '50',
  ) {
    return this.service.listCalendarEvents({
      academicYearId,
      type,
      skip: parseInt(skip, 10),
      limit: Math.min(parseInt(limit, 10), 200),
    });
  }

  @Delete('calendar-events/:id')
  @ApiOperation({ summary: 'Supprimer un événement du calendrier' })
  deleteCalendarEvent(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteCalendarEvent(id, this.buildActor(req));
  }

  private buildActor(req: any) {
    return {
      userId: req.user?.userId ?? req.user?._id ?? 'unknown',
      role: req.user?.role ?? 'admin',
      email: req.user?.email,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
  }
}
