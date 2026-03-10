import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './user.schema';
import { Role } from '../common/roles.enum';
import { StudentProfile } from '../students/student-profile.schema';
import { TeacherProfile } from '../teacher-profile/teacher-profile.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(StudentProfile.name) private readonly studentModel: Model<StudentProfile>,
    @InjectModel(TeacherProfile.name) private readonly teacherModel: Model<TeacherProfile>,
  ) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  findAll() {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  findTeachers() {
    return this.userModel
      .find({ role: { $in: [Role.Teacher, Role.External] } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async create(email: string, passwordHash: string, role: Role, profileId?: string) {
    const user = await this.userModel.create({ email, passwordHash, role });
    if (profileId) {
      const uid = new Types.ObjectId(user._id as Types.ObjectId);
      if (role === Role.Student) {
        const sp = await this.studentModel.findById(profileId).exec();
        if (!sp) throw new NotFoundException('Profil étudiant introuvable');
        sp.userId = uid;
        await sp.save();
      } else if (role === Role.Teacher || role === Role.External) {
        const tp = await this.teacherModel.findById(profileId).exec();
        if (!tp) throw new NotFoundException('Profil enseignant introuvable');
        (tp as any).userId = uid;
        await tp.save();
      }
    }
    return user;
  }

  update(
    id: string,
    data: { email?: string; passwordHash?: string; role?: Role },
  ) {
    return this.userModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  delete(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  setRefreshTokenHash(userId: string, hash: string | null) {
    return this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash: hash })
      .exec();
  }

  /** Profils étudiants sans compte utilisateur lié */
  listUnlinkedStudents(q?: string) {
    const filter: any = { userId: { $exists: false } };
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ firstName: re }, { lastName: re }, { studentNumber: re }, { email: re }];
    }
    return this.studentModel
      .find(filter)
      .select('firstName lastName studentNumber email')
      .limit(50)
      .lean()
      .exec();
  }

  /** Profils enseignants sans compte utilisateur lié */
  listUnlinkedTeachers(q?: string) {
    const filter: any = { userId: { $exists: false } };
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ firstName: re }, { lastName: re }];
    }
    return this.teacherModel
      .find(filter)
      .select('firstName lastName specialty')
      .limit(50)
      .lean()
      .exec();
  }
}
