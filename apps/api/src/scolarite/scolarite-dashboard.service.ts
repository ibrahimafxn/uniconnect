import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InscriptionCampaign } from './schemas/inscription-campaign.schema';
import { ApplicationDossier } from './schemas/application-dossier.schema';
import { AttendanceAlert } from './schemas/attendance-alert.schema';
import { SemesterResult } from './schemas/semester-result.schema';
import { DocumentRequest } from './schemas/document-request.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Payment } from '../payments/payment.schema';
import { PaymentPlan } from '../payments/payment-plan.schema';
import { AuditLog } from '../audit/audit-log.schema';

@Injectable()
export class ScolariteDashboardService {
  constructor(
    @InjectModel(InscriptionCampaign.name)
    private readonly campaignModel: Model<InscriptionCampaign>,
    @InjectModel(ApplicationDossier.name)
    private readonly dossierModel: Model<ApplicationDossier>,
    @InjectModel(AttendanceAlert.name)
    private readonly alertModel: Model<AttendanceAlert>,
    @InjectModel(SemesterResult.name)
    private readonly resultModel: Model<SemesterResult>,
    @InjectModel(DocumentRequest.name)
    private readonly docRequestModel: Model<DocumentRequest>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    @InjectModel(PaymentPlan.name)
    private readonly planModel: Model<PaymentPlan>,
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLog>,
  ) {}

  // ─── Dashboard principal ──────────────────────────────────────────────────

  async getDashboard() {
    const [
      inscriptionStats,
      alertsCount,
      pendingDocs,
      financialStats,
    ] = await Promise.all([
      this.getInscriptionStats(),
      this.alertModel.countDocuments({ status: 'open' }).exec(),
      this.docRequestModel.countDocuments({ status: 'pending' }).exec(),
      this.getFinancialStats(),
    ]);

    return {
      inscriptions: inscriptionStats,
      alerts: {
        open: alertsCount,
      },
      documents: {
        pending: pendingDocs,
      },
      financial: financialStats,
    };
  }

  async getInscriptionStats() {
    const campaigns = await this.campaignModel
      .find({ status: { $in: ['open', 'closed'] } })
      .lean()
      .exec();

    const stats = await Promise.all(
      campaigns.map(async (c) => {
        const approved = await this.dossierModel
          .countDocuments({ campaignId: c._id, status: 'approved' })
          .exec();
        return {
          campaignId: c._id,
          name: c.name,
          capacity: c.capacity,
          approved,
          fillRate: c.capacity > 0 ? Math.round((approved / c.capacity) * 100) : 0,
          status: c.status,
        };
      }),
    );

    return stats;
  }

  async getAlertsSummary() {
    const byStatus = await this.alertModel
      .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      .exec();

    const result: Record<string, number> = {};
    for (const entry of byStatus) result[entry._id] = entry.count;
    return result;
  }

  async getFinancialStats() {
    const totalStudents = await this.studentModel.countDocuments().exec();
    const plans = await this.planModel.find().lean().exec();
    const payments = await this.paymentModel.find().lean().exec();

    const totalDue = plans.reduce((sum, p) => sum + (p.totalAmount ?? 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const recoveryRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
    const studentsWithDebt = await this.planModel.countDocuments({ totalAmount: { $gt: 0 } }).exec();

    return {
      totalStudents,
      totalDue,
      totalPaid,
      unpaid: Math.max(0, totalDue - totalPaid),
      recoveryRate,
      studentsWithDebt,
    };
  }

  // ─── Rapport MESRS ────────────────────────────────────────────────────────

  async getMesrsReport(academicYearId?: string) {
    const filter: Record<string, any> = {};
    if (academicYearId) filter.academicYearId = new Types.ObjectId(academicYearId);

    const students = await this.studentModel.find(filter).lean().exec();
    const total = students.length;

    // Distribution par genre
    const byGender = students.reduce(
      (acc, s) => {
        const g = (s as any).gender ?? 'unknown';
        acc[g] = (acc[g] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Distribution par statut
    const byStatus = students.reduce(
      (acc, s) => {
        const st = (s as any).status ?? 'unknown';
        acc[st] = (acc[st] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Taux de réussite (résultats définitifs)
    const results = await this.resultModel
      .find({ isProvisional: false })
      .lean()
      .exec();
    const admitted = results.filter((r) => r.status === 'admitted').length;
    const successRate =
      results.length > 0 ? Math.round((admitted / results.length) * 100) : 0;

    return {
      year: new Date().getFullYear(),
      academicYearId: academicYearId ?? 'all',
      total,
      byGender,
      byStatus,
      results: {
        total: results.length,
        admitted,
        successRate,
      },
      generatedAt: new Date(),
    };
  }

  async getResultsReport(offerId: string) {
    const results = await this.resultModel
      .find({ offerId: new Types.ObjectId(offerId), isProvisional: false })
      .lean()
      .exec();

    const total = results.length;
    if (total === 0) return { offerId, total: 0 };

    const byStatus: Record<string, number> = {};
    let totalAvg = 0;
    for (const r of results) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      totalAvg += r.semesterAverage;
    }

    const classAverage = Math.round((totalAvg / total) * 100) / 100;
    const successRate = Math.round(((byStatus['admitted'] ?? 0) / total) * 100);

    // Distribution par tranches de notes
    const distribution = {
      '0-5':   results.filter((r) => r.semesterAverage < 5).length,
      '5-8':   results.filter((r) => r.semesterAverage >= 5 && r.semesterAverage < 8).length,
      '8-10':  results.filter((r) => r.semesterAverage >= 8 && r.semesterAverage < 10).length,
      '10-12': results.filter((r) => r.semesterAverage >= 10 && r.semesterAverage < 12).length,
      '12-14': results.filter((r) => r.semesterAverage >= 12 && r.semesterAverage < 14).length,
      '14-16': results.filter((r) => r.semesterAverage >= 14 && r.semesterAverage < 16).length,
      '16-20': results.filter((r) => r.semesterAverage >= 16).length,
    };

    return {
      offerId,
      total,
      classAverage,
      successRate,
      byStatus,
      distribution,
    };
  }

  // ─── Logs d'audit ─────────────────────────────────────────────────────────

  async listAuditLogs(params: {
    entity?: string;
    actorId?: string;
    action?: string;
    from?: string;
    to?: string;
    skip: number;
    limit: number;
  }) {
    const filter: Record<string, any> = {};
    if (params.entity) filter.entity = params.entity;
    if (params.actorId) filter.actorId = params.actorId;
    if (params.action) filter.action = params.action;
    if (params.from || params.to) {
      filter.createdAt = {};
      if (params.from) filter.createdAt.$gte = new Date(params.from);
      if (params.to) filter.createdAt.$lte = new Date(params.to);
    }

    const [items, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.auditModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}
