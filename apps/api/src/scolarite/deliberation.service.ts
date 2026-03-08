import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Deliberation, DeliberationStatus } from './schemas/deliberation.schema';
import { JuryDecision, JuryDecisionType, Mention } from './schemas/jury-decision.schema';
import { SemesterResult } from './schemas/semester-result.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';

@Injectable()
export class DeliberationService {
  constructor(
    @InjectModel(Deliberation.name)
    private readonly deliberationModel: Model<Deliberation>,
    @InjectModel(JuryDecision.name)
    private readonly decisionModel: Model<JuryDecision>,
    @InjectModel(SemesterResult.name)
    private readonly resultModel: Model<SemesterResult>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  // ─── CRUD Délibérations ───────────────────────────────────────────────────

  async listDeliberations(params: { semesterId?: string; offerId?: string; skip: number; limit: number }) {
    const filter: Record<string, any> = {};
    if (params.semesterId) filter.semesterId = new Types.ObjectId(params.semesterId);
    if (params.offerId) filter.offerId = new Types.ObjectId(params.offerId);

    const [items, total] = await Promise.all([
      this.deliberationModel
        .find(filter)
        .sort({ scheduledAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.deliberationModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async getDeliberation(id: string) {
    const d = await this.deliberationModel.findById(id).exec();
    if (!d) throw new NotFoundException('Délibération introuvable.');
    return d;
  }

  async createDeliberation(
    dto: {
      semesterId: string;
      offerId: string;
      scheduledAt: string;
      juryMembers?: string[];
      presidentId?: string;
    },
    actor: AuditActor,
  ) {
    const deliberation = await this.deliberationModel.create({
      semesterId: new Types.ObjectId(dto.semesterId),
      offerId: new Types.ObjectId(dto.offerId),
      scheduledAt: new Date(dto.scheduledAt),
      juryMembers: (dto.juryMembers ?? []).map((id) => new Types.ObjectId(id)),
      presidentId: dto.presidentId ? new Types.ObjectId(dto.presidentId) : undefined,
      status: 'planned',
    });

    await this.auditLog.log({
      action: 'CREATE_DELIBERATION',
      entity: 'Deliberation',
      entityId: String(deliberation._id),
      actor,
      metadata: { semesterId: dto.semesterId, offerId: dto.offerId },
    });

    return deliberation;
  }

  async updateDeliberation(
    id: string,
    dto: { scheduledAt?: string; juryMembers?: string[]; presidentId?: string },
    actor: AuditActor,
  ) {
    const deliberation = await this.deliberationModel.findById(id).exec();
    if (!deliberation) throw new NotFoundException('Délibération introuvable.');
    if (['completed', 'signed'].includes(deliberation.status)) {
      throw new BadRequestException('Impossible de modifier une délibération terminée ou signée.');
    }

    const payload: Record<string, any> = {};
    if (dto.scheduledAt) payload.scheduledAt = new Date(dto.scheduledAt);
    if (dto.juryMembers) payload.juryMembers = dto.juryMembers.map((id) => new Types.ObjectId(id));
    if (dto.presidentId) payload.presidentId = new Types.ObjectId(dto.presidentId);

    const updated = await this.deliberationModel
      .findByIdAndUpdate(id, payload, { returnDocument: 'after' })
      .exec();

    await this.auditLog.log({ action: 'UPDATE_DELIBERATION', entity: 'Deliberation', entityId: id, actor });
    return updated;
  }

  // ─── Workflow Délibération ────────────────────────────────────────────────

  async startDeliberation(id: string, actor: AuditActor) {
    const d = await this.deliberationModel.findById(id).exec();
    if (!d) throw new NotFoundException('Délibération introuvable.');
    if (d.status !== 'planned') {
      throw new BadRequestException('Seule une délibération planifiée peut être démarrée.');
    }

    // Pré-charger les décisions depuis les résultats LMD provisoires
    await this.preloadDecisionsFromLmd(id, String(d.semesterId), String(d.offerId), actor);

    const updated = await this.deliberationModel
      .findByIdAndUpdate(id, { status: 'in_progress' }, { returnDocument: 'after' })
      .exec();

    await this.auditLog.log({ action: 'START_DELIBERATION', entity: 'Deliberation', entityId: id, actor });
    return updated;
  }

  private async preloadDecisionsFromLmd(
    deliberationId: string,
    semesterId: string,
    offerId: string,
    actor: AuditActor,
  ) {
    const results = await this.resultModel
      .find({
        semesterId: new Types.ObjectId(semesterId),
        offerId: new Types.ObjectId(offerId),
      })
      .lean()
      .exec();

    for (const result of results) {
      const existingDecision = await this.decisionModel
        .findOne({ deliberationId: new Types.ObjectId(deliberationId), studentId: result.studentId })
        .lean()
        .exec();

      if (!existingDecision) {
        await this.decisionModel.create({
          deliberationId: new Types.ObjectId(deliberationId),
          studentId: result.studentId,
          decision: this.mapStatusToDecision(result.status),
          mention: 'none',
          decidedBy: new Types.ObjectId(actor.userId),
        });
      }
    }
  }

  private mapStatusToDecision(status: string): JuryDecisionType {
    const map: Record<string, JuryDecisionType> = {
      admitted: 'admitted',
      retake:   'retake',
      aap:      'aap',
      excluded: 'excluded',
      pending:  'retake',
    };
    return map[status] ?? 'retake';
  }

  async getDeliberationBoard(id: string) {
    const deliberation = await this.deliberationModel.findById(id).lean().exec();
    if (!deliberation) throw new NotFoundException('Délibération introuvable.');

    const decisions = await this.decisionModel
      .find({ deliberationId: new Types.ObjectId(id) })
      .populate('studentId', 'firstName lastName studentNumber')
      .lean()
      .exec();

    const semesterResults = await this.resultModel
      .find({
        semesterId: deliberation.semesterId,
        offerId: deliberation.offerId,
      })
      .lean()
      .exec();

    const resultMap = new Map(semesterResults.map((r) => [String(r.studentId), r]));

    return decisions.map((d) => ({
      ...d,
      lmdResult: resultMap.get(String(d.studentId)) ?? null,
    }));
  }

  async bulkUpdateDecisions(
    id: string,
    decisions: { studentId: string; decision: JuryDecisionType; mention?: Mention; comment?: string }[],
    actor: AuditActor,
  ) {
    const deliberation = await this.deliberationModel.findById(id).exec();
    if (!deliberation) throw new NotFoundException('Délibération introuvable.');
    if (deliberation.status === 'signed') {
      throw new BadRequestException('Impossible de modifier un PV signé.');
    }

    const results: unknown[] = [];
    for (const d of decisions) {
      const result = await this.decisionModel
        .findOneAndUpdate(
          { deliberationId: new Types.ObjectId(id), studentId: new Types.ObjectId(d.studentId) },
          {
            $set: {
              decision: d.decision,
              mention: d.mention ?? 'none',
              comment: d.comment ?? '',
              decidedBy: new Types.ObjectId(actor.userId),
            },
          },
          { upsert: true, returnDocument: 'after' },
        )
        .exec();
      results.push(result);
    }

    await this.auditLog.log({
      action: 'BULK_UPDATE_DECISIONS',
      entity: 'Deliberation',
      entityId: id,
      actor,
      metadata: { count: decisions.length },
    });

    return results;
  }

  async updateSingleDecision(
    deliberationId: string,
    studentId: string,
    dto: { decision: JuryDecisionType; mention?: Mention; comment?: string },
    actor: AuditActor,
  ) {
    const deliberation = await this.deliberationModel.findById(deliberationId).exec();
    if (!deliberation) throw new NotFoundException('Délibération introuvable.');
    if (deliberation.status === 'signed') {
      throw new BadRequestException('Impossible de modifier un PV signé.');
    }

    const updated = await this.decisionModel
      .findOneAndUpdate(
        { deliberationId: new Types.ObjectId(deliberationId), studentId: new Types.ObjectId(studentId) },
        { $set: { ...dto, decidedBy: new Types.ObjectId(actor.userId) } },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();

    await this.auditLog.log({
      action: 'UPDATE_DECISION',
      entity: 'JuryDecision',
      entityId: String(updated?._id),
      actor,
      metadata: { deliberationId, studentId, decision: dto.decision },
    });

    return updated;
  }

  async closeDeliberation(id: string, actor: AuditActor) {
    const d = await this.deliberationModel.findById(id).exec();
    if (!d) throw new NotFoundException('Délibération introuvable.');
    if (d.status !== 'in_progress') {
      throw new BadRequestException('Seule une délibération en cours peut être clôturée.');
    }

    const updated = await this.deliberationModel
      .findByIdAndUpdate(id, { status: 'completed' }, { returnDocument: 'after' })
      .exec();

    await this.auditLog.log({ action: 'CLOSE_DELIBERATION', entity: 'Deliberation', entityId: id, actor });
    return updated;
  }

  async generatePv(id: string, actor: AuditActor) {
    const deliberation = await this.deliberationModel.findById(id).lean().exec();
    if (!deliberation) throw new NotFoundException('Délibération introuvable.');
    if (!['completed', 'signed'].includes(deliberation.status)) {
      throw new BadRequestException('Le PV ne peut être généré qu\'après clôture de la délibération.');
    }

    const decisions = await this.decisionModel
      .find({ deliberationId: new Types.ObjectId(id) })
      .populate('studentId', 'firstName lastName studentNumber')
      .lean()
      .exec();

    // Génération PDF via pdfkit
    const pvContent = await this.buildPvPdf(deliberation, decisions);
    const pvPath = `uploads/pv/pv-${id}-${Date.now()}.pdf`;

    // En production, sauvegarder le PDF. Ici on retourne les métadonnées.
    await this.deliberationModel.findByIdAndUpdate(id, { pvPath }).exec();

    await this.auditLog.log({
      action: 'GENERATE_PV',
      entity: 'Deliberation',
      entityId: id,
      actor,
      metadata: { pvPath, decisionsCount: decisions.length },
    });

    return { pvPath, decisionsCount: decisions.length, deliberationId: id };
  }

  async signPv(id: string, actor: AuditActor) {
    const deliberation = await this.deliberationModel.findById(id).exec();
    if (!deliberation) throw new NotFoundException('Délibération introuvable.');
    if (deliberation.status === 'signed') {
      throw new BadRequestException('Le PV est déjà signé.');
    }
    if (!deliberation.pvPath) {
      throw new BadRequestException('Générez d\'abord le PV avant de le signer.');
    }

    const updated = await this.deliberationModel
      .findByIdAndUpdate(
        id,
        { status: 'signed', pvSignedAt: new Date() },
        { returnDocument: 'after' },
      )
      .exec();

    // Rendre les résultats définitifs
    await this.resultModel.updateMany(
      { semesterId: deliberation.semesterId, offerId: deliberation.offerId },
      { $set: { isProvisional: false } },
    ).exec();

    await this.auditLog.log({ action: 'SIGN_PV', entity: 'Deliberation', entityId: id, actor });
    return updated;
  }

  async publishResults(id: string, actor: AuditActor) {
    const deliberation = await this.deliberationModel.findById(id).exec();
    if (!deliberation) throw new NotFoundException('Délibération introuvable.');
    if (deliberation.status !== 'signed') {
      throw new BadRequestException('Signez le PV avant de publier les résultats.');
    }

    // Notifier les étudiants
    const students = await this.studentModel
      .find({ offerId: deliberation.offerId })
      .select('email firstName lastName')
      .lean()
      .exec();

    let notified = 0;
    for (const student of students) {
      if (student.email) {
        await this.emailService.sendMail({
          to: student.email,
          subject: 'Vos résultats de délibération sont disponibles — UniConnect',
          text: `Bonjour ${student.firstName} ${student.lastName},\n\nLes résultats de la délibération sont maintenant disponibles sur votre espace étudiant.\n\nCordialement,\nLe service de scolarité`,
        });
        notified++;
      }
    }

    const updated = await this.deliberationModel
      .findByIdAndUpdate(id, { resultsPublishedAt: new Date() }, { returnDocument: 'after' })
      .exec();

    await this.auditLog.log({
      action: 'PUBLISH_RESULTS',
      entity: 'Deliberation',
      entityId: id,
      actor,
      metadata: { notified },
    });

    return { published: true, notified };
  }

  // ─── PDF ──────────────────────────────────────────────────────────────────

  private async buildPvPdf(deliberation: any, decisions: any[]) {
    // Squelette du PV — sera enrichi avec pdfkit en production
    const lines = [
      `PROCÈS-VERBAL DE DÉLIBÉRATION`,
      `Séance du : ${new Date(deliberation.scheduledAt).toLocaleDateString('fr-FR')}`,
      `Semestre : ${deliberation.semesterId}`,
      `Offre : ${deliberation.offerId}`,
      ``,
      `DÉCISIONS DU JURY`,
      `─────────────────`,
      ...decisions.map((d) => {
        const s = d.studentId as any;
        const name = s ? `${s.lastName} ${s.firstName} (${s.studentNumber})` : String(d.studentId);
        return `${name} : ${d.decision.toUpperCase()}${d.mention !== 'none' ? ` — Mention ${d.mention.toUpperCase()}` : ''}`;
      }),
    ];
    return lines.join('\n');
  }
}
