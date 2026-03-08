import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { Resource } from './resource.schema';
import { AuditActor, AuditLogService } from '../audit/audit-log.service';
import { Role } from '../common/roles.enum';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<Resource>,
    private readonly auditLog: AuditLogService,
  ) {}

  async createResource(
    data: {
      title: string;
      description?: string;
      originalName: string;
      fileName: string;
      path: string;
      mimeType: string;
      size: number;
      sessionId?: string;
      groupId?: string;
    },
    actor: AuditActor,
  ) {
    const resource = await this.resourceModel.create({
      ...data,
      teacherId: new Types.ObjectId(actor.userId),
      sessionId: data.sessionId ? new Types.ObjectId(data.sessionId) : undefined,
      groupId: data.groupId ? new Types.ObjectId(data.groupId) : undefined,
    });
    await this.auditLog.log({
      action: 'resource.create',
      entity: 'resource',
      entityId: String(resource._id),
      actor,
      metadata: { title: resource.title, originalName: resource.originalName },
    });
    return resource;
  }

  /** Liste des ressources selon le rôle */
  listResources(filter: {
    teacherId?: string;
    sessionId?: string;
    groupId?: string;
    role: Role;
    userId: string;
  }) {
    const query: any = {};

    if (filter.sessionId) query.sessionId = new Types.ObjectId(filter.sessionId);
    if (filter.groupId) query.groupId = new Types.ObjectId(filter.groupId);

    // Enseignant : ne voit que ses propres ressources si pas de filtre
    if ((filter.role === Role.Teacher || filter.role === Role.External) && !filter.sessionId && !filter.groupId) {
      query.teacherId = new Types.ObjectId(filter.userId);
    }

    return this.resourceModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getResource(id: string, actor: { userId: string; role: Role }) {
    const resource = await this.resourceModel.findById(id).exec();
    if (!resource) throw new NotFoundException('Ressource introuvable.');

    // Vérifier les droits d'accès
    if (
      actor.role !== Role.Admin &&
      actor.role !== Role.SuperAdmin &&
      actor.role !== Role.Student
    ) {
      if (String(resource.teacherId) !== actor.userId) {
        throw new ForbiddenException('Accès refusé.');
      }
    }

    if (!fs.existsSync(resource.path)) {
      throw new NotFoundException('Fichier introuvable sur le serveur.');
    }

    return resource;
  }

  async deleteResource(id: string, actor: AuditActor) {
    const resource = await this.resourceModel.findById(id).exec();
    if (!resource) throw new NotFoundException('Ressource introuvable.');

    if (
      actor.role !== Role.Admin &&
      actor.role !== Role.SuperAdmin &&
      String(resource.teacherId) !== actor.userId
    ) {
      throw new ForbiddenException('Accès refusé.');
    }

    // Supprimer le fichier physique
    if (fs.existsSync(resource.path)) {
      fs.unlinkSync(resource.path);
    }

    await this.resourceModel.findByIdAndDelete(id).exec();

    await this.auditLog.log({
      action: 'resource.delete',
      entity: 'resource',
      entityId: id,
      actor,
      metadata: { title: resource.title },
    });

    return { success: true };
  }
}
