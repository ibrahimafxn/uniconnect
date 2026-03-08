import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InscriptionCampaign } from './schemas/inscription-campaign.schema';
import { ApplicationDossier } from './schemas/application-dossier.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';
import { StudentProfile } from '../students/student-profile.schema';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { ReviewDossierDto } from './dto/review-dossier.dto';
import { SubmitDossierDto } from './dto/submit-dossier.dto';

@Injectable()
export class InscriptionService {
  constructor(
    @InjectModel(InscriptionCampaign.name)
    private readonly campaignModel: Model<InscriptionCampaign>,
    @InjectModel(ApplicationDossier.name)
    private readonly dossierModel: Model<ApplicationDossier>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Campagnes ────────────────────────────────────────────────────────────

  async listCampaigns(params: {
    offerId?: string;
    status?: string;
    skip: number;
    limit: number;
  }) {
    const filter: Record<string, any> = {};
    if (params.offerId) filter.offerId = new Types.ObjectId(params.offerId);
    if (params.status) filter.status = params.status;

    const [items, total] = await Promise.all([
      this.campaignModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.campaignModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async getCampaign(id: string) {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) throw new NotFoundException('Campagne introuvable.');
    return campaign;
  }

  async createCampaign(dto: CreateCampaignDto, actor: AuditActor) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) {
      throw new BadRequestException(
        'La date de fermeture doit être postérieure à la date d\'ouverture.',
      );
    }

    const campaign = await this.campaignModel.create({
      ...dto,
      offerId: new Types.ObjectId(dto.offerId),
      startDate: start,
      endDate: end,
      status: 'draft',
    });

    await this.auditLog.log({
      action: 'CREATE_CAMPAIGN',
      entity: 'InscriptionCampaign',
      entityId: String(campaign._id),
      actor,
      metadata: { name: campaign.name, offerId: dto.offerId },
    });

    return campaign;
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto, actor: AuditActor) {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) throw new NotFoundException('Campagne introuvable.');

    if (campaign.status === 'closed' && dto.status !== undefined) {
      throw new BadRequestException(
        'Une campagne clôturée ne peut pas être modifiée.',
      );
    }

    const payload: Partial<InscriptionCampaign> = { ...dto } as any;
    if (dto.startDate) payload.startDate = new Date(dto.startDate);
    if (dto.endDate) payload.endDate = new Date(dto.endDate);

    if (payload.startDate && payload.endDate && payload.endDate <= payload.startDate) {
      throw new BadRequestException(
        'La date de fermeture doit être postérieure à la date d\'ouverture.',
      );
    }

    const updated = await this.campaignModel
      .findByIdAndUpdate(id, payload, { returnDocument: 'after' })
      .exec();

    await this.auditLog.log({
      action: 'UPDATE_CAMPAIGN',
      entity: 'InscriptionCampaign',
      entityId: id,
      actor,
      metadata: dto as any,
    });

    return updated;
  }

  async deleteCampaign(id: string, actor: AuditActor) {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) throw new NotFoundException('Campagne introuvable.');
    if (campaign.status !== 'draft') {
      throw new BadRequestException(
        'Seules les campagnes en brouillon peuvent être supprimées.',
      );
    }
    await this.campaignModel.findByIdAndDelete(id).exec();
    await this.auditLog.log({
      action: 'DELETE_CAMPAIGN',
      entity: 'InscriptionCampaign',
      entityId: id,
      actor,
    });
    return { deleted: true };
  }

  async getCampaignStats(id: string) {
    const campaign = await this.campaignModel.findById(id).lean().exec();
    if (!campaign) throw new NotFoundException('Campagne introuvable.');

    const [total, byStatus] = await Promise.all([
      this.dossierModel.countDocuments({ campaignId: id }).exec(),
      this.dossierModel
        .aggregate([
          { $match: { campaignId: new Types.ObjectId(id) } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    const statusMap: Record<string, number> = {};
    for (const entry of byStatus) statusMap[entry._id] = entry.count;

    const approved = statusMap['approved'] ?? 0;
    const fillRate =
      campaign.capacity > 0
        ? Math.round((approved / campaign.capacity) * 100)
        : 0;

    return {
      campaignId: id,
      capacity: campaign.capacity,
      total,
      approved,
      fillRate,
      byStatus: statusMap,
    };
  }

  // ─── Dossiers ─────────────────────────────────────────────────────────────

  async listDossiers(params: {
    campaignId?: string;
    studentId?: string;
    status?: string;
    skip: number;
    limit: number;
  }) {
    const filter: Record<string, any> = {};
    if (params.campaignId) filter.campaignId = new Types.ObjectId(params.campaignId);
    if (params.studentId) filter.studentId = new Types.ObjectId(params.studentId);
    if (params.status) filter.status = params.status;

    const [items, total] = await Promise.all([
      this.dossierModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .populate('studentId', 'firstName lastName studentNumber email')
        .populate('campaignId', 'name status')
        .exec(),
      this.dossierModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async getDossier(id: string) {
    const dossier = await this.dossierModel
      .findById(id)
      .populate('studentId', 'firstName lastName studentNumber email')
      .populate('campaignId', 'name status requiredDocuments')
      .exec();
    if (!dossier) throw new NotFoundException('Dossier introuvable.');
    return dossier;
  }

  async submitDossier(dto: SubmitDossierDto, actor: AuditActor) {
    const campaign = await this.campaignModel.findById(dto.campaignId).lean().exec();
    if (!campaign) throw new NotFoundException('Campagne introuvable.');
    if (campaign.status !== 'open') {
      throw new BadRequestException('La campagne n\'est pas ouverte aux inscriptions.');
    }

    const student = await this.studentModel.findById(dto.studentId).lean().exec();
    if (!student) throw new NotFoundException('Étudiant introuvable.');

    const existing = await this.dossierModel
      .findOne({ campaignId: dto.campaignId, studentId: dto.studentId })
      .lean()
      .exec();
    if (existing) {
      throw new BadRequestException('Un dossier existe déjà pour cet étudiant dans cette campagne.');
    }

    const approvedCount = await this.dossierModel
      .countDocuments({ campaignId: dto.campaignId, status: 'approved' })
      .exec();

    let status: ApplicationDossier['status'] = 'pending';
    let waitingListPosition = 0;

    if (approvedCount >= campaign.capacity) {
      if (!campaign.waitingListEnabled) {
        throw new BadRequestException('La capacité maximale est atteinte et la liste d\'attente est désactivée.');
      }
      const waitingCount = await this.dossierModel
        .countDocuments({ campaignId: dto.campaignId, status: 'waitlisted' })
        .exec();
      if (campaign.waitingListLimit > 0 && waitingCount >= campaign.waitingListLimit) {
        throw new BadRequestException('La liste d\'attente est également complète.');
      }
      status = 'waitlisted';
      waitingListPosition = waitingCount + 1;
    }

    const submitted = dto.submittedDocuments ?? [];
    const missing = campaign.requiredDocuments.filter((d) => !submitted.includes(d));
    if (missing.length > 0 && status === 'pending') {
      status = 'incomplete';
    }

    const dossier = await this.dossierModel.create({
      campaignId: new Types.ObjectId(dto.campaignId),
      studentId: new Types.ObjectId(dto.studentId),
      status,
      submittedDocuments: submitted,
      missingDocuments: missing,
      waitingListPosition,
    });

    await this.auditLog.log({
      action: 'SUBMIT_DOSSIER',
      entity: 'ApplicationDossier',
      entityId: String(dossier._id),
      actor,
      metadata: { campaignId: dto.campaignId, studentId: dto.studentId, status },
    });

    if (student.email) {
      await this.notifyStudent(student.email, `${student.firstName} ${student.lastName}`, status, missing);
    }

    return dossier;
  }

  async reviewDossier(id: string, dto: ReviewDossierDto, actor: AuditActor) {
    const dossier = await this.dossierModel.findById(id).exec();
    if (!dossier) throw new NotFoundException('Dossier introuvable.');

    if (['approved', 'rejected'].includes(dossier.status)) {
      throw new BadRequestException('Ce dossier a déjà été statué définitivement.');
    }

    if (dto.decision === 'rejected' && !dto.rejectionReason) {
      throw new BadRequestException('Le motif de refus est obligatoire.');
    }

    const payload: Partial<ApplicationDossier> = {
      status: dto.decision,
      reviewedBy: new Types.ObjectId(actor.userId) as any,
      reviewedAt: new Date(),
    } as any;

    if (dto.decision === 'rejected') payload.rejectionReason = dto.rejectionReason!;
    if (dto.decision === 'incomplete') payload.missingDocuments = dto.missingDocuments ?? [];

    const updated = await this.dossierModel
      .findByIdAndUpdate(id, payload, { returnDocument: 'after' })
      .populate('studentId', 'firstName lastName email')
      .exec();

    await this.auditLog.log({
      action: 'REVIEW_DOSSIER',
      entity: 'ApplicationDossier',
      entityId: id,
      actor,
      metadata: { decision: dto.decision, rejectionReason: dto.rejectionReason },
    });

    const student = updated?.studentId as any;
    if (student?.email) {
      await this.notifyStudent(
        student.email,
        `${student.firstName} ${student.lastName}`,
        dto.decision,
        dto.missingDocuments,
        dto.rejectionReason,
      );
    }

    return updated;
  }

  async annotateDossier(id: string, internalNote: string, actor: AuditActor) {
    const dossier = await this.dossierModel.findById(id).exec();
    if (!dossier) throw new NotFoundException('Dossier introuvable.');

    const updated = await this.dossierModel
      .findByIdAndUpdate(id, { internalNote }, { returnDocument: 'after' })
      .exec();

    await this.auditLog.log({
      action: 'ANNOTATE_DOSSIER',
      entity: 'ApplicationDossier',
      entityId: id,
      actor,
    });

    return updated;
  }

  async notifyDossier(id: string, actor: AuditActor) {
    const dossier = await this.dossierModel
      .findById(id)
      .populate('studentId', 'firstName lastName email')
      .exec();
    if (!dossier) throw new NotFoundException('Dossier introuvable.');

    const student = dossier.studentId as any;
    if (!student?.email) {
      throw new BadRequestException('L\'étudiant n\'a pas d\'adresse email.');
    }

    await this.emailService.sendMail({
      to: student.email,
      subject: 'Mise à jour de votre dossier d\'inscription — UniConnect',
      text: `Bonjour ${student.firstName} ${student.lastName},\n\nVotre dossier a été mis à jour. Statut actuel : ${dossier.status}.\n\nCordialement,\nLe service de scolarité`,
    });

    await this.auditLog.log({
      action: 'NOTIFY_DOSSIER',
      entity: 'ApplicationDossier',
      entityId: id,
      actor,
    });

    return { notified: true };
  }

  // ─── Privé ────────────────────────────────────────────────────────────────

  private async notifyStudent(
    email: string,
    fullName: string,
    status: string,
    missingDocuments?: string[],
    rejectionReason?: string,
  ) {
    const messages: Record<string, string> = {
      pending: 'Votre dossier a bien été reçu et est en cours de traitement.',
      complete: 'Votre dossier est complet. Il sera prochainement instruit.',
      incomplete: `Votre dossier est incomplet. Pièces manquantes : ${(missingDocuments ?? []).join(', ')}.`,
      approved: 'Félicitations ! Votre dossier d\'inscription a été accepté.',
      rejected: `Votre dossier a été refusé. Motif : ${rejectionReason ?? 'non précisé'}.`,
      waitlisted: 'Votre dossier a été placé en liste d\'attente.',
    };

    const text = messages[status] ?? 'Votre dossier a été mis à jour.';
    await this.emailService.sendMail({
      to: email,
      subject: 'Votre dossier d\'inscription — UniConnect',
      text: `Bonjour ${fullName},\n\n${text}\n\nCordialement,\nLe service de scolarité`,
    });
  }
}
