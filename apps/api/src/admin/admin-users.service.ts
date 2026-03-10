import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Workbook } from 'exceljs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.schema';
import { Role } from '../common/roles.enum';
import { StudentProfile, StudentGender } from '../students/student-profile.schema';
import { TeacherProfile } from '../teacher-profile/teacher-profile.schema';
import { AuditLog } from '../audit/audit-log.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';
import { BulkImportJob } from './schemas/bulk-import-job.schema';
import {
  buildStudentNumber,
} from '../students/student-number';
import { ProgramOffer } from '../academic/program-offer.schema';
import { Group } from '../academic/group.schema';
import { AcademicYear } from '../academic/academic-year.schema';

export interface ImportStudentRow {
  firstName: string;
  lastName: string;
  email?: string;
  gender: StudentGender;
  birthDate: string; // ISO date string YYYY-MM-DD
  phone?: string;
  address?: string;
}

export interface ImportResult {
  jobId: string;
  total: number;
  successCount: number;
  errorCount: number;
  errors: { row: number; message: string; email?: string }[];
  credentials: { email: string; password: string; studentNumber: string }[];
}

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(TeacherProfile.name)
    private readonly teacherModel: Model<TeacherProfile>,
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
    @InjectModel(BulkImportJob.name)
    private readonly importJobModel: Model<BulkImportJob>,
    @InjectModel(ProgramOffer.name)
    private readonly offerModel: Model<ProgramOffer>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<Group>,
    @InjectModel(AcademicYear.name)
    private readonly academicYearModel: Model<AcademicYear>,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ─── User listing ───────────────────────────────────────────────────────────

  async listUsers(params: {
    skip: number;
    limit: number;
    role?: Role;
    q?: string;
    suspended?: boolean;
  }) {
    const filter: Record<string, any> = {};
    if (params.role) filter.role = params.role;
    if (params.suspended !== undefined) filter.suspended = params.suspended;
    if (params.q) {
      filter.email = { $regex: params.q, $options: 'i' };
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-passwordHash -refreshTokenHash')
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    // Enrich with names from profiles
    const userIds = users.map((u) => u._id);

    const [studentProfiles, teacherProfiles] = await Promise.all([
      this.studentModel.find({ userId: { $in: userIds } }).select('userId firstName lastName').lean().exec(),
      this.teacherModel.find({ userId: { $in: userIds } }).select('userId firstName lastName').lean().exec(),
    ]);

    const studentByUserId = new Map(studentProfiles.map((p) => [String(p.userId), p]));
    const teacherByUserId = new Map(teacherProfiles.map((p) => [String(p.userId), p]));

    const items = users.map((u) => {
      const sp = studentByUserId.get(String(u._id));
      const tp = teacherByUserId.get(String(u._id));
      return {
        ...u,
        firstName: sp?.firstName ?? tp?.firstName ?? null,
        lastName: sp?.lastName ?? tp?.lastName ?? null,
      };
    });

    return { items, total };
  }

  async getUser(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-passwordHash -refreshTokenHash')
      .exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return user;
  }

  // ─── Account lifecycle ───────────────────────────────────────────────────────

  async suspendUser(id: string, actor: AuditActor) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user.suspended) throw new BadRequestException('Compte déjà suspendu.');

    await this.userModel
      .findByIdAndUpdate(id, { suspended: true, refreshTokenHash: null })
      .exec();

    await this.auditLogService.log({
      action: 'SUSPEND_USER',
      entity: 'User',
      entityId: id,
      actor,
      metadata: { email: user.email, role: user.role },
    });

    return { success: true };
  }

  async reactivateUser(id: string, actor: AuditActor) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (!user.suspended) throw new BadRequestException('Compte non suspendu.');

    await this.userModel
      .findByIdAndUpdate(id, { suspended: false })
      .exec();

    await this.auditLogService.log({
      action: 'REACTIVATE_USER',
      entity: 'User',
      entityId: id,
      actor,
      metadata: { email: user.email, role: user.role },
    });

    return { success: true };
  }

  async resetPassword(id: string, actor: AuditActor) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await this.userModel
      .findByIdAndUpdate(id, { passwordHash, refreshTokenHash: null })
      .exec();

    await this.auditLogService.log({
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: id,
      actor,
      metadata: { email: user.email },
    });

    return { tempPassword };
  }

  async assignRole(id: string, role: Role, actor: AuditActor) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user.role === Role.SuperAdmin) {
      throw new BadRequestException('Le rôle SuperAdmin ne peut pas être modifié.');
    }

    const previousRole = user.role;
    await this.userModel.findByIdAndUpdate(id, { role }).exec();

    await this.auditLogService.log({
      action: 'ASSIGN_ROLE',
      entity: 'User',
      entityId: id,
      actor,
      metadata: { email: user.email, previousRole, newRole: role },
    });

    return { success: true };
  }

  // ─── Teacher creation ────────────────────────────────────────────────────────

  async createTeacher(
    data: { firstName: string; lastName: string; email: string },
    actor: AuditActor,
  ) {
    const email = data.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({ email }).lean().exec();
    if (existing) throw new BadRequestException('Email déjà utilisé.');

    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.userModel.create({ email, passwordHash, role: Role.Teacher });

    await this.teacherModel.findOneAndUpdate(
      { userId: user._id },
      { $set: { userId: user._id, firstName: data.firstName.trim(), lastName: data.lastName.trim() } },
      { upsert: true },
    ).exec();

    await this.auditLogService.log({
      action: 'CREATE_TEACHER',
      entity: 'User',
      entityId: String(user._id),
      actor,
      metadata: { email, firstName: data.firstName, lastName: data.lastName },
    });

    return { userId: String(user._id), email, tempPassword };
  }

  // ─── Bulk student import ─────────────────────────────────────────────────────

  async importStudents(params: {
    rows: ImportStudentRow[];
    offerId: string;
    groupId: string;
    actor: AuditActor;
  }): Promise<ImportResult> {
    const { rows, offerId, groupId, actor } = params;

    const [offer, group] = await Promise.all([
      this.offerModel.findById(offerId).lean().exec(),
      this.groupModel.findById(groupId).lean().exec(),
    ]);

    if (!offer) throw new BadRequestException('Offre introuvable.');
    if (!group) throw new BadRequestException('Groupe introuvable.');
    if (String(group.offerId) !== String(offer._id)) {
      throw new BadRequestException("Le groupe n'appartient pas à cette offre.");
    }

    const academicYear = await this.academicYearModel
      .findById(offer.academicYearId)
      .lean()
      .exec();
    if (!academicYear) throw new BadRequestException('Année académique introuvable.');

    const inscriptionYear = new Date(academicYear.startDate).getFullYear();

    const job = await this.importJobModel.create({
      offerId,
      groupId,
      status: 'processing',
      totalRows: rows.length,
      importedBy: actor.userId,
    });

    const errors: { row: number; message: string; email?: string }[] = [];
    const credentials: { email: string; password: string; studentNumber: string }[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      try {
        this.validateImportRow(row, rowNum);

        const birthDate = new Date(row.birthDate);
        if (Number.isNaN(birthDate.getTime())) {
          throw new Error('Date de naissance invalide.');
        }

        const baseStudentNumber = buildStudentNumber({
          gender: row.gender,
          birthDate,
          firstName: row.firstName,
          lastName: row.lastName,
          inscriptionYear,
        });

        const studentNumber = await this.resolveUniqueStudentNumber(baseStudentNumber);
        const tempPassword = this.generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const email = row.email?.trim().toLowerCase() || undefined;
        const assignedEmail = email ?? `${studentNumber.toLowerCase()}@uniconnect.local`;

        const user = await this.userModel.create({
          email: assignedEmail,
          passwordHash,
          role: Role.Student,
        });

        await this.studentModel.create({
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          studentNumber,
          gender: row.gender,
          birthDate,
          email: assignedEmail,
          phone: row.phone?.trim(),
          address: row.address?.trim(),
          groupId,
          offerId,
          programId: String(offer.programId),
          academicYearId: String(offer.academicYearId),
          userId: user._id,
        });

        credentials.push({
          email: String(user.email),
          password: tempPassword,
          studentNumber,
        });
        successCount++;
      } catch (err: any) {
        errors.push({
          row: rowNum,
          message: err?.message ?? 'Erreur inconnue.',
          email: rows[i].email,
        });
      }
    }

    const errorCount = errors.length;
    await this.importJobModel
      .findByIdAndUpdate(job._id, {
        status: errorCount === rows.length ? 'failed' : 'completed',
        successCount,
        errorCount,
        rowErrors: errors,
        completedAt: new Date(),
      })
      .exec();

    await this.auditLogService.log({
      action: 'BULK_IMPORT_STUDENTS',
      entity: 'BulkImportJob',
      entityId: String(job._id),
      actor,
      metadata: { offerId, groupId, total: rows.length, successCount, errorCount },
    });

    return {
      jobId: String(job._id),
      total: rows.length,
      successCount,
      errorCount,
      errors,
      credentials,
    };
  }

  // ─── Audit logs ──────────────────────────────────────────────────────────────

  async listAuditLogs(params: {
    skip: number;
    limit: number;
    action?: string;
    entity?: string;
    actorId?: string;
  }) {
    const filter: Record<string, any> = {};
    if (params.action) filter.action = { $regex: params.action, $options: 'i' };
    if (params.entity) filter.entity = params.entity;
    if (params.actorId) filter.actorId = params.actorId;

    const [items, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async listImportJobs(params: { skip: number; limit: number }) {
    const [items, total] = await Promise.all([
      this.importJobModel
        .find()
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.importJobModel.countDocuments().exec(),
    ]);
    return { items, total };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
  }

  private validateImportRow(row: ImportStudentRow, rowNum: number) {
    if (!row.firstName?.trim()) throw new Error(`Ligne ${rowNum}: prénom manquant.`);
    if (!row.lastName?.trim()) throw new Error(`Ligne ${rowNum}: nom manquant.`);
    if (!row.gender || !['male', 'female'].includes(row.gender)) {
      throw new Error(`Ligne ${rowNum}: genre invalide (male|female).`);
    }
    if (!row.birthDate) throw new Error(`Ligne ${rowNum}: date de naissance manquante.`);
  }

  // ─── XLSX parsing (UC-A02) ───────────────────────────────────────────────

  async parseXlsxImport(filePath: string): Promise<{
    rows: ImportStudentRow[];
    errors: { row: number; message: string }[];
  }> {
    const workbook = new Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('Fichier Excel vide ou invalide.');
    }

    const rows: ImportStudentRow[] = [];
    const errors: { row: number; message: string }[] = [];
    let headerRow: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      const values = (row.values as any[]).slice(1).map((v) =>
        v != null ? String(v).trim() : '',
      );

      if (rowNumber === 1) {
        headerRow = values.map((v) => v.toLowerCase());
        return;
      }

      const get = (col: string) => {
        const idx = headerRow.indexOf(col);
        return idx >= 0 ? values[idx] ?? '' : '';
      };

      const firstName = get('firstname') || get('prenom') || get('prénom');
      const lastName = get('lastname') || get('nom');
      const gender = get('gender') || get('genre');
      const birthDate = get('birthdate') || get('datenaissance') || get('date_naissance');

      const missingFields: string[] = [];
      if (!firstName) missingFields.push('firstName');
      if (!lastName) missingFields.push('lastName');
      if (!gender) missingFields.push('gender');
      if (!birthDate) missingFields.push('birthDate');

      if (missingFields.length > 0) {
        errors.push({ row: rowNumber, message: `Champs manquants: ${missingFields.join(', ')}` });
        return;
      }

      if (!['male', 'female', 'other'].includes(gender.toLowerCase())) {
        errors.push({ row: rowNumber, message: `Gender invalide: "${gender}" (male|female|other attendu)` });
        return;
      }

      rows.push({
        firstName,
        lastName,
        gender: gender.toLowerCase() as any,
        birthDate,
        email: get('email') || undefined,
        phone: get('phone') || get('telephone') || undefined,
        address: get('address') || get('adresse') || undefined,
      });
    });

    return { rows, errors };
  }

  private async resolveUniqueStudentNumber(base: string): Promise<string> {
    const existing = await this.studentModel
      .find({ studentNumber: { $regex: `^${base}` } })
      .select('studentNumber')
      .lean()
      .exec();

    if (existing.length === 0) return base;

    let maxSuffix = 0;
    for (const s of existing) {
      const suffix = s.studentNumber.slice(base.length);
      const val = suffix ? Number(suffix) : 0;
      if (!Number.isNaN(val) && val > maxSuffix) maxSuffix = val;
    }
    return `${base}${maxSuffix + 1}`;
  }
}
