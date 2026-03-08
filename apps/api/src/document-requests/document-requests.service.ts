import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentRequest, DocumentRequestStatus, DocumentRequestType } from './document-request.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { StudentDocument } from '../students/student-document.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';

@Injectable()
export class DocumentRequestsService {
  constructor(
    @InjectModel(DocumentRequest.name)
    private readonly requestModel: Model<DocumentRequest>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(StudentDocument.name)
    private readonly studentDocModel: Model<StudentDocument>,
    private readonly auditLog: AuditLogService,
  ) {}

  async createRequest(email: string, type: DocumentRequestType, note?: string) {
    const student = await this.studentModel
      .findOne({ email: email.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) throw new BadRequestException('Profil étudiant introuvable');
    return this.requestModel.create({
      studentId: student._id,
      type,
      note,
      status: DocumentRequestStatus.Received,
    });
  }

  async listMyRequests(email: string) {
    const student = await this.studentModel
      .findOne({ email: email.toLowerCase().trim() })
      .lean()
      .exec();
    if (!student) return [];
    return this.requestModel
      .find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .exec();
  }

  listRequests(status?: DocumentRequestStatus) {
    const filter: any = {};
    if (status) filter.status = status;
    return this.requestModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async updateRequest(
    id: string,
    data: { status: DocumentRequestStatus; note?: string; documentId?: string },
    actor: AuditActor,
  ) {
    const current = await this.requestModel.findById(id).lean().exec();
    if (!current) throw new BadRequestException('Demande introuvable');
    if (data.documentId) {
      const doc = await this.studentDocModel.findById(data.documentId).lean().exec();
      if (!doc) throw new BadRequestException('Document étudiant introuvable');
      if (String(doc.studentId) !== String(current.studentId)) {
        throw new BadRequestException('Le document ne correspond pas à l’étudiant');
      }
    }
    const updated = await this.requestModel
      .findByIdAndUpdate(
        id,
        {
          status: data.status,
          note: data.note,
          documentId: data.documentId ? new Types.ObjectId(data.documentId) : undefined,
        },
        { returnDocument: 'after' },
      )
      .exec();
    if (updated) {
      await this.auditLog.log({
        action: 'documents.request.update',
        entity: 'documentRequest',
        entityId: String(updated._id),
        actor,
        metadata: { status: data.status, note: data.note ?? null, documentId: data.documentId ?? null },
      });
    }
    return updated;
  }
}
