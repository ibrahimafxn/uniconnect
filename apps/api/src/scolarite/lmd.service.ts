import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LmdConfig } from './schemas/lmd-config.schema';
import { EvaluationPeriod } from './schemas/evaluation-period.schema';
import { SemesterResult, StudentDecision } from './schemas/semester-result.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';
import { Subject } from '../notes/schemas/subject.schema';
import { Evaluation } from '../notes/schemas/evaluation.schema';
import { Grade } from '../notes/schemas/grade.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { User } from '../users/user.schema';
import { Group } from '../academic/group.schema';

@Injectable()
export class LmdService {
  constructor(
    @InjectModel(LmdConfig.name)
    private readonly configModel: Model<LmdConfig>,
    @InjectModel(EvaluationPeriod.name)
    private readonly periodModel: Model<EvaluationPeriod>,
    @InjectModel(SemesterResult.name)
    private readonly resultModel: Model<SemesterResult>,
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<Subject>,
    @InjectModel(Evaluation.name)
    private readonly evaluationModel: Model<Evaluation>,
    @InjectModel(Grade.name)
    private readonly gradeModel: Model<Grade>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<Group>,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Configuration LMD ───────────────────────────────────────────────────

  async getConfig(offerId: string) {
    const config = await this.configModel.findOne({ offerId: new Types.ObjectId(offerId) }).exec();
    if (!config) throw new NotFoundException('Configuration LMD introuvable pour cette offre.');
    return config;
  }

  async upsertConfig(
    offerId: string,
    dto: {
      compensationEnabled?: boolean;
      compensationMinAverage?: number;
      passThreshold?: number;
      retakeThreshold?: number;
      ectsPerSemester?: number;
      aapEnabled?: boolean;
      aapMaxDebts?: number;
      ue?: { name: string; subjectIds: string[]; ectsCredits: number }[];
    },
    actor: AuditActor,
  ) {
    const payload: any = { ...dto };
    if (dto.ue) {
      payload.ue = dto.ue.map((u) => ({
        ...u,
        subjectIds: u.subjectIds.map((id) => new Types.ObjectId(id)),
      }));
    }

    const config = await this.configModel
      .findOneAndUpdate(
        { offerId: new Types.ObjectId(offerId) },
        { $set: { ...payload, offerId: new Types.ObjectId(offerId) } },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();

    await this.auditLog.log({
      action: 'UPSERT_LMD_CONFIG',
      entity: 'LmdConfig',
      entityId: String(config._id),
      actor,
      metadata: { offerId },
    });

    return config;
  }

  // ─── Périodes d'évaluation ────────────────────────────────────────────────

  async listPeriods(params: { semesterId?: string; offerId?: string; skip: number; limit: number }) {
    const filter: Record<string, any> = {};
    if (params.semesterId) filter.semesterId = new Types.ObjectId(params.semesterId);
    if (params.offerId) filter.offerId = new Types.ObjectId(params.offerId);

    const [items, total] = await Promise.all([
      this.periodModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.periodModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async createPeriod(
    dto: { semesterId: string; offerId: string; gradeDeadline: string },
    actor: AuditActor,
  ) {
    const existing = await this.periodModel
      .findOne({
        semesterId: new Types.ObjectId(dto.semesterId),
        offerId: new Types.ObjectId(dto.offerId),
      })
      .exec();
    if (existing) {
      throw new BadRequestException('Une période existe déjà pour ce semestre et cette offre.');
    }

    const period = await this.periodModel.create({
      semesterId: new Types.ObjectId(dto.semesterId),
      offerId: new Types.ObjectId(dto.offerId),
      gradeDeadline: new Date(dto.gradeDeadline),
      status: 'open',
    });

    await this.auditLog.log({
      action: 'CREATE_EVALUATION_PERIOD',
      entity: 'EvaluationPeriod',
      entityId: String(period._id),
      actor,
      metadata: dto,
    });

    return period;
  }

  async lockPeriod(id: string, actor: AuditActor) {
    const period = await this.periodModel.findById(id).exec();
    if (!period) throw new NotFoundException('Période introuvable.');
    if (period.status !== 'open') {
      throw new BadRequestException('Seule une période ouverte peut être verrouillée.');
    }

    const updated = await this.periodModel
      .findByIdAndUpdate(
        id,
        { status: 'locked', lockedAt: new Date(), lockedBy: new Types.ObjectId(actor.userId) },
        { returnDocument: 'after' },
      )
      .exec();

    await this.auditLog.log({
      action: 'LOCK_EVALUATION_PERIOD',
      entity: 'EvaluationPeriod',
      entityId: id,
      actor,
    });

    return updated;
  }

  async remindTeachers(id: string, actor: AuditActor) {
    const period = await this.periodModel.findById(id).exec();
    if (!period) throw new NotFoundException('Période introuvable.');
    if (period.status !== 'open') {
      throw new BadRequestException('Les relances ne sont possibles que sur une période ouverte.');
    }

    const completion = await this.getPeriodCompletion(id);
    const missing = completion.filter((c) => c.completionRate < 100);

    let notified = 0;
    for (const item of missing) {
      if (item.teacherEmail) {
        await this.emailService.sendMail({
          to: item.teacherEmail,
          subject: 'Rappel — Saisie des notes en attente — UniConnect',
          text: `Bonjour,\n\nVous avez des notes à saisir avant le ${period.gradeDeadline.toLocaleDateString('fr-FR')}.\nMatières en attente : ${item.pendingSubjects.join(', ')}.\n\nMerci,\nLe service de scolarité`,
        });
        notified++;
      }
    }

    await this.periodModel
      .findByIdAndUpdate(id, { $push: { remindersSentAt: new Date() } })
      .exec();

    await this.auditLog.log({
      action: 'REMIND_TEACHERS',
      entity: 'EvaluationPeriod',
      entityId: id,
      actor,
      metadata: { notified },
    });

    return { notified, missingTeachers: missing.length };
  }

  async getPeriodCompletion(periodId: string) {
    const period = await this.periodModel.findById(periodId).lean().exec();
    if (!period) throw new NotFoundException('Période introuvable.');

    // Récupérer les groupes de l'offre
    const groups = await this.groupModel
      .find({ offerId: period.offerId })
      .lean()
      .exec();

    const result: {
      teacherId: string;
      teacherEmail?: string;
      pendingSubjects: string[];
      completionRate: number;
    }[] = [];

    for (const group of groups) {
      const evaluations = await this.evaluationModel
        .find({ groupId: group._id })
        .populate('subjectId', 'name')
        .lean()
        .exec();

      for (const evaluation of evaluations) {
        const studentsInGroup = await this.studentModel
          .countDocuments({ groupId: group._id })
          .exec();

        const gradesCount = await this.gradeModel
          .countDocuments({ evaluationId: evaluation._id })
          .exec();

        const completionRate =
          studentsInGroup > 0
            ? Math.round((gradesCount / studentsInGroup) * 100)
            : 100;

        if (completionRate < 100) {
          result.push({
            teacherId: '',
            pendingSubjects: [(evaluation.subjectId as any)?.name ?? 'Matière inconnue'],
            completionRate,
          });
        }
      }
    }

    return result;
  }

  // ─── Moteur LMD ───────────────────────────────────────────────────────────

  async calculateResults(
    semesterId: string,
    offerId: string,
    actor: AuditActor,
  ) {
    const config = await this.configModel
      .findOne({ offerId: new Types.ObjectId(offerId) })
      .lean()
      .exec();

    if (!config) {
      throw new BadRequestException(
        'Configuration LMD manquante pour cette offre. Configurez-la avant de lancer le calcul.',
      );
    }

    const groups = await this.groupModel
      .find({ offerId: new Types.ObjectId(offerId) })
      .lean()
      .exec();

    const students = await this.studentModel
      .find({ offerId: new Types.ObjectId(offerId) })
      .lean()
      .exec();

    const results: SemesterResult[] = [];

    for (const student of students) {
      const result = await this.calculateStudentResult({
        studentId: String(student._id),
        semesterId,
        offerId,
        config,
      });
      results.push(result);
    }

    await this.auditLog.log({
      action: 'CALCULATE_LMD_RESULTS',
      entity: 'SemesterResult',
      entityId: semesterId,
      actor,
      metadata: { semesterId, offerId, studentsProcessed: results.length },
    });

    return {
      semesterId,
      offerId,
      studentsProcessed: results.length,
      summary: this.buildSummary(results),
    };
  }

  private async calculateStudentResult(params: {
    studentId: string;
    semesterId: string;
    offerId: string;
    config: any;
  }) {
    const { studentId, semesterId, offerId, config } = params;

    // Récupérer l'étudiant pour trouver son groupe
    const student = await this.studentModel.findById(studentId).lean().exec();
    if (!student) throw new NotFoundException(`Étudiant ${studentId} introuvable.`);

    // Récupérer toutes les évaluations du groupe de l'étudiant
    const evaluations = await this.evaluationModel
      .find({ groupId: student.groupId })
      .populate('subjectId')
      .lean()
      .exec();

    // Récupérer toutes les notes de l'étudiant
    const grades = await this.gradeModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .lean()
      .exec();

    const gradeMap = new Map<string, number>();
    for (const g of grades) {
      gradeMap.set(String(g.evaluationId), g.score);
    }

    // Calculer la moyenne par matière
    const subjectAverages = new Map<string, { average: number; coefficient: number; name: string }>();
    for (const evaluation of evaluations) {
      const subject = evaluation.subjectId as any;
      if (!subject) continue;
      const subjectId = String(subject._id);
      const score = gradeMap.get(String(evaluation._id));
      if (score === undefined) continue;

      const normalized = evaluation.maxScore > 0 ? (score / evaluation.maxScore) * 20 : 0;

      if (!subjectAverages.has(subjectId)) {
        subjectAverages.set(subjectId, { average: 0, coefficient: subject.coefficient ?? 1, name: subject.name });
      }
      const current = subjectAverages.get(subjectId)!;
      // Simple mean per subject (multiple evaluations averaged)
      current.average = (current.average + normalized) / 2;
    }

    // Calculer les résultats par UE
    const ueResults = this.calculateUeResults(config.ue ?? [], subjectAverages, config);

    // Moyenne générale pondérée
    let weightedSum = 0;
    let totalCoeff = 0;
    for (const [, { average, coefficient }] of subjectAverages) {
      weightedSum += average * coefficient;
      totalCoeff += coefficient;
    }
    const semesterAverage = totalCoeff > 0 ? Math.round((weightedSum / totalCoeff) * 100) / 100 : 0;

    // ECTS validés
    const ectsValidated = ueResults.reduce((acc, ue) => acc + (ue.validated ? ue.ects : 0), 0);

    // Décision
    const decision = this.determineDecision(semesterAverage, ueResults, config);

    // Upsert du résultat
    const result = await this.resultModel
      .findOneAndUpdate(
        {
          studentId: new Types.ObjectId(studentId),
          semesterId: new Types.ObjectId(semesterId),
          offerId: new Types.ObjectId(offerId),
        },
        {
          $set: {
            ueResults,
            semesterAverage,
            ectsValidated,
            status: decision,
            compensated: this.wasCompensated(ueResults, config),
            isProvisional: true,
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();

    return result!;
  }

  private calculateUeResults(
    ueDefinitions: any[],
    subjectAverages: Map<string, { average: number; coefficient: number; name: string }>,
    config: any,
  ) {
    if (!ueDefinitions.length) {
      // Pas d'UE définies — on considère une seule UE globale
      const avg =
        [...subjectAverages.values()].reduce((s, { average }) => s + average, 0) /
        (subjectAverages.size || 1);
      return [{ ueName: 'UE Globale', average: Math.round(avg * 100) / 100, ects: config.ectsPerSemester, validated: avg >= config.passThreshold }];
    }

    return ueDefinitions.map((ue) => {
      const subjectIds = ue.subjectIds.map(String);
      const subjectsInUe = [...subjectAverages.entries()]
        .filter(([id]) => subjectIds.includes(id))
        .map(([, v]) => v);

      const totalCoeff = subjectsInUe.reduce((s, { coefficient }) => s + coefficient, 0);
      const weightedSum = subjectsInUe.reduce((s, { average, coefficient }) => s + average * coefficient, 0);
      const average = totalCoeff > 0 ? Math.round((weightedSum / totalCoeff) * 100) / 100 : 0;

      let validated = average >= config.passThreshold;

      // Compensation inter-UE
      if (!validated && config.compensationEnabled && average >= config.compensationMinAverage) {
        validated = true; // sera confirmé au niveau global après
      }

      return { ueName: ue.name, average, ects: ue.ectsCredits, validated };
    });
  }

  private wasCompensated(ueResults: any[], config: any): boolean {
    if (!config.compensationEnabled) return false;
    return ueResults.some((ue) => !ue.validated && ue.average >= config.compensationMinAverage);
  }

  private determineDecision(
    semesterAverage: number,
    ueResults: any[],
    config: any,
  ): StudentDecision {
    if (semesterAverage >= config.passThreshold) return 'admitted';

    const debtCount = ueResults.filter((ue) => ue.average < config.passThreshold).length;

    if (config.aapEnabled && debtCount <= config.aapMaxDebts && semesterAverage >= config.retakeThreshold) {
      return 'aap';
    }

    if (semesterAverage >= config.retakeThreshold) return 'retake';

    return 'excluded';
  }

  // ─── Résultats ────────────────────────────────────────────────────────────

  async listResults(params: {
    semesterId: string;
    offerId?: string;
    status?: string;
    skip: number;
    limit: number;
  }) {
    const filter: Record<string, any> = {
      semesterId: new Types.ObjectId(params.semesterId),
    };
    if (params.offerId) filter.offerId = new Types.ObjectId(params.offerId);
    if (params.status) filter.status = params.status;

    const [items, total] = await Promise.all([
      this.resultModel
        .find(filter)
        .populate('studentId', 'firstName lastName studentNumber')
        .sort({ semesterAverage: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.resultModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async getStudentResult(semesterId: string, studentId: string) {
    const result = await this.resultModel
      .findOne({
        semesterId: new Types.ObjectId(semesterId),
        studentId: new Types.ObjectId(studentId),
      })
      .populate('studentId', 'firstName lastName studentNumber')
      .exec();
    if (!result) throw new NotFoundException('Résultat introuvable pour cet étudiant.');
    return result;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildSummary(results: any[]) {
    const counts: Record<string, number> = { admitted: 0, retake: 0, aap: 0, excluded: 0, pending: 0 };
    let totalAverage = 0;
    for (const r of results) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
      totalAverage += r.semesterAverage ?? 0;
    }
    return {
      total: results.length,
      admittedRate: results.length > 0 ? Math.round((counts.admitted / results.length) * 100) : 0,
      classAverage: results.length > 0 ? Math.round((totalAverage / results.length) * 100) / 100 : 0,
      byStatus: counts,
    };
  }
}
