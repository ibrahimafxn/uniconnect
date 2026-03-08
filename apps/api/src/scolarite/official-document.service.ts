import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  OfficialDocument,
  OfficialDocumentType,
} from './schemas/official-document.schema';
import {
  DocumentRequest,
  DocumentRequestStatus,
} from './schemas/document-request.schema';
import { SemesterResult } from './schemas/semester-result.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';
import { EmailService } from '../common/email.service';

@Injectable()
export class OfficialDocumentService {
  constructor(
    @InjectModel(OfficialDocument.name)
    private readonly documentModel: Model<OfficialDocument>,
    @InjectModel(DocumentRequest.name)
    private readonly requestModel: Model<DocumentRequest>,
    @InjectModel(SemesterResult.name)
    private readonly resultModel: Model<SemesterResult>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Demandes de documents ────────────────────────────────────────────────

  async listRequests(params: {
    status?: DocumentRequestStatus;
    documentType?: OfficialDocumentType;
    skip: number;
    limit: number;
  }) {
    const filter: Record<string, any> = {};
    if (params.status) filter.status = params.status;
    if (params.documentType) filter.documentType = params.documentType;

    const [items, total] = await Promise.all([
      this.requestModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .populate('studentId', 'firstName lastName studentNumber email')
        .exec(),
      this.requestModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async getRequest(id: string) {
    const req = await this.requestModel
      .findById(id)
      .populate('studentId', 'firstName lastName studentNumber email')
      .populate('documentId')
      .exec();
    if (!req) throw new NotFoundException('Demande introuvable.');
    return req;
  }

  async submitRequest(
    dto: { studentId: string; documentType: OfficialDocumentType; semesterId?: string },
    actor: AuditActor,
  ) {
    const student = await this.studentModel.findById(dto.studentId).lean().exec();
    if (!student) throw new NotFoundException('Étudiant introuvable.');

    const request = await this.requestModel.create({
      studentId: new Types.ObjectId(dto.studentId),
      documentType: dto.documentType,
      semesterId: dto.semesterId ? new Types.ObjectId(dto.semesterId) : undefined,
      status: 'pending',
    });

    await this.auditLog.log({
      action: 'SUBMIT_DOCUMENT_REQUEST',
      entity: 'DocumentRequest',
      entityId: String(request._id),
      actor,
      metadata: { studentId: dto.studentId, documentType: dto.documentType },
    });

    // Notification à l'étudiant
    if (student.email) {
      await this.emailService.sendMail({
        to: student.email,
        subject: 'Demande de document reçue — UniConnect',
        text: `Bonjour ${student.firstName} ${student.lastName},\n\nVotre demande de ${this.getDocumentLabel(dto.documentType)} a bien été reçue et est en cours de traitement.\n\nCordialement,\nLe service de scolarité`,
      });
    }

    return request;
  }

  async processRequest(id: string, actor: AuditActor) {
    const request = await this.requestModel.findById(id).exec();
    if (!request) throw new NotFoundException('Demande introuvable.');
    if (request.status !== 'pending') {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }

    await this.requestModel
      .findByIdAndUpdate(id, { status: 'processing' })
      .exec();

    // Générer le document officiel
    let doc: OfficialDocument;
    if (request.documentType === 'transcript' && request.semesterId) {
      doc = await this.generateTranscript(
        String(request.studentId),
        String(request.semesterId),
        actor,
      );
    } else {
      doc = await this.generateCertificate(
        String(request.studentId),
        request.documentType,
        actor,
      );
    }

    const updated = await this.requestModel
      .findByIdAndUpdate(
        id,
        {
          status: 'ready',
          documentId: doc._id,
          processedBy: new Types.ObjectId(actor.userId),
          processedAt: new Date(),
        },
        { returnDocument: 'after' },
      )
      .exec();

    await this.auditLog.log({
      action: 'PROCESS_DOCUMENT_REQUEST',
      entity: 'DocumentRequest',
      entityId: id,
      actor,
      metadata: { documentId: String(doc._id) },
    });

    return updated;
  }

  async deliverRequest(id: string, actor: AuditActor) {
    const request = await this.requestModel.findById(id).exec();
    if (!request) throw new NotFoundException('Demande introuvable.');
    if (request.status !== 'ready') {
      throw new BadRequestException('Le document n\'est pas encore prêt.');
    }

    const updated = await this.requestModel
      .findByIdAndUpdate(id, { status: 'delivered' }, { returnDocument: 'after' })
      .exec();

    if (request.documentId) {
      await this.documentModel
        .findByIdAndUpdate(request.documentId, { status: 'delivered', deliveredAt: new Date() })
        .exec();
    }

    await this.auditLog.log({
      action: 'DELIVER_DOCUMENT',
      entity: 'DocumentRequest',
      entityId: id,
      actor,
    });

    return updated;
  }

  // ─── Génération de documents ──────────────────────────────────────────────

  async generateTranscript(studentId: string, semesterId: string, actor: AuditActor) {
    const student = await this.studentModel.findById(studentId).lean().exec();
    if (!student) throw new NotFoundException('Étudiant introuvable.');

    const result = await this.resultModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        semesterId: new Types.ObjectId(semesterId),
        isProvisional: false,
      })
      .lean()
      .exec();

    if (!result) {
      throw new BadRequestException(
        'Les résultats de ce semestre ne sont pas encore définitifs (délibération non signée).',
      );
    }

    const reference = await this.generateReference('REL');
    const qrCode = this.generateQrToken();

    const doc = await this.documentModel.create({
      type: 'transcript',
      studentId: new Types.ObjectId(studentId),
      semesterId: new Types.ObjectId(semesterId),
      reference,
      qrCode,
      filePath: `uploads/documents/${reference}.pdf`,
      status: 'generated',
      generatedBy: new Types.ObjectId(actor.userId),
    });

    await this.auditLog.log({
      action: 'GENERATE_TRANSCRIPT',
      entity: 'OfficialDocument',
      entityId: String(doc._id),
      actor,
      metadata: { studentId, semesterId, reference },
    });

    return doc;
  }

  async generateCertificate(
    studentId: string,
    type: OfficialDocumentType,
    actor: AuditActor,
  ) {
    const student = await this.studentModel.findById(studentId).lean().exec();
    if (!student) throw new NotFoundException('Étudiant introuvable.');

    const prefix = this.getDocumentPrefix(type);
    const reference = await this.generateReference(prefix);
    const qrCode = this.generateQrToken();

    const doc = await this.documentModel.create({
      type,
      studentId: new Types.ObjectId(studentId),
      reference,
      qrCode,
      filePath: `uploads/documents/${reference}.pdf`,
      status: 'generated',
      generatedBy: new Types.ObjectId(actor.userId),
    });

    await this.auditLog.log({
      action: 'GENERATE_CERTIFICATE',
      entity: 'OfficialDocument',
      entityId: String(doc._id),
      actor,
      metadata: { studentId, type, reference },
    });

    return doc;
  }

  async downloadDocument(id: string) {
    const doc = await this.documentModel
      .findById(id)
      .populate('studentId', 'firstName lastName studentNumber')
      .exec();
    if (!doc) throw new NotFoundException('Document introuvable.');
    return doc;
  }

  async verifyDocument(qrCode: string) {
    const doc = await this.documentModel
      .findOne({ qrCode })
      .populate('studentId', 'firstName lastName studentNumber')
      .lean()
      .exec();

    if (!doc) {
      return { valid: false, message: 'Document non reconnu ou falsifié.' };
    }

    return {
      valid: true,
      reference: doc.reference,
      type: doc.type,
      status: doc.status,
      deliveredAt: doc.deliveredAt,
      student: doc.studentId,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async generateReference(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.documentModel
      .countDocuments({ reference: { $regex: `^${prefix}-${year}-` } })
      .exec();
    const seq = String(count + 1).padStart(6, '0');
    return `${prefix}-${year}-${seq}`;
  }

  private generateQrToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getDocumentPrefix(type: OfficialDocumentType): string {
    const prefixes: Record<OfficialDocumentType, string> = {
      transcript:             'REL',
      enrollment_certificate: 'ATT',
      success_certificate:    'SUC',
      diploma:                'DIP',
      presence_certificate:   'PRE',
    };
    return prefixes[type] ?? 'DOC';
  }

  private getDocumentLabel(type: OfficialDocumentType): string {
    const labels: Record<OfficialDocumentType, string> = {
      transcript:             'relevé de notes',
      enrollment_certificate: 'attestation de scolarité',
      success_certificate:    'attestation de réussite',
      diploma:                'diplôme',
      presence_certificate:   'certificat de présence',
    };
    return labels[type] ?? 'document';
  }
}
