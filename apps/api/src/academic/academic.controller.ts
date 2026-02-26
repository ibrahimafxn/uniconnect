import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { CreateLevelDto } from './dto/create-level.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { parsePagination } from '../common/pagination';
import { toObjectId } from '../common/object-id';

@Controller('academic')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin, Role.SuperAdmin)
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Get('years')
  async listAcademicYears(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    const result = await this.academicService.listAcademicYears(pagination);
    return { ...result, ...pagination };
  }

  @Post('years')
  createAcademicYear(@Body() dto: CreateAcademicYearDto) {
    return this.academicService.createAcademicYear({
      name: dto.name,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      isActive: dto.isActive,
    });
  }

  @Patch('years/:id')
  updateAcademicYear(
    @Param('id') id: string,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    const payload = {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };
    return this.academicService.updateAcademicYear(id, payload);
  }

  @Delete('years/:id')
  deleteAcademicYear(@Param('id') id: string) {
    return this.academicService.deleteAcademicYear(id);
  }

  @Get('programs')
  async listPrograms(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    const result = await this.academicService.listPrograms(pagination);
    return { ...result, ...pagination };
  }

  @Post('programs')
  createProgram(@Body() dto: CreateProgramDto) {
    return this.academicService.createProgram({
      name: dto.name,
      code: dto.code,
    });
  }

  @Patch('programs/:id')
  updateProgram(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.academicService.updateProgram(id, dto);
  }

  @Delete('programs/:id')
  deleteProgram(@Param('id') id: string) {
    return this.academicService.deleteProgram(id);
  }

  @Get('levels')
  async listLevels(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    const result = await this.academicService.listLevels(pagination);
    return { ...result, ...pagination };
  }

  @Post('levels')
  createLevel(@Body() dto: CreateLevelDto) {
    return this.academicService.createLevel({
      name: dto.name,
      programId: dto.programId,
    });
  }

  @Patch('levels/:id')
  updateLevel(@Param('id') id: string, @Body() dto: UpdateLevelDto) {
    const payload = {
      ...dto,
      programId: toObjectId(dto.programId),
    };
    return this.academicService.updateLevel(id, payload);
  }

  @Delete('levels/:id')
  deleteLevel(@Param('id') id: string) {
    return this.academicService.deleteLevel(id);
  }

  @Get('groups')
  async listGroups(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    const result = await this.academicService.listGroups(pagination);
    return { ...result, ...pagination };
  }

  @Post('groups')
  createGroup(@Body() dto: CreateGroupDto) {
    return this.academicService.createGroup({
      name: dto.name,
      levelId: dto.levelId,
    });
  }

  @Patch('groups/:id')
  updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    const payload = {
      ...dto,
      levelId: toObjectId(dto.levelId),
    };
    return this.academicService.updateGroup(id, payload);
  }

  @Delete('groups/:id')
  deleteGroup(@Param('id') id: string) {
    return this.academicService.deleteGroup(id);
  }
}
