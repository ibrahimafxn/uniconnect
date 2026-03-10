import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceStatus } from './attendance.schema';
import { AbsenceJustification, AbsenceJustificationStatus } from './absence-justification.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Session } from '../planning/session.schema';
import { AuditActor, AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(AbsenceJustification.name)
    private readonly justificationModel: Model<AbsenceJustification>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<Session>,
    private readonly auditLog: AuditLogService,
  ) {}

  async getSessionAttendance(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId).lean().exec();
    if (!session) return [];

    const students = await this.studentModel
      .find({ groupId: session.groupId })
      .sort({ lastName: 1, firstName: 1 })
      .lean()
      .exec();
    let resolvedStudents = students;
    if (!resolvedStudents.length && session.groupId) {
      const groupIdStr = String(session.groupId);
      resolvedStudents = await this.studentModel
        .aggregate([
          { $addFields: { groupIdStr: { $toString: '$groupId' } } },
          { $match: { groupIdStr: groupIdStr } },
          { $sort: { lastName: 1, firstName: 1 } },
        ])
        .exec();
    }

    const records = await this.attendanceModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .lean()
      .exec();

    return resolvedStudents.map((s: any) => {
      const record = records.find((r) => String(r.studentId) === String(s._id));
      return {
        studentId: String(s._id),
        firstName: s.firstName,
        lastName: s.lastName,
        studentNumber: s.studentNumber,
        status: record?.status ?? null,
        note: record?.note ?? null,
      };
    });
  }

  async upsertAttendance(
    sessionId: string,
    entries: Array<{ studentId: string; status: AttendanceStatus; note?: string }>,
    actor: AuditActor,
  ) {
    const ops = entries.map((e) => ({
      updateOne: {
        filter: {
          sessionId: new Types.ObjectId(sessionId),
          studentId: new Types.ObjectId(e.studentId),
        },
        update: {
          $set: {
            status: e.status,
            ...(e.note !== undefined ? { note: e.note } : {}),
          },
        },
        upsert: true,
      },
    }));

    await this.attendanceModel.bulkWrite(ops);
    await this.auditLog.log({
      action: 'attendance.upsert',
      entity: 'session',
      entityId: sessionId,
      actor,
      metadata: { count: entries.length },
    });

    return { success: true };
  }

  async getStudentAttendanceSummary(studentId: string) {
    const records = await this.attendanceModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .lean()
      .exec();

    const total = records.length;
    const present = records.filter((r) => r.status === AttendanceStatus.Present).length;
    const absent = records.filter((r) => r.status === AttendanceStatus.Absent).length;
    const excused = records.filter((r) => r.status === AttendanceStatus.Excused).length;

    return {
      total,
      present,
      absent,
      excused,
      rate: total > 0 ? Math.round((present / total) * 100) : null,
    };
  }

  async getMyAttendanceSummary(email: string) {
    const student = await this.studentModel
      .findOne({ email: email.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) return null;
    return this.getStudentAttendanceSummary(String(student._id));
  }

  async getGroupAttendanceSummary(groupId: string) {
    const students = await this.studentModel
      .find({ groupId: new Types.ObjectId(groupId) })
      .lean()
      .exec();

    const results = await Promise.all(
      students.map(async (s) => {
        const summary = await this.getStudentAttendanceSummary(String(s._id));
        return {
          studentId: String(s._id),
          firstName: s.firstName,
          lastName: s.lastName,
          studentNumber: s.studentNumber,
          ...summary,
        };
      }),
    );

    return results;
  }

  async listMyJustifications(email: string) {
    const student = await this.studentModel
      .findOne({ email: email.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) return [];
    return this.justificationModel
      .find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .exec();
  }

  async listJustifications(params: { status?: AbsenceJustificationStatus; groupId?: string }) {
    const filter: any = {};
    if (params.status) filter.status = params.status;
    if (params.groupId) {
      const students = await this.studentModel
        .find({ groupId: new Types.ObjectId(params.groupId) })
        .select('_id')
        .lean()
        .exec();
      const ids = students.map((s) => s._id);
      filter.studentId = { $in: ids };
    }
    return this.justificationModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async createJustification(data: {
    email: string;
    sessionId?: string;
    absenceDate: string;
    reason: string;
    originalName?: string;
    fileName?: string;
    path?: string;
    mimeType?: string;
    size?: number;
  }) {
    const student = await this.studentModel
      .findOne({ email: data.email.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) return null;
    return this.justificationModel.create({
      studentId: student._id,
      sessionId: data.sessionId ? new Types.ObjectId(data.sessionId) : undefined,
      absenceDate: new Date(data.absenceDate),
      reason: data.reason,
      originalName: data.originalName,
      fileName: data.fileName,
      path: data.path,
      mimeType: data.mimeType,
      size: data.size,
      status: AbsenceJustificationStatus.Submitted,
    });
  }

  async updateJustification(id: string, data: { status: AbsenceJustificationStatus; decisionNote?: string }, actor: AuditActor) {
    const updated = await this.justificationModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
    if (updated) {
      await this.auditLog.log({
        action: 'attendance.justification.update',
        entity: 'absenceJustification',
        entityId: String(updated._id),
        actor,
        metadata: data,
      });
    }
    return updated;
  }

  async getJustification(id: string) {
    return this.justificationModel.findById(id).exec();
  }
}
