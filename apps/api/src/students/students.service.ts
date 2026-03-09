import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { StudentProfile, StudentGender } from './student-profile.schema';
import { Enrollment, EnrollmentStatus } from './enrollment.schema';
import { StudentStatus } from './student-profile.schema';
import { StudentDocument } from './student-document.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { Group } from '../academic/group.schema';
import { AcademicYear } from '../academic/academic-year.schema';
import { AcademicCalendarEvent, CalendarEventType } from '../admin/schemas/academic-calendar-event.schema';
import { User } from '../users/user.schema';
import { Role } from '../common/roles.enum';
import {
  buildStudentNumber,
  normalizeStudentNumber,
  STUDENT_NUMBER_REGEX,
} from './student-number';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<Enrollment>,
    @InjectModel(StudentDocument.name)
    private readonly documentModel: Model<StudentDocument>,
    @InjectModel(AcademicYear.name)
    private readonly academicYearModel: Model<AcademicYear>,
    @InjectModel(ProgramOffer.name)
    private readonly offerModel: Model<ProgramOffer>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<Group>,
    @InjectModel(AcademicCalendarEvent.name)
    private readonly calendarEventModel: Model<AcademicCalendarEvent>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async listStudents(params: { skip: number; limit: number; q?: string }) {
    const filter = params.q
      ? {
          $or: [
            { firstName: { $regex: params.q, $options: 'i' } },
            { lastName: { $regex: params.q, $options: 'i' } },
            { studentNumber: { $regex: params.q, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.studentModel
        .find(filter)
        .sort({ lastName: 1, firstName: 1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.studentModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async createStudent(data: {
    firstName: string;
    lastName: string;
    studentNumber?: string;
    gender: StudentGender;
    birthDate: string;
    status?: StudentStatus;
    email?: string;
    phone?: string;
    address?: string;
    groupId: string;
    offerId?: string;
    programId?: string;
    academicYearId?: string;
  }) {
    if (data.offerId) {
      // hydrate from offer to keep data consistent
      return this.createStudentFromOffer({ ...data, offerId: data.offerId });
    }
    const fromGroup = await this.groupModel.findById(data.groupId).lean().exec();
    if (fromGroup?.offerId) {
      return this.createStudentFromOffer({
        ...data,
        offerId: String(fromGroup.offerId),
      });
    }
    if (!data.programId || !data.academicYearId) {
      throw new BadRequestException('Filière et année académique requises.');
    }
    return this.createStudentCore({
      ...data,
      programId: data.programId,
      academicYearId: data.academicYearId,
    });
  }

  private async createStudentFromOffer(data: {
    firstName: string;
    lastName: string;
    studentNumber?: string;
    gender: StudentGender;
    birthDate: string;
    status?: StudentStatus;
    email?: string;
    phone?: string;
    address?: string;
    groupId: string;
    offerId: string;
    programId?: string;
    academicYearId?: string;
  }) {
    const offer = await this.offerModel.findById(data.offerId).lean().exec();
    if (!offer) {
      throw new BadRequestException('Offre introuvable.');
    }
    const group = await this.groupModel.findById(data.groupId).lean().exec();
    if (group && String(group.offerId) !== String(offer._id)) {
      throw new BadRequestException('Le groupe ne correspond pas à l’offre.');
    }
    const payload = {
      ...data,
      programId: String(offer.programId),
      academicYearId: String(offer.academicYearId),
    };
    return this.createStudentCore(payload as any);
  }

  private async createStudentCore(data: {
    firstName: string;
    lastName: string;
    studentNumber?: string;
    gender: StudentGender;
    birthDate: string;
    status?: StudentStatus;
    email?: string;
    phone?: string;
    address?: string;
    groupId: string;
    offerId?: string;
    programId: string;
    academicYearId: string;
  }) {
    const birthDate = new Date(data.birthDate);
    if (Number.isNaN(birthDate.getTime())) {
      throw new BadRequestException('Date de naissance invalide.');
    }
    const normalizedEmail = this.normalizeEmail(data.email);
    if (normalizedEmail) {
      await this.ensureEmailUnique(normalizedEmail);
    }
    const inscriptionYear = await this.resolveInscriptionYear(
      data.academicYearId,
    );
    const normalizedInput = data.studentNumber
      ? normalizeStudentNumber(data.studentNumber)
      : undefined;
    const baseNumber = normalizedInput
      ? this.buildBaseStudentNumber({
          studentNumber: normalizedInput,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          birthDate,
          inscriptionYear,
        })
      : buildStudentNumber({
          gender: data.gender,
          birthDate,
          firstName: data.firstName,
          lastName: data.lastName,
          inscriptionYear,
        });
    const normalized = normalizedInput ?? baseNumber;
    const studentNumber = this.resolveStudentNumberOrThrow({
      normalized,
      baseNumber,
    });

    const assignedEmail = normalizedEmail ?? `${studentNumber.toLowerCase()}@uniconnect.local`;

    const profile = await this.studentModel
      .create({
        ...data,
        email: assignedEmail,
        studentNumber,
        birthDate,
      })
      .catch(async (err) => {
        if (err?.code !== 11000) throw err;
        const next = await this.nextAvailableStudentNumber(baseNumber);
        return this.studentModel.create({
          ...data,
          email: assignedEmail,
          studentNumber: next,
          birthDate,
        });
      });

    const existingUser = await this.userModel.findOne({ email: assignedEmail }).lean().exec();
    let tempPassword: string | undefined;
    if (!existingUser) {
      tempPassword = Math.random().toString(36).slice(2, 12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      await this.userModel.create({ email: assignedEmail, passwordHash, role: Role.Student });
    }

    return { profile, email: assignedEmail, tempPassword };
  }

  async listEnrollments(params: { skip: number; limit: number }) {
    const [items, total] = await Promise.all([
      this.enrollmentModel
        .find()
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.enrollmentModel.countDocuments().exec(),
    ]);
    return { items, total };
  }

  createEnrollment(data: {
    studentId: string;
    academicYearId: string;
    status?: EnrollmentStatus;
  }) {
    return this.enrollmentModel.create({
      studentId: data.studentId,
      academicYearId: data.academicYearId,
      status: data.status ?? EnrollmentStatus.Pending,
    });
  }

  async updateStudent(id: string, data: Partial<StudentProfile>) {
    const current = await this.studentModel.findById(id).lean().exec();
    const payload: Partial<StudentProfile> = { ...data };
    if (typeof (data as any).email === 'string') {
      const normalized = this.normalizeEmail((data as any).email);
      if (normalized) {
        await this.ensureEmailUnique(normalized, id);
        payload.email = normalized;
      } else {
        delete (payload as any).email;
      }
    }
    if (typeof (data as any).birthDate === 'string') {
      payload.birthDate = new Date((data as any).birthDate);
    }
    if (payload.offerId || payload.groupId) {
      const offerId = payload.offerId ?? current?.offerId;
      if (payload.groupId && !payload.offerId) {
        const group = await this.groupModel.findById(payload.groupId).lean().exec();
        if (group?.offerId) {
          payload.offerId = group.offerId as any;
        }
      }
      if (offerId) {
        const offer = await this.offerModel.findById(offerId).lean().exec();
        if (offer) {
          payload.programId = offer.programId as any;
          payload.academicYearId = offer.academicYearId as any;
        }
      }
      if (payload.groupId && payload.offerId) {
        const group = await this.groupModel.findById(payload.groupId).lean().exec();
        if (group && String(group.offerId) !== String(payload.offerId)) {
          throw new BadRequestException('Le groupe ne correspond pas à l’offre.');
        }
      }
    }
    if (current) {
      const merged = { ...current, ...payload } as StudentProfile;
      const hasAll =
        merged.studentNumber &&
        merged.firstName &&
        merged.lastName &&
        merged.gender &&
        merged.birthDate;
      if (hasAll) {
        this.ensureStudentNumberMatches({
          studentNumber: merged.studentNumber,
          firstName: merged.firstName,
          lastName: merged.lastName,
          gender: merged.gender,
          birthDate: new Date(merged.birthDate),
        });
      }
    }
    return this.studentModel
      .findByIdAndUpdate(id, payload, { returnDocument: 'after' })
      .exec();
  }

  deleteStudent(id: string) {
    return this.studentModel.findByIdAndDelete(id).exec();
  }

  getStudent(id: string) {
    return this.studentModel.findById(id).exec();
  }

  findByEmail(email: string) {
    const normalized = this.normalizeEmail(email);
    if (!normalized) return null;
    return this.studentModel.findOne({ email: normalized }).lean().exec();
  }

  async updateStudentSelfByEmail(email: string, data: { email?: string; phone?: string; address?: string; notificationPrefs?: any }) {
    const normalized = this.normalizeEmail(email);
    if (!normalized) throw new BadRequestException('Email requis.');
    const student = await this.studentModel.findOne({ email: normalized }).lean().exec();
    if (!student) throw new BadRequestException('Profil étudiant introuvable.');
    const payload: any = {};
    if (typeof data.email === 'string') {
      const next = this.normalizeEmail(data.email);
      if (next) {
        await this.ensureEmailUnique(next, String(student._id));
        payload.email = next;
      }
    }
    if (typeof data.phone === 'string') payload.phone = data.phone;
    if (typeof data.address === 'string') payload.address = data.address;
    if (data.notificationPrefs && typeof data.notificationPrefs === 'object') {
      payload.notificationPrefs = data.notificationPrefs;
    }
    return this.studentModel.findByIdAndUpdate(student._id, payload, { returnDocument: 'after' }).exec();
  }

  updateEnrollment(id: string, data: Partial<Enrollment>) {
    return this.enrollmentModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  deleteEnrollment(id: string) {
    return this.enrollmentModel.findByIdAndDelete(id).exec();
  }

  async listDocuments(studentId: string, params: { skip: number; limit: number }) {
    const [items, total] = await Promise.all([
      this.documentModel
        .find({ studentId })
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.documentModel.countDocuments({ studentId }).exec(),
    ]);
    return { items, total };
  }

  async listMyDocuments(email: string, params: { skip: number; limit: number }) {
    const normalized = this.normalizeEmail(email);
    if (!normalized) return { items: [], total: 0 };
    const student = await this.studentModel.findOne({ email: normalized }).lean().exec();
    if (!student) return { items: [], total: 0 };
    return this.listDocuments(String(student._id), params);
  }

  async listMyCalendarEvents(email: string, params: {
    type?: CalendarEventType;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }) {
    const normalized = this.normalizeEmail(email);
    if (!normalized) return [];
    const student = await this.studentModel.findOne({ email: normalized }).lean().exec();
    if (!student) return [];

    const filter: Record<string, any> = {
      academicYearId: student.academicYearId,
      $or: [
        { offerId: student.offerId },
        { offerId: { $exists: false } },
        { offerId: null },
      ],
    };
    if (params.type) filter.type = params.type;

    const from = params.dateFrom ? new Date(params.dateFrom) : null;
    const to = params.dateTo ? new Date(params.dateTo) : null;
    if (from && !Number.isNaN(from.getTime())) {
      filter.endDate = { ...(filter.endDate || {}), $gte: from };
    }
    if (to && !Number.isNaN(to.getTime())) {
      filter.startDate = { ...(filter.startDate || {}), $lte: to };
    }

    const limit = Math.min(Math.max(params.limit ?? 12, 1), 50);
    return this.calendarEventModel
      .find(filter)
      .sort({ startDate: 1 })
      .limit(limit)
      .lean()
      .exec();
  }

  createDocument(data: {
    studentId: string;
    label?: string;
    originalName: string;
    fileName: string;
    path: string;
    mimeType: string;
    size: number;
  }) {
    return this.documentModel.create(data);
  }

  getDocument(id: string) {
    return this.documentModel.findById(id).exec();
  }

  deleteDocument(id: string) {
    return this.documentModel.findByIdAndDelete(id).exec();
  }

  updateDocument(id: string, data: Partial<StudentDocument>) {
    return this.documentModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  private ensureStudentNumberMatches(params: {
    studentNumber: string;
    firstName: string;
    lastName: string;
    gender: StudentGender;
    birthDate: Date;
    inscriptionYear?: number;
  }) {
    const normalized = normalizeStudentNumber(params.studentNumber);
    if (!STUDENT_NUMBER_REGEX.test(normalized)) {
      throw new BadRequestException(
        'Matricule invalide. Format attendu: ML{0|1}{MM}{Initiales}{YYYY}[N].',
      );
    }
    const yearFromNumber = Number(normalized.slice(7, 11));
    const expected = buildStudentNumber({
      gender: params.gender,
      birthDate: params.birthDate,
      firstName: params.firstName,
      lastName: params.lastName,
      inscriptionYear: params.inscriptionYear ?? yearFromNumber,
    });
    if (normalized !== expected && !normalized.startsWith(expected)) {
      throw new BadRequestException(
        `Matricule invalide. Attendu: ${expected}.`,
      );
    }
  }

  private buildBaseStudentNumber(params: {
    studentNumber: string;
    firstName: string;
    lastName: string;
    gender: StudentGender;
    birthDate: Date;
    inscriptionYear: number;
  }) {
    this.ensureStudentNumberMatches(params);
    return buildStudentNumber({
      gender: params.gender,
      birthDate: params.birthDate,
      firstName: params.firstName,
      lastName: params.lastName,
      inscriptionYear: params.inscriptionYear,
    });
  }

  private resolveStudentNumberOrThrow(params: {
    normalized: string;
    baseNumber: string;
  }) {
    if (params.normalized === params.baseNumber) return params.baseNumber;
    if (
      params.normalized.startsWith(params.baseNumber) &&
      /^\d+$/.test(params.normalized.slice(params.baseNumber.length))
    ) {
      return params.normalized;
    }
    throw new BadRequestException(
      `Matricule invalide. Attendu: ${params.baseNumber}.`,
    );
  }

  private async nextAvailableStudentNumber(baseNumber: string) {
    const existing = await this.studentModel
      .find({
        studentNumber: { $regex: `^${baseNumber}\\d*$` },
      })
      .select('studentNumber')
      .lean()
      .exec();
    let maxSuffix = 0;
    for (const item of existing) {
      const num = normalizeStudentNumber(item.studentNumber);
      const suffix = num.slice(baseNumber.length);
      const value = suffix ? Number(suffix) : 0;
      if (!Number.isNaN(value) && value > maxSuffix) {
        maxSuffix = value;
      }
    }
    return `${baseNumber}${maxSuffix + 1}`;
  }

  private normalizeEmail(email?: string) {
    if (!email) return undefined;
    const normalized = email.trim().toLowerCase();
    return normalized.length > 0 ? normalized : undefined;
  }

  private async ensureEmailUnique(email: string, excludeId?: string) {
    const filter: any = { email };
    if (excludeId) filter._id = { $ne: excludeId };
    const existing = await this.studentModel.findOne(filter).select('_id').lean().exec();
    if (existing) {
      throw new BadRequestException('Email déjà utilisé.');
    }
  }

  private async resolveInscriptionYear(academicYearId?: string) {
    if (academicYearId) {
      const year = await this.academicYearModel
        .findById(academicYearId)
        .lean()
        .exec();
      if (!year) {
        throw new BadRequestException('Année académique introuvable.');
      }
      return new Date(year.startDate).getFullYear();
    }
    const active = await this.academicYearModel
      .findOne({ isActive: true })
      .sort({ startDate: -1 })
      .lean()
      .exec();
    if (active) {
      return new Date(active.startDate).getFullYear();
    }
    return new Date().getFullYear();
  }
}
