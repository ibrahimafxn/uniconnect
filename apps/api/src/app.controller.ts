import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Roles } from './common/roles.decorator';
import { RolesGuard } from './common/roles.guard';
import { Role } from './common/roles.enum';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(
    @Request() req: { user: { userId: string; email: string; role: Role } },
  ) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @Get('admin/ping')
  adminPing() {
    return { ok: true };
  }
}
