import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentProfile, StudentGender } from './student-profile.schema';
import { Enrollment, EnrollmentStatus } from './enrollment.schema';
import { StudentStatus } from './student-profile.schema';
import { StudentDocument } from './student-document.schema';
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

  createStudent(data: {
    firstName: string;
    lastName: string;
    studentNumber: string;
    gender: StudentGender;
    birthDate: string;
    status?: StudentStatus;
    email?: string;
    phone?: string;
    address?: string;
    groupId: string;
    academicYearId: string;
  }) {
    const birthDate = new Date(data.birthDate);
    if (Number.isNaN(birthDate.getTime())) {
      throw new BadRequestException('Date de naissance invalide.');
    }
    const baseNumber = this.buildBaseStudentNumber({
      studentNumber: data.studentNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      birthDate,
      inscriptionYear: new Date().getFullYear(),
    });
    const normalized = normalizeStudentNumber(data.studentNumber);
    const studentNumber = this.resolveStudentNumberOrThrow({
      normalized,
      baseNumber,
    });

    return this.studentModel
      .create({
        ...data,
        studentNumber,
        birthDate,
      })
      .catch(async (err) => {
        if (err?.code !== 11000) throw err;
        const next = await this.nextAvailableStudentNumber(baseNumber);
        return this.studentModel.create({
          ...data,
          studentNumber: next,
          birthDate,
        });
      });
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
    if (typeof (data as any).birthDate === 'string') {
      payload.birthDate = new Date((data as any).birthDate);
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
    return this.studentModel.findByIdAndUpdate(id, payload, { new: true }).exec();
  }

  deleteStudent(id: string) {
    return this.studentModel.findByIdAndDelete(id).exec();
  }

  getStudent(id: string) {
    return this.studentModel.findById(id).exec();
  }

  updateEnrollment(id: string, data: Partial<Enrollment>) {
    return this.enrollmentModel
      .findByIdAndUpdate(id, data, { new: true })
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
}
