import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Enrollment } from '../students/enrollment.schema';
import { Payment } from '../payments/payment.schema';
import { PaymentPlan } from '../payments/payment-plan.schema';
import { AuditLog } from '../audit/audit-log.schema';
import { AcademicYear } from '../academic/academic-year.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { Program } from '../academic/program.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<Enrollment>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    @InjectModel(PaymentPlan.name)
    private readonly paymentPlanModel: Model<PaymentPlan>,
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
    @InjectModel(AcademicYear.name)
    private readonly academicYearModel: Model<AcademicYear>,
    @InjectModel(ProgramOffer.name)
    private readonly offerModel: Model<ProgramOffer>,
    @InjectModel(Program.name)
    private readonly programModel: Model<Program>,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ─── UC-A07 : Tableau de bord exécutif ──────────────────────────────────────

  async getExecutiveDashboard() {
    const activeYear = await this.academicYearModel
      .findOne({ isActive: true })
      .lean()
      .exec();

    const yearId = activeYear ? String(activeYear._id) : undefined;
    const yearFilter = yearId ? { academicYearId: yearId } : {};

    const [
      totalStudents,
      activeStudents,
      totalUsers,
      programs,
      offers,
      payments,
      plans,
      recentLogs,
    ] = await Promise.all([
      this.studentModel.countDocuments(yearFilter).exec(),
      this.studentModel.countDocuments({ ...yearFilter, status: 'active' }).exec(),
      this.userModel.countDocuments().exec(),
      this.programModel.countDocuments().exec(),
      this.offerModel.countDocuments(yearId ? { academicYearId: yearId } : {}).exec(),
      this.paymentModel.find(yearFilter.academicYearId
        ? {} // payments don't have academicYearId; aggregate all
        : {}
      ).lean().exec(),
      this.paymentPlanModel.find({}).lean().exec(),
      this.auditLogModel
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .exec(),
    ]);

    const totalCollected = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const totalExpected = plans.reduce((sum, p) => sum + (p.totalAmount ?? 0), 0);
    const recoveryRate =
      totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    // Enrollments by status for active year
    const enrollmentBreakdown = await this.enrollmentModel
      .aggregate([
        ...(yearId ? [{ $match: { academicYearId: yearId } }] : []),
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .exec();

    return {
      activeAcademicYear: activeYear
        ? { id: String(activeYear._id), name: activeYear.name }
        : null,
      students: {
        total: totalStudents,
        active: activeStudents,
        byEnrollmentStatus: Object.fromEntries(
          enrollmentBreakdown.map((e) => [e._id, e.count]),
        ),
      },
      users: { total: totalUsers },
      programs: { total: programs },
      offers: { total: offers },
      finance: {
        totalExpected,
        totalCollected,
        totalBalance: totalExpected - totalCollected,
        recoveryRate,
        currency: 'XOF',
      },
      recentActivity: recentLogs,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── UC-A05 : Rapport MESRS ──────────────────────────────────────────────────

  async getMesrsReport(academicYearId?: string) {
    const yearFilter = academicYearId ? { academicYearId } : {};

    const [
      allStudents,
      activeYear,
      enrollments,
      programs,
      offers,
    ] = await Promise.all([
      this.studentModel.find(yearFilter).lean().exec(),
      academicYearId
        ? this.academicYearModel.findById(academicYearId).lean().exec()
        : this.academicYearModel.findOne({ isActive: true }).lean().exec(),
      this.enrollmentModel.find(yearFilter).lean().exec(),
      this.programModel.find().lean().exec(),
      this.offerModel
        .find(academicYearId ? { academicYearId } : {})
        .populate('programId', 'name code domaine type')
        .populate('levelId', 'name cycle')
        .lean()
        .exec(),
    ]);

    // Effectifs par genre
    const maleCount = allStudents.filter((s) => s.gender === 'male').length;
    const femaleCount = allStudents.filter((s) => s.gender === 'female').length;

    // Effectifs par filière/niveau
    const offerBreakdown = await Promise.all(
      offers.map(async (o) => {
        const count = await this.studentModel
          .countDocuments({ offerId: o._id })
          .exec();
        return { offer: o, studentCount: count };
      }),
    );

    // Enrollment status distribution
    const enrollmentByStatus: Record<string, number> = {};
    for (const e of enrollments) {
      enrollmentByStatus[e.status] = (enrollmentByStatus[e.status] ?? 0) + 1;
    }

    return {
      academicYear: activeYear
        ? { id: String(activeYear._id), name: (activeYear as any).name }
        : null,
      reportDate: new Date().toISOString(),
      totalStudents: allStudents.length,
      byGender: { male: maleCount, female: femaleCount },
      totalPrograms: programs.length,
      totalOffers: offers.length,
      enrollmentByStatus,
      offerBreakdown: offerBreakdown.map((o) => ({
        offerLabel: `${(o.offer.programId as any)?.name ?? '?'} — ${(o.offer.levelId as any)?.name ?? '?'}`,
        studentCount: o.studentCount,
        capacity: o.offer.capacity,
        fillRate:
          o.offer.capacity > 0
            ? Math.round((o.studentCount / o.offer.capacity) * 100)
            : null,
      })),
    };
  }

  // ─── UC-A08 : Communication & Annonces ──────────────────────────────────────

  /**
   * Broadcast an announcement via the audit log as a structured event.
   * In production this would integrate with an email/SMS gateway.
   */
  async broadcastAnnouncement(params: {
    title: string;
    content: string;
    targetRoles?: string[];
    actor: AuditActor;
  }) {
    const targetRoles = params.targetRoles ?? ['student', 'teacher', 'admin'];

    // Count recipients
    const recipientCount = await this.userModel
      .countDocuments({ role: { $in: targetRoles }, suspended: { $ne: true } })
      .exec();

    // Log the broadcast for traceability
    await this.auditLogService.log({
      action: 'BROADCAST_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: 'global',
      actor: params.actor,
      metadata: {
        title: params.title,
        contentPreview: params.content.slice(0, 200),
        targetRoles,
        recipientCount,
      },
    });

    return {
      success: true,
      recipientCount,
      title: params.title,
      targetRoles,
      sentAt: new Date().toISOString(),
    };
  }

  // ─── UC-A07 : Supervision système ────────────────────────────────────────────

  async getSystemStatus() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalActions24h,
      actionBreakdown,
      suspendedUsers,
      totalAuditLogs,
    ] = await Promise.all([
      this.auditLogModel.countDocuments({ createdAt: { $gte: last24h } }).exec(),
      this.auditLogModel
        .aggregate([
          { $match: { createdAt: { $gte: last24h } } },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .exec(),
      this.userModel.countDocuments({ suspended: true }).exec(),
      this.auditLogModel.countDocuments().exec(),
    ]);

    return {
      system: {
        status: 'operational',
        checkedAt: new Date().toISOString(),
      },
      activity: {
        last24hActions: totalActions24h,
        totalAuditLogs,
        topActions: actionBreakdown,
      },
      users: {
        suspended: suspendedUsers,
      },
    };
  }
}
