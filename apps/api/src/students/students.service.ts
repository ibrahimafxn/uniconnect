import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentProfile } from './student-profile.schema';
import { Enrollment, EnrollmentStatus } from './enrollment.schema';
import { StudentStatus } from './student-profile.schema';
import { StudentDocument } from './student-document.schema';

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
    status?: StudentStatus;
    email?: string;
    phone?: string;
    address?: string;
    groupId: string;
    academicYearId: string;
  }) {
    return this.studentModel.create(data);
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

  updateStudent(id: string, data: Partial<StudentProfile>) {
    return this.studentModel.findByIdAndUpdate(id, data, { new: true }).exec();
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
}
