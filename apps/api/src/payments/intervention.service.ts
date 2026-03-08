import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InterventionSheet } from './intervention-sheet.schema';
import { AuditActor, AuditLogService } from '../audit/audit-log.service';
import { Role } from '../common/roles.enum';

@Injectable()
export class InterventionService {
  constructor(
    @InjectModel(InterventionSheet.name)
    private readonly sheetModel: Model<InterventionSheet>,
    private readonly auditLog: AuditLogService,
  ) {}

  listSheets(filter: { teacherId?: string; status?: string; role: Role; userId: string }) {
    const query: any = {};
    // Vacataire : ne voit que ses propres feuilles
    if (filter.role === Role.External || filter.role === Role.Teacher) {
      query.teacherId = new Types.ObjectId(filter.userId);
    } else if (filter.teacherId) {
      query.teacherId = new Types.ObjectId(filter.teacherId);
    }
    if (filter.status) query.status = filter.status;
    return this.sheetModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async createSheet(
    data: {
      period: string;
      hoursCM?: number;
      hoursTD?: number;
      hoursTP?: number;
      hourlyRate: number;
      currency?: string;
      comment?: string;
    },
    actor: AuditActor,
  ) {
    const { hoursCM = 0, hoursTD = 0, hoursTP = 0, hourlyRate } = data;
    const total = hourlyRate * (hoursCM + hoursTD + hoursTP);

    const sheet = await this.sheetModel.create({
      teacherId: new Types.ObjectId(actor.userId),
      period: data.period,
      hoursCM,
      hoursTD,
      hoursTP,
      hourlyRate,
      currency: data.currency ?? 'XOF',
      totalAmount: total,
      comment: data.comment,
      status: 'draft',
    });

    await this.auditLog.log({
      action: 'intervention.create',
      entity: 'interventionSheet',
      entityId: String(sheet._id),
      actor,
      metadata: { period: data.period, totalAmount: total },
    });

    return sheet;
  }

  async submitSheet(id: string, actor: AuditActor) {
    const sheet = await this.sheetModel.findById(id).exec();
    if (!sheet) throw new BadRequestException('Feuille introuvable.');
    if (String(sheet.teacherId) !== actor.userId) throw new ForbiddenException('Accès refusé.');
    if (sheet.status !== 'draft') throw new BadRequestException('Statut invalide pour soumission.');

    sheet.status = 'submitted';
    await sheet.save();

    await this.auditLog.log({
      action: 'intervention.submit',
      entity: 'interventionSheet',
      entityId: id,
      actor,
      metadata: { period: sheet.period },
    });

    return sheet;
  }

  async validateSheet(id: string, adminComment: string | undefined, actor: AuditActor) {
    if (actor.role !== Role.Admin && actor.role !== Role.SuperAdmin) {
      throw new ForbiddenException('Réservé aux administrateurs.');
    }
    const sheet = await this.sheetModel.findById(id).exec();
    if (!sheet) throw new BadRequestException('Feuille introuvable.');
    if (sheet.status !== 'submitted') throw new BadRequestException('Feuille non soumise.');

    sheet.status = 'validated';
    sheet.validatedAt = new Date();
    if (adminComment) sheet.adminComment = adminComment;
    await sheet.save();

    await this.auditLog.log({
      action: 'intervention.validate',
      entity: 'interventionSheet',
      entityId: id,
      actor,
      metadata: { period: sheet.period },
    });

    return sheet;
  }

  async markPaid(id: string, actor: AuditActor) {
    if (actor.role !== Role.Admin && actor.role !== Role.SuperAdmin) {
      throw new ForbiddenException('Réservé aux administrateurs.');
    }
    const sheet = await this.sheetModel.findById(id).exec();
    if (!sheet) throw new BadRequestException('Feuille introuvable.');
    if (sheet.status !== 'validated') throw new BadRequestException('Feuille non validée.');

    sheet.status = 'paid';
    sheet.paidAt = new Date();
    await sheet.save();

    await this.auditLog.log({
      action: 'intervention.paid',
      entity: 'interventionSheet',
      entityId: id,
      actor,
      metadata: { period: sheet.period, totalAmount: sheet.totalAmount },
    });

    return sheet;
  }
}
