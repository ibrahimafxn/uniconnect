import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './audit-log.schema';

export type AuditActor = {
  userId: string;
  role: string;
  email?: string;
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLog>,
  ) {}

  async log(params: {
    action: string;
    entity: string;
    entityId: string;
    actor: AuditActor;
    metadata?: Record<string, any>;
  }) {
    return this.auditModel.create({
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      actorId: params.actor.userId,
      actorRole: params.actor.role,
      actorEmail: params.actor.email,
      metadata: params.metadata,
      ip: params.actor.ip,
      userAgent: params.actor.userAgent,
    });
  }
}
