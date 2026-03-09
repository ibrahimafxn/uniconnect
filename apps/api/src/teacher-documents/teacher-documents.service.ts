import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { TeacherDocument, TeacherDocumentCategory, TeacherDocumentType } from './teacher-document.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';
import { TeacherProfile } from '../teacher-profile/teacher-profile.schema';

const uploadRoot = join(process.cwd(), 'uploads', 'teacher-documents');
const ensureUploadDir = () => mkdirSync(uploadRoot, { recursive: true });

@Injectable()
export class TeacherDocumentsService {
  constructor(
    @InjectModel(TeacherDocument.name)
    private readonly documentModel: Model<TeacherDocument>,
    @InjectModel(TeacherProfile.name)
    private readonly teacherProfileModel: Model<TeacherProfile>,
    private readonly auditLog: AuditLogService,
  ) {}

  listForTeacher(userId: string) {
    return this.documentModel
      .find({
        ownerId: new Types.ObjectId(userId),
        category: { $in: [TeacherDocumentCategory.Official, TeacherDocumentCategory.ExamSubject] },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  listTemplates() {
    return this.documentModel
      .find({ category: TeacherDocumentCategory.Template })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  listPvForTeacher(userId: string) {
    return this.documentModel
      .find({
        category: TeacherDocumentCategory.PvDeliberation,
        $or: [
          { participantIds: { $size: 0 } },
          { participantIds: new Types.ObjectId(userId) },
        ],
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async createExamSubject(
    userId: string,
    dto: { title: string; academicYearId?: string },
    file: { originalname: string; filename: string; path: string; mimetype: string; size: number },
    actor: AuditActor,
  ) {
    const latest = await this.documentModel
      .findOne({
        ownerId: new Types.ObjectId(userId),
        category: TeacherDocumentCategory.ExamSubject,
        title: dto.title,
      })
      .sort({ version: -1 })
      .lean()
      .exec();

    const version = (latest?.version ?? 0) + 1;

    const doc = await this.documentModel.create({
      title: dto.title,
      category: TeacherDocumentCategory.ExamSubject,
      type: TeacherDocumentType.ExamSubject,
      ownerId: new Types.ObjectId(userId),
      version,
      academicYearId: dto.academicYearId ? new Types.ObjectId(dto.academicYearId) : undefined,
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
      createdBy: new Types.ObjectId(userId),
    });

    await this.auditLog.log({
      action: 'teacher.documents.exam_subject.create',
      entity: 'teacherDocument',
      entityId: String(doc._id),
      actor,
      metadata: { title: doc.title, version: doc.version },
    });

    return doc;
  }

  async createAttestation(userId: string, purpose: string | undefined, actor: AuditActor) {
    const profile = await this.teacherProfileModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();

    if (!profile) {
      throw new BadRequestException('Profil enseignant introuvable.');
    }

    ensureUploadDir();
    const stamp = Date.now();
    const fileName = `attestation_enseignement_${stamp}.pdf`;
    const filePath = join(uploadRoot, fileName);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(18).text('Attestation d\'enseignement', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Nous certifions que ${profile.firstName} ${profile.lastName}`);
    doc.text('exerce en tant qu\'enseignant au sein de l\'université.');
    if (profile.grade) {
      doc.moveDown(0.5).text(`Grade : ${profile.grade}`);
    }
    if (profile.specialty) {
      doc.text(`Spécialité : ${profile.specialty}`);
    }
    if (purpose) {
      doc.moveDown(0.5).text(`Objet : ${purpose}`);
    }
    doc.moveDown();
    doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}.`);
    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    const docRecord = await this.documentModel.create({
      title: 'Attestation d\'enseignement',
      category: TeacherDocumentCategory.Official,
      type: TeacherDocumentType.TeachingAttestation,
      ownerId: new Types.ObjectId(userId),
      originalName: 'attestation_enseignement.pdf',
      fileName,
      path: filePath,
      mimeType: 'application/pdf',
      size: stream.bytesWritten ?? 0,
      createdBy: new Types.ObjectId(userId),
    });

    await this.auditLog.log({
      action: 'teacher.documents.attestation.create',
      entity: 'teacherDocument',
      entityId: String(docRecord._id),
      actor,
      metadata: { title: docRecord.title },
    });

    return docRecord;
  }

  async createAdminDocument(
    dto: {
      title: string;
      category: TeacherDocumentCategory;
      type: TeacherDocumentType;
      ownerId?: string;
      participantIds?: string[];
    },
    file: { originalname: string; filename: string; path: string; mimetype: string; size: number },
    actor: AuditActor,
  ) {
    const doc = await this.documentModel.create({
      title: dto.title,
      category: dto.category,
      type: dto.type,
      ownerId: dto.ownerId ? new Types.ObjectId(dto.ownerId) : undefined,
      participantIds: (dto.participantIds ?? []).map((id) => new Types.ObjectId(id)),
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
      createdBy: new Types.ObjectId(actor.userId),
    });

    await this.auditLog.log({
      action: 'teacher.documents.admin_upload',
      entity: 'teacherDocument',
      entityId: String(doc._id),
      actor,
      metadata: { title: doc.title, category: doc.category, type: doc.type },
    });

    return doc;
  }

  async getDocumentForDownload(
    id: string,
    user: { userId: string; role: string },
  ) {
    const doc = await this.documentModel.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('Document introuvable.');

    if (['admin', 'super_admin'].includes(user.role)) return doc;

    const userId = new Types.ObjectId(user.userId);
    if (doc.category === TeacherDocumentCategory.Template) return doc;
    if (doc.category === TeacherDocumentCategory.PvDeliberation) {
      const participants = doc.participantIds ?? [];
      if (participants.length === 0 || participants.some((p) => String(p) === String(userId))) return doc;
    }
    if (doc.ownerId && String(doc.ownerId) === String(userId)) return doc;

    throw new BadRequestException('Accès refusé à ce document.');
  }

  async deleteDocument(id: string, user: { userId: string; role: string }) {
    const doc = await this.documentModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Document introuvable.');

    if (!['admin', 'super_admin'].includes(user.role)) {
      if (!doc.ownerId || String(doc.ownerId) !== String(user.userId)) {
        throw new BadRequestException('Suppression non autorisée.');
      }
      if (doc.category !== TeacherDocumentCategory.ExamSubject) {
        throw new BadRequestException('Seuls les sujets d\'examen peuvent être supprimés.');
      }
    }

    await doc.deleteOne();
    await this.auditLog.log({
      action: 'teacher.documents.delete',
      entity: 'teacherDocument',
      entityId: String(id),
      actor: { userId: user.userId, role: user.role },
    });
    return { success: true };
  }
}
