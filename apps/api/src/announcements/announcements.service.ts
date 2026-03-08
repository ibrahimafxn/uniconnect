import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementCategory, AnnouncementScope } from './announcement.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Role } from '../common/roles.enum';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';

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
}
