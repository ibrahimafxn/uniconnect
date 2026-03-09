import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementCategory, AnnouncementScope } from './announcement.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Role } from '../common/roles.enum';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<Announcement>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    private readonly auditLog: AuditLogService,
  ) {}

  async listAnnouncements(params: {
    category?: AnnouncementCategory;
    user: { role: Role; email?: string };
  }) {
    const filter: any = {};
    if (params.category) filter.category = params.category;

    if (params.user.role === Role.Student) {
      const profile = await this.studentModel
        .findOne({ email: params.user.email?.toLowerCase().trim() })
        .lean()
        .exec();
      const groupId = profile?.groupId ? new Types.ObjectId(profile.groupId) : null;
      filter.$or = [
        { scope: AnnouncementScope.All },
        { scope: AnnouncementScope.Students },
      ];
      if (groupId) {
        filter.$or.push({ scope: AnnouncementScope.Group, groupId });
      }
    }
    return this.announcementModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async createAnnouncement(
    data: {
      title: string;
      body: string;
      scope?: AnnouncementScope;
      category?: AnnouncementCategory;
      groupId?: string;
      createdBy: string;
    },
    actor: AuditActor,
  ) {
    const announcement = await this.announcementModel.create({
      title: data.title,
      body: data.body,
      scope: data.scope ?? AnnouncementScope.All,
      category: data.category ?? AnnouncementCategory.Official,
      groupId: data.groupId ? new Types.ObjectId(data.groupId) : undefined,
      createdBy: new Types.ObjectId(data.createdBy),
    });
    await this.auditLog.log({
      action: 'announcements.create',
      entity: 'announcement',
      entityId: String(announcement._id),
      actor,
      metadata: { title: announcement.title, scope: announcement.scope, category: announcement.category },
    });
    return announcement;
  }

  async updateAnnouncement(
    id: string,
    dto: UpdateAnnouncementDto,
    actor: AuditActor,
  ) {
    const update: any = { ...dto };
    if (dto.groupId) update.groupId = new Types.ObjectId(dto.groupId);
    if (dto.groupId === '') update.groupId = undefined;

    const updated = await this.announcementModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Announcement not found');
    }

    await this.auditLog.log({
      action: 'announcements.update',
      entity: 'announcement',
      entityId: String(updated._id),
      actor,
      metadata: { title: updated.title, scope: updated.scope, category: updated.category },
    });

    return updated;
  }

  async deleteAnnouncement(id: string, actor: AuditActor) {
    const deleted = await this.announcementModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Announcement not found');
    }

    await this.auditLog.log({
      action: 'announcements.delete',
      entity: 'announcement',
      entityId: String(deleted._id),
      actor,
      metadata: { title: deleted.title, scope: deleted.scope, category: deleted.category },
    });

    return { success: true };
  }
}
