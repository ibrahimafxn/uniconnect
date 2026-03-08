import { Body, Controller, Get, Patch, Post, Query, Request, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { DocumentRequestsService } from './document-requests.service';
import { CreateDocumentRequestDto } from './dto/create-document-request.dto';
import { UpdateDocumentRequestDto } from './dto/update-document-request.dto';
import { DocumentRequestStatus } from './document-request.schema';

@Controller('documents/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentRequestsController {
  constructor(private readonly service: DocumentRequestsService) {}

  @Post()
  @Roles(Role.Student)
  create(
    @Body() dto: CreateDocumentRequestDto,
    @Request() req: { user: { email?: string } },
  ) {
    return this.service.createRequest(req.user.email ?? '', dto.type, dto.note);
  }

  @Get('me')
  @Roles(Role.Student)
  listMine(@Request() req: { user: { email?: string } }) {
    return this.service.listMyRequests(req.user.email ?? '');
  }

  @Get()
  @Roles(Role.Admin, Role.SuperAdmin)
  listAll(@Query('status') status?: DocumentRequestStatus) {
    return this.service.listRequests(status);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.SuperAdmin)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentRequestDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.service.updateRequest(
      id,
      { status: dto.status, note: dto.note, documentId: dto.documentId },
      {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
      },
    );
  }
}
