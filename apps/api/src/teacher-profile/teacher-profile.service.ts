import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TeacherProfile } from './teacher-profile.schema';
import { AuditActor, AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class TeacherProfileService {
  constructor(
    @InjectModel(TeacherProfile.name)
    private readonly profileModel: Model<TeacherProfile>,
    private readonly auditLog: AuditLogService,
  ) {}

  getByUserId(userId: string) {
    return this.profileModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }

  async upsert(
    userId: string,
    data: Partial<Omit<TeacherProfile, 'userId'>>,
    actor: AuditActor,
  ) {
    const profile = await this.profileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { ...data, userId: new Types.ObjectId(userId) } },
      { upsert: true, new: true },
    ).exec();

    await this.auditLog.log({
      action: 'teacher-profile.upsert',
      entity: 'teacher-profile',
      entityId: String(profile._id),
      actor,
      metadata: { userId },
    });

    return profile;
  }
}
