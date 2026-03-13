import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject } from './schemas/subject.schema';
import { Evaluation } from './schemas/evaluation.schema';
import { Grade } from './schemas/grade.schema';
import { NoteClaim, NoteClaimStatus } from './schemas/note-claim.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Group } from '../academic/group.schema';
import { Role } from '../common/roles.enum';
import { AuditActor, AuditLogService } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<Subject>,
    @InjectModel(Evaluation.name)
    private readonly evaluationModel: Model<Evaluation>,
    @InjectModel(Grade.name)
    private readonly gradeModel: Model<Grade>,
    @InjectModel(NoteClaim.name)
    private readonly claimModel: Model<NoteClaim>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<Group>,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
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

  listEvaluations(filter: { groupId?: string; subjectId?: string }) {
    const query: any = {};
    if (filter.groupId) query.groupId = new Types.ObjectId(filter.groupId);
    if (filter.subjectId) query.subjectId = new Types.ObjectId(filter.subjectId);
    return this.evaluationModel.find(query).sort({ date: -1 }).exec();
  }

  async listMyEvaluations(email: string | undefined) {
    if (!email) {
      throw new BadRequestException('Email manquant.');
    }
    const student = await this.studentModel
      .findOne({ email: email.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) {
      throw new BadRequestException('Etudiant introuvable.');
    }
    return this.evaluationModel
      .find({ groupId: student.groupId, isPublished: true })
      .sort({ date: -1 })
      .exec();
  }

  async createEvaluation(data: { title: string; date: string; subjectId: string; groupId: string; maxScore?: number }, actor: AuditActor) {
    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide.');
    }
    const isTeacherOrExternal = actor.role === Role.Teacher || actor.role === Role.External;
    const evaluation = await this.evaluationModel.create({
      ...data,
      date,
      maxScore: data.maxScore ?? 20,
      teacherId: isTeacherOrExternal ? new Types.ObjectId(actor.userId) : null,
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
    const isTeacherOrExternal = actor.role === Role.Teacher || actor.role === Role.External;
    if (isTeacherOrExternal) {
      const existing = await this.evaluationModel.findById(id).lean().exec();
      if (!existing) throw new NotFoundException('Evaluation introuvable.');
      if (String(existing.teacherId) !== actor.userId) {
        throw new ForbiddenException('Accès refusé : cette évaluation ne vous appartient pas.');
      }
      if (existing.isPublished) {
        throw new ForbiddenException('Impossible de modifier une évaluation publiée.');
      }
    }
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
    const isTeacherOrExternal = actor.role === Role.Teacher || actor.role === Role.External;
    if (isTeacherOrExternal && String(evaluation.teacherId) !== actor.userId) {
      throw new ForbiddenException('Accès refusé : cette évaluation ne vous appartient pas.');
    }
    if (evaluation.isPublished) {
      throw new ForbiddenException('Impossible de modifier les notes d\'une évaluation publiée.');
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
    const isStudent = actor.role === Role.Student;
    const evalFilter: any = { groupId: student.groupId };
    if (isStudent) evalFilter.isPublished = true;
    const evaluations = await this.evaluationModel.find(evalFilter).exec();
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

  async createNoteClaim(
    data: { evaluationId: string; reason: string; requestedScore?: number },
    user: { email: string },
  ) {
    const student = await this.studentModel
      .findOne({ email: user.email?.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) {
      throw new NotFoundException('Profil étudiant introuvable.');
    }

    const grade = await this.gradeModel
      .findOne({
        evaluationId: new Types.ObjectId(data.evaluationId),
        studentId: new Types.ObjectId(student._id),
      })
      .lean()
      .exec();
    if (!grade) {
      throw new BadRequestException("Note introuvable pour cette évaluation.");
    }

    const deadlineAt = new Date();
    deadlineAt.setDate(deadlineAt.getDate() + 1);

    const claim = await this.claimModel
      .create({
        studentId: student._id,
        evaluationId: new Types.ObjectId(data.evaluationId),
        reason: data.reason,
        requestedScore: data.requestedScore,
        status: NoteClaimStatus.Pending,
        deadlineAt,
      })
      .catch((err) => {
        if (err?.code === 11000) {
          throw new BadRequestException('Réclamation déjà soumise.');
        }
        throw err;
      });

    if (student.email) {
      this.emailService
        .sendMail({
          to: student.email,
          subject: 'Réclamation de note reçue',
          text: `Votre réclamation pour l'évaluation ${data.evaluationId} a bien été reçue. Délai de traitement: 1 jour.`,
        })
        .catch(() => undefined);
    }

    await this.auditLog.log({
      action: 'notes.claim.create',
      entity: 'note-claim',
      entityId: String(claim._id),
      actor: { userId: String(student._id), email: user.email, role: Role.Student },
      metadata: { evaluationId: data.evaluationId },
    });

    return claim;
  }

  listNoteClaims(filter: { status?: NoteClaimStatus }) {
    const query: any = {};
    if (filter.status) query.status = filter.status;
    return this.claimModel
      .find(query)
      .populate('studentId', 'firstName lastName studentNumber')
      .populate('evaluationId', 'title date')
      .sort({ createdAt: -1 })
      .exec();
  }

  async listMyNoteClaims(user: { email: string }) {
    const student = await this.studentModel
      .findOne({ email: user.email?.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) return [];
    return this.claimModel
      .find({ studentId: new Types.ObjectId(student._id) })
      .populate('evaluationId', 'title date')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateNoteClaim(
    id: string,
    data: { status: NoteClaimStatus; decisionNote?: string },
    actor: AuditActor,
  ) {
    const claim = await this.claimModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: data.status,
            decisionNote: data.decisionNote,
            handledBy: new Types.ObjectId(actor.userId),
            handledAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
    if (!claim) {
      throw new NotFoundException('Réclamation introuvable.');
    }
    const student = await this.studentModel.findById(claim.studentId).lean().exec();
    if (student?.email) {
      this.emailService
        .sendMail({
          to: student.email,
          subject: 'Réclamation de note traitée',
          text: `Votre réclamation est maintenant "${data.status}". ${
            data.decisionNote ? `Décision: ${data.decisionNote}` : ''
          }`,
        })
        .catch(() => undefined);
    }
    await this.auditLog.log({
      action: 'notes.claim.update',
      entity: 'note-claim',
      entityId: String(claim._id),
      actor,
      metadata: { status: data.status },
    });
    return claim;
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

  async publishEvaluation(id: string, actor: AuditActor) {
    const evaluation = await this.evaluationModel.findById(id).lean().exec();
    if (!evaluation) throw new NotFoundException('Evaluation introuvable.');
    if (evaluation.isPublished) throw new BadRequestException('Evaluation déjà publiée.');
    const updated = await this.evaluationModel
      .findByIdAndUpdate(
        id,
        { $set: { isPublished: true, publishedAt: new Date() } },
        { returnDocument: 'after' },
      )
      .exec();
    await this.auditLog.log({
      action: 'notes.evaluation.publish',
      entity: 'evaluation',
      entityId: id,
      actor,
      metadata: { title: evaluation.title, groupId: evaluation.groupId },
    });
    return updated;
  }
}
