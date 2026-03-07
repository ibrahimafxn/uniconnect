import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject } from './schemas/subject.schema';
import { Evaluation } from './schemas/evaluation.schema';
import { Grade } from './schemas/grade.schema';
import { UE } from './schemas/ue.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Group } from '../academic/group.schema';
import { Role } from '../common/roles.enum';
import { AuditActor, AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<Subject>,
    @InjectModel(Evaluation.name)
    private readonly evaluationModel: Model<Evaluation>,
    @InjectModel(Grade.name)
    private readonly gradeModel: Model<Grade>,
    @InjectModel(UE.name)
    private readonly ueModel: Model<UE>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<Group>,
    private readonly auditLog: AuditLogService,
  ) {}

  // ==================== UE (Unités d'Enseignement) ====================

  listUE(levelId?: string, semesterId?: string) {
    const filter: any = {};
    if (levelId) filter.levelId = new Types.ObjectId(levelId);
    if (semesterId) filter.semesterId = new Types.ObjectId(semesterId);
    return this.ueModel.find(filter).sort({ name: 1 }).exec();
  }

  async createUE(
    data: { name: string; code?: string; ects: number; levelId: string; semesterId?: string },
    actor: AuditActor,
  ) {
    const ue = await this.ueModel.create(data);
    await this.auditLog.log({
      action: 'notes.ue.create',
      entity: 'ue',
      entityId: String(ue._id),
      actor,
      metadata: { name: ue.name, ects: ue.ects, levelId: ue.levelId },
    });
    return ue;
  }

  async updateUE(id: string, data: Partial<UE>, actor: AuditActor) {
    const ue = await this.ueModel.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
    if (ue) {
      await this.auditLog.log({
        action: 'notes.ue.update',
        entity: 'ue',
        entityId: String(ue._id),
        actor,
        metadata: data,
      });
    }
    return ue;
  }

  async deleteUE(id: string, actor: AuditActor) {
    const ue = await this.ueModel.findByIdAndDelete(id).exec();
    if (ue) {
      await this.auditLog.log({
        action: 'notes.ue.delete',
        entity: 'ue',
        entityId: String(ue._id),
        actor,
        metadata: { name: ue.name },
      });
    }
    return ue;
  }

  // ==================== Subjects (ECUE) ====================

  listSubjects(levelId?: string, ueId?: string) {
    const filter: any = {};
    if (ueId) filter.ueId = new Types.ObjectId(ueId);
    else if (levelId) filter.levelId = new Types.ObjectId(levelId);
    return this.subjectModel.find(filter).sort({ name: 1 }).exec();
  }

  async createSubject(
    data: { name: string; code?: string; coefficient: number; levelId: string; ueId?: string },
    actor: AuditActor,
  ) {
    const subject = await this.subjectModel.create(data);
    await this.auditLog.log({
      action: 'notes.subject.create',
      entity: 'subject',
      entityId: String(subject._id),
      actor,
      metadata: { name: subject.name, coefficient: subject.coefficient, levelId: subject.levelId },
    });
    return subject;
  }

  async updateSubject(id: string, data: Partial<Subject>, actor: AuditActor) {
    const subject = await this.subjectModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
    if (subject) {
      await this.auditLog.log({
        action: 'notes.subject.update',
        entity: 'subject',
        entityId: String(subject._id),
        actor,
        metadata: data,
      });
    }
    return subject;
  }

  async deleteSubject(id: string, actor: AuditActor) {
    const subject = await this.subjectModel.findByIdAndDelete(id).exec();
    if (subject) {
      await this.auditLog.log({
        action: 'notes.subject.delete',
        entity: 'subject',
        entityId: String(subject._id),
        actor,
        metadata: { name: subject.name },
      });
    }
    return subject;
  }

  // ==================== Evaluations ====================

  listEvaluations(filter: { groupId?: string; subjectId?: string }) {
    const query: any = {};
    if (filter.groupId) query.groupId = new Types.ObjectId(filter.groupId);
    if (filter.subjectId) query.subjectId = new Types.ObjectId(filter.subjectId);
    return this.evaluationModel.find(query).sort({ date: -1 }).exec();
  }

  async createEvaluation(
    data: { title: string; date: string; subjectId: string; groupId: string; maxScore?: number },
    actor: AuditActor,
  ) {
    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide.');
    }
    const evaluation = await this.evaluationModel.create({
      ...data,
      date,
      maxScore: data.maxScore ?? 20,
    });
    await this.auditLog.log({
      action: 'notes.evaluation.create',
      entity: 'evaluation',
      entityId: String(evaluation._id),
      actor,
      metadata: { title: evaluation.title, subjectId: evaluation.subjectId, groupId: evaluation.groupId },
    });
    return evaluation;
  }

  async updateEvaluation(id: string, data: Partial<Evaluation> & { date?: string }, actor: AuditActor) {
    const payload: any = { ...data };
    if (data.date) {
      const date = new Date(data.date);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException('Date invalide.');
      }
      payload.date = date;
    }
    const evaluation = await this.evaluationModel
      .findByIdAndUpdate(id, payload, { returnDocument: 'after' })
      .exec();
    if (evaluation) {
      await this.auditLog.log({
        action: 'notes.evaluation.update',
        entity: 'evaluation',
        entityId: String(evaluation._id),
        actor,
        metadata: payload,
      });
    }
    return evaluation;
  }

  async listGroupStudents(groupId: string) {
    return this.studentModel
      .find({ groupId: new Types.ObjectId(groupId) })
      .sort({ lastName: 1, firstName: 1 })
      .exec();
  }

  async listGrades(evaluationId: string) {
    return this.gradeModel
      .find({ evaluationId: new Types.ObjectId(evaluationId) })
      .exec();
  }

  async upsertGrades(
    evaluationId: string,
    grades: Array<{ studentId: string; score: number; comment?: string }>,
    actor: AuditActor,
  ) {
    const evaluation = await this.evaluationModel.findById(evaluationId).lean().exec();
    if (!evaluation) {
      throw new BadRequestException('Evaluation introuvable.');
    }
    const maxScore = evaluation.maxScore ?? 20;
    grades.forEach((g) => {
      if (g.score < 0 || g.score > maxScore) {
        throw new BadRequestException('Score invalide.');
      }
    });

    const ops = grades.map((g) => ({
      updateOne: {
        filter: { evaluationId: new Types.ObjectId(evaluationId), studentId: new Types.ObjectId(g.studentId) },
        update: { $set: { score: g.score, comment: g.comment } },
        upsert: true,
      },
    }));

    await this.gradeModel.bulkWrite(ops);
    await this.auditLog.log({
      action: 'notes.grades.upsert',
      entity: 'evaluation',
      entityId: String(evaluationId),
      actor,
      metadata: { count: grades.length },
    });
    return { success: true };
  }

  // ==================== Résumé étudiant (calcul LMD) ====================

  async getStudentSummary(
    studentId: string,
    actor: { userId: string; role: Role; email?: string },
  ) {
    if (actor.role === Role.Student) {
      const profile = await this.studentModel
        .findOne({ email: actor.email?.toLowerCase().trim() })
        .lean()
        .exec();
      if (!profile || String(profile._id) !== studentId) {
        throw new ForbiddenException('Accès refusé.');
      }
    }

    const student = await this.studentModel.findById(studentId).lean().exec();
    if (!student) {
      throw new BadRequestException('Etudiant introuvable.');
    }

    const group = await this.groupModel.findById(student.groupId).lean().exec();
    if (!group) {
      throw new BadRequestException('Groupe introuvable.');
    }

    // UE du niveau
    const ues = await this.ueModel.find({ levelId: group.levelId }).lean().exec();

    // ECUE (matières) du niveau
    const subjects = await this.subjectModel.find({ levelId: group.levelId }).lean().exec();

    const evaluations = await this.evaluationModel.find({ groupId: student.groupId }).lean().exec();
    const evaluationIds = evaluations.map((e) => e._id);
    const grades = await this.gradeModel
      .find({ studentId: new Types.ObjectId(studentId), evaluationId: { $in: evaluationIds } })
      .lean()
      .exec();

    // Calcul de la moyenne par ECUE (matière)
    const ecueAverages = subjects.map((subject) => {
      const subjectEvals = evaluations.filter((e) => String(e.subjectId) === String(subject._id));
      const subjectGrades = subjectEvals.flatMap((e) =>
        grades
          .filter((g) => String(g.evaluationId) === String(e._id))
          .map((g) => ({ score: g.score, maxScore: e.maxScore ?? 20 })),
      );

      if (subjectGrades.length === 0) {
        return {
          subjectId: subject._id,
          name: subject.name,
          code: subject.code,
          coefficient: subject.coefficient,
          ueId: subject.ueId ? String(subject.ueId) : null,
          average: null as number | null,
        };
      }

      const normalizedScores = subjectGrades.map((g) => (g.score / g.maxScore) * 20);
      const avg = normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length;
      return {
        subjectId: subject._id,
        name: subject.name,
        code: subject.code,
        coefficient: subject.coefficient,
        ueId: subject.ueId ? String(subject.ueId) : null,
        average: avg,
      };
    });

    // Calcul par UE avec pondération par crédits ECTS
    const ueSummaries = ues.map((ue) => {
      const ueEcues = ecueAverages.filter((s) => s.ueId === String(ue._id));
      const scored = ueEcues.filter((s) => s.average !== null);

      let ueAverage: number | null = null;
      if (scored.length > 0) {
        const totalCoeff = scored.reduce((acc, s) => acc + s.coefficient, 0);
        ueAverage = totalCoeff
          ? scored.reduce((acc, s) => acc + (s.average as number) * s.coefficient, 0) / totalCoeff
          : null;
      }

      return {
        ueId: ue._id,
        name: ue.name,
        code: ue.code,
        ects: ue.ects,
        validated: ueAverage !== null && ueAverage >= 10,
        average: ueAverage,
        ecues: ueEcues,
      };
    });

    // ECUE sans UE (mode sans structure LMD — compatibilité ascendante)
    const orphanSubjects = ecueAverages.filter((s) => !s.ueId);

    // Moyenne générale : pondérée par ECTS si des UE existent, sinon par coefficient
    const uesWithGrade = ueSummaries.filter((u) => u.average !== null);
    const totalEcts = uesWithGrade.reduce((acc, u) => acc + u.ects, 0);

    const ectsWeighted = totalEcts
      ? uesWithGrade.reduce((acc, u) => acc + (u.average as number) * u.ects, 0) / totalEcts
      : null;

    const orphanWeighted = (() => {
      const scored = orphanSubjects.filter((s) => s.average !== null);
      const totalCoeff = scored.reduce((acc, s) => acc + s.coefficient, 0);
      return totalCoeff
        ? scored.reduce((acc, s) => acc + (s.average as number) * s.coefficient, 0) / totalCoeff
        : null;
    })();

    const overall = ectsWeighted ?? orphanWeighted;

    return {
      student: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentNumber: student.studentNumber,
      },
      group,
      ues: ueSummaries,
      subjects: orphanSubjects,
      allSubjects: ecueAverages,
      overallAverage: overall,
    };
  }

  async getStudentSummaryForEmail(
    email: string | undefined,
    actor: { userId: string; role: Role; email?: string },
  ) {
    if (!email) {
      throw new BadRequestException('Email manquant.');
    }
    const profile = await this.studentModel
      .findOne({ email: email.toLowerCase().trim() })
      .lean()
      .exec();
    if (!profile) {
      throw new BadRequestException('Etudiant introuvable.');
    }
    return this.getStudentSummary(String(profile._id), actor);
  }

  async buildEvaluationExport(evaluationId: string) {
    const evaluation = await this.evaluationModel.findById(evaluationId).lean().exec();
    if (!evaluation) throw new Error('Evaluation introuvable.');

    const subject = await this.subjectModel.findById(evaluation.subjectId).lean().exec();
    const group = await this.groupModel.findById(evaluation.groupId).lean().exec();

    const students = await this.studentModel
      .find({ groupId: evaluation.groupId })
      .sort({ lastName: 1, firstName: 1 })
      .lean()
      .exec();

    const grades = await this.gradeModel
      .find({ evaluationId: new Types.ObjectId(evaluationId) })
      .lean()
      .exec();

    const rows = students.map((s) => {
      const grade = grades.find((g) => String(g.studentId) === String(s._id));
      return {
        studentNumber: s.studentNumber,
        lastName: s.lastName,
        firstName: s.firstName,
        score: grade?.score ?? null,
        comment: grade?.comment ?? '',
      };
    });

    return { evaluation, subject, group, rows };
  }
}
