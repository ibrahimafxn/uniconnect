import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceAlert, AlertStatus } from './schemas/attendance-alert.schema';
import { SemesterResult } from './schemas/semester-result.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Attendance, AttendanceStatus } from '../attendance/attendance.schema';
import { Session } from '../planning/session.schema';
import { Group } from '../academic/group.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';

const ABSENCE_THRESHOLD = 30; // % d'absences déclenchant une alerte

@Injectable()
export class AttendanceAlertService {
  constructor(
    @InjectModel(AttendanceAlert.name)
    private readonly alertModel: Model<AttendanceAlert>,
    @InjectModel(SemesterResult.name)
    private readonly resultModel: Model<SemesterResult>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<Session>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<Group>,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Détection des alertes ────────────────────────────────────────────────

  async checkAlerts(offerId: string, actor: AuditActor) {
    const groups = await this.groupModel
      .find({ offerId: new Types.ObjectId(offerId) })
      .lean()
      .exec();

    const students = await this.studentModel
      .find({ offerId: new Types.ObjectId(offerId) })
      .lean()
      .exec();

    let created = 0;
    let updated = 0;

    for (const student of students) {
      const absenceRate = await this.calculateAbsenceRate(String(student._id), offerId);

      if (absenceRate >= ABSENCE_THRESHOLD) {
        const existing = await this.alertModel
          .findOne({ studentId: student._id, offerId: new Types.ObjectId(offerId) })
          .exec();

        if (!existing) {
          await this.alertModel.create({
            studentId: student._id,
            offerId: new Types.ObjectId(offerId),
            absenceRate,
            status: 'open',
            notifiedAt: new Date(),
          });

          if (student.email) {
            await this.emailService.sendMail({
              to: student.email,
              subject: 'Alerte assiduité — UniConnect',
              text: `Bonjour ${student.firstName} ${student.lastName},\n\nVotre taux d'absence (${absenceRate.toFixed(1)}%) dépasse le seuil réglementaire de ${ABSENCE_THRESHOLD}%.\nVeuillez contacter le service de scolarité.\n\nCordialement,\nLe service de scolarité`,
            });
          }
          created++;
        } else if (existing.absenceRate !== absenceRate) {
          await this.alertModel.findByIdAndUpdate(String(existing._id), { absenceRate }).exec();
          updated++;
        }
      }
    }

    await this.auditLog.log({
      action: 'CHECK_ATTENDANCE_ALERTS',
      entity: 'AttendanceAlert',
      entityId: offerId,
      actor,
      metadata: { offerId, created, updated, threshold: ABSENCE_THRESHOLD },
    });

    return { offerId, studentsChecked: students.length, alertsCreated: created, alertsUpdated: updated };
  }

  private async calculateAbsenceRate(studentId: string, offerId: string): Promise<number> {
    const groups = await this.groupModel
      .find({ offerId: new Types.ObjectId(offerId) })
      .lean()
      .exec();

    const student = await this.studentModel.findById(studentId).lean().exec();
    if (!student?.groupId) return 0;

    // Nombre total de séances pour le groupe
    const totalSessions = await this.sessionModel
      .countDocuments({ groupId: student.groupId })
      .exec();

    if (totalSessions === 0) return 0;

    // Nombre d'absences
    const sessions = await this.sessionModel
      .find({ groupId: student.groupId })
      .select('_id')
      .lean()
      .exec();

    const sessionIds = sessions.map((s) => s._id);
    const absences = await this.attendanceModel
      .countDocuments({
        studentId: new Types.ObjectId(studentId),
        sessionId: { $in: sessionIds },
        status: AttendanceStatus.Absent,
      })
      .exec();

    return Math.round((absences / totalSessions) * 100 * 10) / 10;
  }

  // ─── Gestion des alertes ──────────────────────────────────────────────────

  async listAlerts(params: { offerId?: string; status?: AlertStatus; skip: number; limit: number }) {
    const filter: Record<string, any> = {};
    if (params.offerId) filter.offerId = new Types.ObjectId(params.offerId);
    if (params.status) filter.status = params.status;

    const [items, total] = await Promise.all([
      this.alertModel
        .find(filter)
        .sort({ absenceRate: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .populate('studentId', 'firstName lastName studentNumber email')
        .exec(),
      this.alertModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async getAlert(id: string) {
    const alert = await this.alertModel
      .findById(id)
      .populate('studentId', 'firstName lastName studentNumber email')
      .exec();
    if (!alert) throw new NotFoundException('Alerte introuvable.');
    return alert;
  }

  async updateAlert(id: string, status: AlertStatus, actor: AuditActor) {
    const alert = await this.alertModel.findById(id).exec();
    if (!alert) throw new NotFoundException('Alerte introuvable.');

    const updated = await this.alertModel
      .findByIdAndUpdate(
        id,
        { status, handledBy: new Types.ObjectId(actor.userId) },
        { returnDocument: 'after' },
      )
      .exec();

    await this.auditLog.log({
      action: 'UPDATE_ATTENDANCE_ALERT',
      entity: 'AttendanceAlert',
      entityId: id,
      actor,
      metadata: { status },
    });

    return updated;
  }

  async convokeStudent(id: string, actor: AuditActor) {
    const alert = await this.alertModel
      .findById(id)
      .populate('studentId', 'firstName lastName email')
      .exec();
    if (!alert) throw new NotFoundException('Alerte introuvable.');

    const student = alert.studentId as any;
    if (student?.email) {
      await this.emailService.sendMail({
        to: student.email,
        subject: 'Convocation — Service de Scolarité — UniConnect',
        text: `Bonjour ${student.firstName} ${student.lastName},\n\nVous êtes convoqué(e) au service de scolarité concernant votre assiduité.\nVotre taux d'absence (${alert.absenceRate}%) dépasse le seuil autorisé.\n\nMerci de vous présenter dans les plus brefs délais.\n\nCordialement,\nLe service de scolarité`,
      });
    }

    await this.alertModel.findByIdAndUpdate(id, { status: 'convoked', handledBy: new Types.ObjectId(actor.userId) }).exec();

    await this.auditLog.log({
      action: 'CONVOKE_STUDENT',
      entity: 'AttendanceAlert',
      entityId: id,
      actor,
    });

    return { convoked: true };
  }

  async excludeFromExam(id: string, actor: AuditActor) {
    const alert = await this.alertModel.findById(id).exec();
    if (!alert) throw new NotFoundException('Alerte introuvable.');

    await this.alertModel
      .findByIdAndUpdate(id, { status: 'excluded_exam', handledBy: new Types.ObjectId(actor.userId) })
      .exec();

    // Marquer l'étudiant comme non éligible aux examens
    await this.resultModel
      .updateMany(
        { studentId: alert.studentId, offerId: alert.offerId },
        { $set: { examEligible: false } },
      )
      .exec();

    await this.auditLog.log({
      action: 'EXCLUDE_FROM_EXAM',
      entity: 'AttendanceAlert',
      entityId: id,
      actor,
      metadata: { studentId: String(alert.studentId) },
    });

    return { excluded: true };
  }

  async getAttendanceReport(offerId: string) {
    const students = await this.studentModel
      .find({ offerId: new Types.ObjectId(offerId) })
      .select('firstName lastName studentNumber email groupId')
      .lean()
      .exec();

    const report: { student: { id: unknown; name: string; studentNumber: string }; absenceRate: number; alertStatus: string | null; risk: string }[] = [];
    for (const student of students) {
      const absenceRate = await this.calculateAbsenceRate(String(student._id), offerId);
      const alert = await this.alertModel
        .findOne({ studentId: student._id, offerId: new Types.ObjectId(offerId) })
        .lean()
        .exec();

      report.push({
        student: { id: student._id, name: `${student.firstName} ${student.lastName}`, studentNumber: student.studentNumber },
        absenceRate,
        alertStatus: alert?.status ?? null,
        risk: absenceRate >= ABSENCE_THRESHOLD ? 'high' : absenceRate >= 20 ? 'medium' : 'low',
      });
    }

    return {
      offerId,
      threshold: ABSENCE_THRESHOLD,
      total: report.length,
      atRisk: report.filter((r) => r.risk === 'high').length,
      report: report.sort((a, b) => b.absenceRate - a.absenceRate),
    };
  }
}
