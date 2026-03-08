import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceStatus } from './attendance.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Session } from '../planning/session.schema';
import { AuditActor, AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
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

    const records = await this.attendanceModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .lean()
      .exec();

    return students.map((s) => {
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

  /**
   * UC-E04 — Alertes étudiants en difficulté.
   * Retourne les étudiants du groupe ayant un taux d'absence > seuil (défaut 30 %).
   */
  async getAbsenceAlerts(groupId: string, threshold = 30) {
    const summary = await this.getGroupAttendanceSummary(groupId);
    return summary
      .filter((s) => {
        if (s.total === 0) return false;
        const absenceRate = Math.round(((s.absent) / s.total) * 100);
        return absenceRate > threshold;
      })
      .map((s) => ({
        ...s,
        absenceRate: Math.round((s.absent / s.total) * 100),
      }))
      .sort((a, b) => b.absenceRate - a.absenceRate);
  }
}
