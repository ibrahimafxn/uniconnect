import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resource } from './resource.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Role } from '../common/roles.enum';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<Resource>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    private readonly auditLog: AuditLogService,
  ) {}

  async listResources(params: {
    groupId?: string;
    subjectId?: string;
    sessionId?: string;
    user: { role: Role; email?: string; userId: string };
  }) {
    const filter: any = {};

    if (params.user.role === Role.Student) {
      const profile = await this.studentModel
        .findOne({ email: params.user.email?.toLowerCase().trim() })
        .lean()
        .exec();
      if (!profile?.groupId) return [];
      filter.groupId = profile.groupId;
    } else if (params.groupId) {
      filter.groupId = params.groupId;
    }

    if (params.subjectId) filter.subjectId = params.subjectId;
    if (params.sessionId) filter.sessionId = params.sessionId;

    return this.resourceModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async createResource(
    data: {
      title: string;
      description?: string;
      groupId: string;
      subjectId?: string;
      sessionId?: string;
      uploadedBy: string;
      originalName: string;
      fileName: string;
      path: string;
      mimeType: string;
      size: number;
    },
    actor: AuditActor,
  ) {
    const resource = await this.resourceModel.create({
      ...data,
      groupId: new Types.ObjectId(data.groupId),
      subjectId: data.subjectId ? new Types.ObjectId(data.subjectId) : undefined,
      sessionId: data.sessionId ? new Types.ObjectId(data.sessionId) : undefined,
      uploadedBy: new Types.ObjectId(data.uploadedBy),
    });
    await this.auditLog.log({
      action: 'resources.create',
      entity: 'resource',
      entityId: String(resource._id),
      actor,
      metadata: { title: resource.title, groupId: String(resource.groupId) },
    });
    return resource;
  }

  async getResource(id: string, user: { role: Role; email?: string }) {
    const resource = await this.resourceModel.findById(id).exec();
    if (!resource) throw new NotFoundException('Ressource introuvable');
    if (user.role === Role.Student) {
      const profile = await this.studentModel
        .findOne({ email: user.email?.toLowerCase().trim() })
        .lean()
        .exec();
      if (!profile?.groupId || String(profile.groupId) !== String(resource.groupId)) {
        throw new ForbiddenException('Accès refusé');
      }
    }
    return resource;
  }

  async deleteResource(id: string, actor: AuditActor) {
    const resource = await this.resourceModel.findByIdAndDelete(id).exec();
    if (resource) {
      await this.auditLog.log({
        action: 'resources.delete',
        entity: 'resource',
        entityId: String(resource._id),
        actor,
        metadata: { title: resource.title },
      });
    }
    return resource;
  }
}
