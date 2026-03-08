import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationStatus } from './application.schema';
import { ApplicationDocument } from './application-document.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';

const TRACKING_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTrackingCode(length = 8) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += TRACKING_ALPHABET[Math.floor(Math.random() * TRACKING_ALPHABET.length)];
  }
  return out;
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<Application>,
    @InjectModel(ApplicationDocument.name)
    private readonly documentModel: Model<ApplicationDocument>,
    private readonly auditLog: AuditLogService,
  ) {}

  async createPublic(data: {
    firstName: string;
    lastName: string;
    gender: string;
    birthDate: string;
    email: string;
    phone?: string;
    address?: string;
    programId: string;
    offerId: string;
    academicYearId: string;
    submit?: boolean;
  }) {
    const trackingCode = generateTrackingCode();
    const status = data.submit ? ApplicationStatus.Submitted : ApplicationStatus.Draft;
    const app = await this.applicationModel.create({
      trackingCode,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      birthDate: new Date(data.birthDate),
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      address: data.address,
      programId: new Types.ObjectId(data.programId),
      offerId: new Types.ObjectId(data.offerId),
      academicYearId: new Types.ObjectId(data.academicYearId),
      status,
      submittedAt: status === ApplicationStatus.Submitted ? new Date() : undefined,
    });
    return app;
  }

  async updatePublic(trackingCode: string, email: string, data: any) {
    const app = await this.applicationModel
      .findOne({ trackingCode, email: email.toLowerCase().trim() })
      .exec();
    if (!app) throw new NotFoundException('Dossier introuvable');
    if ([ApplicationStatus.Accepted, ApplicationStatus.Rejected].includes(app.status)) {
      throw new BadRequestException('Dossier finalisé');
    }
    const payload: any = { ...data };
    if (payload.email) payload.email = payload.email.toLowerCase().trim();
    if (payload.birthDate) payload.birthDate = new Date(payload.birthDate);
    if (payload.programId) payload.programId = new Types.ObjectId(payload.programId);
    if (payload.offerId) payload.offerId = new Types.ObjectId(payload.offerId);
    if (payload.academicYearId) payload.academicYearId = new Types.ObjectId(payload.academicYearId);

    if (payload.submit) {
      payload.status = ApplicationStatus.Submitted;
      payload.submittedAt = new Date();
    }
    delete payload.submit;

    const updated = await this.applicationModel
      .findByIdAndUpdate(app._id, payload, { returnDocument: 'after' })
      .exec();
    return updated;
  }

  async getPublic(trackingCode: string, email: string) {
    return this.applicationModel
      .findOne({ trackingCode, email: email.toLowerCase().trim() })
      .lean()
      .exec();
  }

  listAll(status?: ApplicationStatus) {
    const filter: any = {};
    if (status) filter.status = status;
    return this.applicationModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async updateStatus(id: string, data: { status: ApplicationStatus; decisionNote?: string }, actor: AuditActor) {
    const app = await this.applicationModel
      .findByIdAndUpdate(
        id,
        {
          status: data.status,
          decisionNote: data.decisionNote,
        },
        { returnDocument: 'after' },
      )
      .exec();
    if (app) {
      await this.auditLog.log({
        action: 'applications.status.update',
        entity: 'application',
        entityId: String(app._id),
        actor,
        metadata: { status: data.status, decisionNote: data.decisionNote ?? null },
      });
    }
    return app;
  }

  async listByStudentEmail(email: string) {
    const normalized = email.toLowerCase().trim();
    return this.applicationModel.find({ email: normalized }).sort({ createdAt: -1 }).exec();
  }

  async createDocument(data: {
    applicationId: string;
    label?: string;
    originalName: string;
    fileName: string;
    path: string;
    mimeType: string;
    size: number;
  }) {
    return this.documentModel.create({
      ...data,
      applicationId: new Types.ObjectId(data.applicationId),
    });
  }

  listDocuments(applicationId: string) {
    return this.documentModel
      .find({ applicationId: new Types.ObjectId(applicationId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getDocument(id: string) {
    return this.documentModel.findById(id).exec();
  }
}
