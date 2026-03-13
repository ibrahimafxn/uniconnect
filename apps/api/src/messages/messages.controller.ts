import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, mkdirSync } from 'fs';
import { join } from 'path';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { parsePagination } from '../common/pagination';
import { MessagesService } from './messages.service';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Role } from '../common/roles.enum';

const uploadRoot = join(process.cwd(), 'uploads', 'messages');
const ensureUploadDir = () => mkdirSync(uploadRoot, { recursive: true });
const buildFileName = (name: string) => {
  const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitized}`;
};

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Messagerie')
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @Roles(Role.SuperAdmin, Role.Admin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Lister les conversations' })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  listConversations(
    @Request() req: { user: { userId: string } },
  ) {
    return this.messagesService.listConversations(req.user.userId);
  }

  @Post('conversations/direct')
  @Roles(Role.SuperAdmin, Role.Admin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Créer une conversation directe' })
  createDirect(
    @Body() dto: CreateDirectConversationDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.messagesService.createDirectConversation(dto.participantId, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Post('conversations/group')
  @Roles(Role.SuperAdmin, Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Créer une conversation de groupe' })
  createGroup(
    @Body() dto: CreateGroupConversationDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.messagesService.createGroupConversation(
      dto.title,
      dto.participantIds,
      {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
      },
    );
  }

  @Get('conversations/:id/messages')
  @Roles(Role.SuperAdmin, Role.Admin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Lister les messages d\'une conversation' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listMessages(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    return this.messagesService.listMessages(id, req.user.userId, pagination);
  }

  @Post('conversations/:id/messages')
  @Roles(Role.SuperAdmin, Role.Admin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Envoyer un message' })
  createMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.messagesService.createMessage(id, dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Post('attachments')
  @Roles(Role.SuperAdmin, Role.Admin, Role.Teacher, Role.External, Role.Student)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDir();
          cb(null, uploadRoot);
        },
        filename: (_req, file, cb) => {
          cb(null, buildFileName(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'image/png',
          'image/jpeg',
        ];
        if (!allowed.includes(file.mimetype)) {
          return cb(new Error('Unsupported file type'), false);
        }
        return cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Uploader une pièce jointe' })
  uploadAttachment(
    @Query('conversationId') conversationId: string,
    @UploadedFile()
    file: {
      originalname: string;
      filename: string;
      path: string;
      mimetype: string;
      size: number;
    },
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.messagesService.createAttachment(conversationId, file, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Get('attachments/:id/download')
  @Roles(Role.SuperAdmin, Role.Admin, Role.Teacher, Role.External, Role.Student)
  @ApiOperation({ summary: 'Telecharger une piece jointe' })
  async downloadAttachment(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: any,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    const attachment = await this.messagesService.getAttachment(id, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
    });
    return new StreamableFile(createReadStream(attachment.path));
  }
}
