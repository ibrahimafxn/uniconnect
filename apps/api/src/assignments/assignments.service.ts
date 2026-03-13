import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment } from './assignment.schema';
import { AssignmentSubmission, SubmissionStatus } from './assignment-submission.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Role } from '../common/roles.enum';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<Assignment>,
    @InjectModel(AssignmentSubmission.name)
    private readonly submissionModel: Model<AssignmentSubmission>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    private readonly auditLog: AuditLogService,
  ) {}

  async listAssignments(params: {
    groupId?: string;
    subjectId?: string;
    user: { role: Role; email?: string; userId: string };
  }) {
    const filter: any = {};
    if (params.user.role === Role.Student) {
      const profile = await this.studentModel
        .findOne({ email: params.user.email?.toLowerCase().trim() })
        .lean()
        .exec();
      if (!profile?.groupId) return [];
      filter.groupId = profile.groupId;
    } else if (params.groupId) {
      filter.groupId = params.groupId;
    }
    if (params.subjectId) filter.subjectId = params.subjectId;
    const assignments = await this.assignmentModel.find(filter).sort({ dueDate: 1 }).lean().exec();
    const ids = assignments.map((a: any) => a._id);
    const counts: { _id: any; count: number }[] = await this.submissionModel.aggregate([
      { $match: { assignmentId: { $in: ids } } },
      { $group: { _id: '$assignmentId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    return assignments.map((a: any) => ({ ...a, submissionCount: countMap.get(String(a._id)) ?? 0 }));
  }

  async createAssignment(
    data: {
      title: string;
      description?: string;
      groupId: string;
      subjectId?: string;
      sessionId?: string;
      dueDate: string;
      createdBy: string;
      originalName?: string;
      fileName?: string;
      path?: string;
      mimeType?: string;
      size?: number;
    },
    actor: AuditActor,
  ) {
    const assignment = await this.assignmentModel.create({
      ...data,
      groupId: new Types.ObjectId(data.groupId),
      subjectId: data.subjectId ? new Types.ObjectId(data.subjectId) : undefined,
      sessionId: data.sessionId ? new Types.ObjectId(data.sessionId) : undefined,
      dueDate: new Date(data.dueDate),
      createdBy: new Types.ObjectId(data.createdBy),
    });
    await this.auditLog.log({
      action: 'assignments.create',
      entity: 'assignment',
      entityId: String(assignment._id),
      actor,
      metadata: { title: assignment.title, groupId: String(assignment.groupId) },
    });
    return assignment;
  }

  async getAssignment(id: string, user: { role: Role; email?: string }) {
    const assignment = await this.assignmentModel.findById(id).exec();
    if (!assignment) throw new NotFoundException('Travail introuvable');
    if (user.role === Role.Student) {
      const profile = await this.studentModel
        .findOne({ email: user.email?.toLowerCase().trim() })
        .lean()
        .exec();
      if (!profile?.groupId || String(profile.groupId) !== String(assignment.groupId)) {
        throw new ForbiddenException('Accès refusé');
      }
    }
    return assignment;
  }

  async submitAssignment(
    assignmentId: string,
    studentEmail: string,
    payload: {
      comment?: string;
      originalName: string;
      fileName: string;
      path: string;
      mimeType: string;
      size: number;
    },
  ) {
    const assignment = await this.assignmentModel.findById(assignmentId).lean().exec();
    if (!assignment) throw new NotFoundException('Travail introuvable');

    const student = await this.studentModel
      .findOne({ email: studentEmail.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) throw new BadRequestException('Profil étudiant introuvable');
    if (String(student.groupId) !== String(assignment.groupId)) {
      throw new ForbiddenException('Accès refusé');
    }

    const isLate = new Date() > new Date(assignment.dueDate);
    const status = isLate ? SubmissionStatus.Late : SubmissionStatus.Submitted;

    return this.submissionModel
      .findOneAndUpdate(
        { assignmentId: new Types.ObjectId(assignmentId), studentId: student._id },
        {
          $set: {
            comment: payload.comment,
            originalName: payload.originalName,
            fileName: payload.fileName,
            path: payload.path,
            mimeType: payload.mimeType,
            size: payload.size,
            status,
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
  }

  listSubmissions(assignmentId: string) {
    return this.submissionModel
      .find({ assignmentId: new Types.ObjectId(assignmentId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getMySubmission(assignmentId: string, studentEmail: string) {
    const student = await this.studentModel
      .findOne({ email: studentEmail.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) throw new BadRequestException('Profil étudiant introuvable');
    return this.submissionModel
      .findOne({ assignmentId: new Types.ObjectId(assignmentId), studentId: student._id })
      .exec();
  }

  async updateSubmission(
    submissionId: string,
    data: { status?: SubmissionStatus; score?: number; feedback?: string },
    actor: AuditActor,
  ) {
    const submission = await this.submissionModel
      .findByIdAndUpdate(submissionId, data, { returnDocument: 'after' })
      .exec();
    if (submission) {
      await this.auditLog.log({
        action: 'assignments.submission.update',
        entity: 'assignmentSubmission',
        entityId: String(submission._id),
        actor,
        metadata: data,
      });
    }
    return submission;
  }

  async updateAssignment(
    id: string,
    data: { title?: string; description?: string; groupId?: string; subjectId?: string; dueDate?: string },
    actor: AuditActor,
  ) {
    if (data.groupId) {
      const submissionCount = await this.submissionModel.countDocuments({ assignmentId: new Types.ObjectId(id) }).exec();
      if (submissionCount > 0) {
        throw new BadRequestException('Le groupe ne peut pas être modifié une fois que des soumissions existent.');
      }
    }
    const update: any = { ...data };
    if (data.groupId) update.groupId = new Types.ObjectId(data.groupId);
    if (data.subjectId) update.subjectId = new Types.ObjectId(data.subjectId);
    if (data.dueDate) update.dueDate = new Date(data.dueDate);
    const assignment = await this.assignmentModel
      .findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' })
      .exec();
    if (!assignment) throw new NotFoundException('Devoir introuvable');
    await this.auditLog.log({
      action: 'assignments.update',
      entity: 'assignment',
      entityId: String(assignment._id),
      actor,
      metadata: data,
    });
    return assignment;
  }

  async deleteAssignment(id: string, actor: AuditActor) {
    const submissionCount = await this.submissionModel.countDocuments({ assignmentId: new Types.ObjectId(id) }).exec();
    if (submissionCount > 0) {
      throw new BadRequestException('Impossible de supprimer un devoir qui a déjà des soumissions.');
    }
    const assignment = await this.assignmentModel.findByIdAndDelete(id).exec();
    if (!assignment) throw new NotFoundException('Devoir introuvable');
    await this.submissionModel.deleteMany({ assignmentId: new Types.ObjectId(id) }).exec();
    await this.auditLog.log({
      action: 'assignments.delete',
      entity: 'assignment',
      entityId: id,
      actor,
      metadata: { title: assignment.title },
    });
    return { deleted: true };
  }

  async getSubmissionById(id: string, user: { role: Role; email?: string }) {
    const submission = await this.submissionModel.findById(id).exec();
    if (!submission) throw new NotFoundException('Soumission introuvable');
    if (user.role === Role.Student) {
      const student = await this.studentModel
        .findOne({ email: user.email?.toLowerCase().trim() })
        .lean()
        .exec();
      if (!student || String(student._id) !== String(submission.studentId)) {
        throw new ForbiddenException('Accès refusé');
      }
    }
    return submission;
  }
}
