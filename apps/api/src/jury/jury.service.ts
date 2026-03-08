import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JuryDecision } from './jury-decision.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Group } from '../academic/group.schema';
import { AuditActor, AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class JuryService {
  constructor(
    @InjectModel(JuryDecision.name)
    private readonly juryModel: Model<JuryDecision>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<Group>,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Lister les décisions de jury pour une session de délibération */
  listDecisions(filter: { session?: string; groupId?: string }) {
    const query: any = {};
    if (filter.session) query.session = filter.session;
    if (filter.groupId) query.groupId = new Types.ObjectId(filter.groupId);
    return this.juryModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /** Préparer la feuille de délibération pour un groupe */
  async prepareJurySheet(groupId: string) {
    const group = await this.groupModel.findById(groupId).lean().exec();
    if (!group) throw new BadRequestException('Groupe introuvable.');

    const students = await this.studentModel
      .find({ groupId: new Types.ObjectId(groupId) })
      .sort({ lastName: 1, firstName: 1 })
      .lean()
      .exec();

    return { group, students };
  }

  /** Enregistrer ou mettre à jour une décision */
  async upsertDecision(
    data: {
      studentId: string;
      groupId: string;
      session: string;
      decision: string;
      overallAverage?: number;
      ectsObtained?: number;
      mention?: string;
      comment?: string;
    },
    actor: AuditActor,
  ) {
    const validDecisions = ['admis', 'ajourne', 'redoublant', 'admis_avec_dettes'];
    if (!validDecisions.includes(data.decision)) {
      throw new BadRequestException('Décision invalide.');
    }

    const mention = this.computeMention(data.overallAverage);

    const decision = await this.juryModel.findOneAndUpdate(
      { studentId: new Types.ObjectId(data.studentId), session: data.session },
      {
        $set: {
          groupId: new Types.ObjectId(data.groupId),
          decision: data.decision,
          overallAverage: data.overallAverage,
          ectsObtained: data.ectsObtained ?? 0,
          mention: data.mention ?? mention,
          comment: data.comment,
          validatedBy: new Types.ObjectId(actor.userId),
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).exec();

    await this.auditLog.log({
      action: 'jury.decision.upsert',
      entity: 'juryDecision',
      entityId: String(decision?._id),
      actor,
      metadata: { studentId: data.studentId, decision: data.decision, session: data.session },
    });

    return decision;
  }

  /** Délibération en masse pour un groupe */
  async bulkUpsert(
    entries: Array<{
      studentId: string;
      decision: string;
      overallAverage?: number;
      ectsObtained?: number;
      comment?: string;
    }>,
    groupId: string,
    session: string,
    actor: AuditActor,
  ) {
    const ops = entries.map((e) =>
      this.upsertDecision({ ...e, groupId, session }, actor),
    );
    return Promise.all(ops);
  }

  private computeMention(avg: number | undefined): string | null {
    if (!avg) return null;
    if (avg >= 16) return 'tres_bien';
    if (avg >= 14) return 'bien';
    if (avg >= 12) return 'assez_bien';
    if (avg >= 10) return 'passable';
    return null;
  }
}
