import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JuryService } from './jury.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { IsArray, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpsertDecisionDto {
  @IsMongoId() studentId!: string;
  @IsMongoId() groupId!: string;
  @IsString() session!: string;
  @IsString() decision!: string;
  @IsOptional() @IsNumber() overallAverage?: number;
  @IsOptional() @IsNumber() ectsObtained?: number;
  @IsOptional() @IsString() mention?: string;
  @IsOptional() @IsString() comment?: string;
}

class BulkDecisionEntryDto {
  @IsMongoId() studentId!: string;
  @IsString() decision!: string;
  @IsOptional() @IsNumber() overallAverage?: number;
  @IsOptional() @IsNumber() ectsObtained?: number;
  @IsOptional() @IsString() comment?: string;
}

class BulkJuryDto {
  @IsMongoId() groupId!: string;
  @IsString() session!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => BulkDecisionEntryDto)
  entries!: BulkDecisionEntryDto[];
}

@Controller('jury')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Jury')
@ApiBearerAuth()
export class JuryController {
  constructor(private readonly svc: JuryService) {}

  @Get('decisions')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  @ApiOperation({ summary: 'Lister les décisions de jury' })
  @ApiQuery({ name: 'session', required: false })
  @ApiQuery({ name: 'groupId', required: false })
  listDecisions(
    @Query('session') session?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.svc.listDecisions({ session, groupId });
  }

  @Get('sheet')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  @ApiOperation({ summary: 'Feuille de délibération pour un groupe' })
  @ApiQuery({ name: 'groupId', required: true })
  prepareSheet(@Query('groupId') groupId: string) {
    return this.svc.prepareJurySheet(groupId);
  }

  @Post('decisions')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  @ApiOperation({ summary: 'Enregistrer une décision individuelle' })
  upsertDecision(
    @Body() dto: UpsertDecisionDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.svc.upsertDecision(dto, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }

  @Post('decisions/bulk')
  @Roles(Role.Admin, Role.SuperAdmin, Role.Teacher)
  @ApiOperation({ summary: 'Délibération en masse pour un groupe' })
  bulkDecisions(
    @Body() dto: BulkJuryDto,
    @Request() req: { user: { userId: string; email?: string; role: Role }; ip?: string; headers?: Record<string, any> },
  ) {
    return this.svc.bulkUpsert(dto.entries, dto.groupId, dto.session, {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }
}
