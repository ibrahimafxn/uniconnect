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
import { PlanningService } from './planning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Controller('planning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get('rooms')
  @Roles(Role.Admin, Role.SuperAdmin)
  listRooms() {
    return this.planningService.listRooms();
  }

  @Post('rooms')
  @Roles(Role.Admin, Role.SuperAdmin)
  createRoom(@Body() dto: CreateRoomDto) {
    return this.planningService.createRoom(dto);
  }

  @Patch('rooms/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.planningService.updateRoom(id, dto);
  }

  @Delete('rooms/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  deleteRoom(@Param('id') id: string) {
    return this.planningService.deleteRoom(id);
  }

  @Get('sessions')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher, Role.External, Role.Student)
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
  createSession(@Body() dto: CreateSessionDto) {
    return this.planningService.createSession(dto);
  }

  @Patch('sessions/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  updateSession(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.planningService.updateSession(id, dto as any);
  }

  @Delete('sessions/:id')
  @Roles(Role.Admin, Role.SuperAdmin)
  deleteSession(@Param('id') id: string) {
    return this.planningService.deleteSession(id);
  }
}
