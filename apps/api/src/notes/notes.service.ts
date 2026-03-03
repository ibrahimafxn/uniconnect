import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject } from './schemas/subject.schema';
import { Evaluation } from './schemas/evaluation.schema';
import { Grade } from './schemas/grade.schema';
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
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<Group>,
    private readonly auditLog: AuditLogService,
  ) {}

  listSubjects(levelId?: string) {
    const filter = levelId ? { levelId: new Types.ObjectId(levelId) } : {};
    return this.subjectModel.find(filter).sort({ name: 1 }).exec();
  }

  async createSubject(data: { name: string; code?: string; coefficient: number; levelId: string }, actor: AuditActor) {
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
    const subject = await this.subjectModel.findByIdAndUpdate(id, data, { new: true }).exec();
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

  listEvaluations(filter: { groupId?: string; subjectId?: string }) {
    const query: any = {};
    if (filter.groupId) query.groupId = new Types.ObjectId(filter.groupId);
    if (filter.subjectId) query.subjectId = new Types.ObjectId(filter.subjectId);
    return this.evaluationModel.find(query).sort({ date: -1 }).exec();
  }

  async createEvaluation(data: { title: string; date: string; subjectId: string; groupId: string; maxScore?: number }, actor: AuditActor) {
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
    const evaluation = await this.evaluationModel.findByIdAndUpdate(id, payload, { new: true }).exec();
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

    const subjects = await this.subjectModel.find({ levelId: group.levelId }).exec();
    const evaluations = await this.evaluationModel.find({ groupId: student.groupId }).exec();
    const evaluationIds = evaluations.map((e) => e._id);
    const grades = await this.gradeModel
      .find({ studentId: new Types.ObjectId(studentId), evaluationId: { $in: evaluationIds } })
      .lean()
      .exec();

    const subjectAverages = subjects.map((subject) => {
      const subjectEvaluations = evaluations.filter((e) => String(e.subjectId) === String(subject._id));
      const subjectGrades = subjectEvaluations.flatMap((e) =>
        grades.filter((g) => String(g.evaluationId) === String(e._id)).map((g) => ({
          score: g.score,
          maxScore: e.maxScore ?? 20,
        })),
      );

      if (subjectGrades.length === 0) {
        return { subjectId: subject._id, name: subject.name, coefficient: subject.coefficient, average: null };
      }

      const normalizedScores = subjectGrades.map((g) => (g.score / g.maxScore) * 20);
      const avg = normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length;
      return { subjectId: subject._id, name: subject.name, coefficient: subject.coefficient, average: avg };
    });

    const weighted = subjectAverages.filter((s) => s.average !== null);
    const totalCoeff = weighted.reduce((acc, s) => acc + s.coefficient, 0);
    const overall = totalCoeff
      ? weighted.reduce((acc, s) => acc + (s.average as number) * s.coefficient, 0) / totalCoeff
      : null;

    return {
      student: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentNumber: student.studentNumber,
      },
      group,
      subjects: subjectAverages,
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
}
