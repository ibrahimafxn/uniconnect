import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { AcademicYear } from './academic-year.schema';
import { Program, ProgramType } from './program.schema';
import { Level, LevelCycle } from './level.schema';
import { ProgramOffer } from './program-offer.schema';
import { Group } from './group.schema';
import { Semester } from './semester.schema';

@Injectable()
export class AcademicService {
  constructor(
    @InjectModel(AcademicYear.name)
    private readonly academicYearModel: Model<AcademicYear>,
    @InjectModel(Program.name)
    private readonly programModel: Model<Program>,
    @InjectModel(Level.name)
    private readonly levelModel: Model<Level>,
    @InjectModel(ProgramOffer.name)
    private readonly offerModel: Model<ProgramOffer>,
    @InjectModel(Semester.name)
    private readonly semesterModel: Model<Semester>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<Group>,
  ) {}

  async listAcademicYears(pagination: { skip: number; limit: number }) {
    const [items, total] = await Promise.all([
      this.academicYearModel
        .find()
        .sort({ startDate: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.academicYearModel.countDocuments().exec(),
    ]);
    return { items, total };
  }

  createAcademicYear(data: {
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }) {
    return this.academicYearModel.create(data);
  }

  async listPrograms(pagination: { skip: number; limit: number }) {
    const [items, total] = await Promise.all([
      this.programModel
        .find()
        .sort({ name: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.programModel.countDocuments().exec(),
    ]);
    return { items, total };
  }

  createProgram(data: { name: string; code?: string; domaine?: string; type?: ProgramType }) {
    return this.programModel.create(data);
  }

  async listSemesters(pagination: { skip: number; limit: number }) {
    const [items, total] = await Promise.all([
      this.semesterModel
        .find()
        .sort({ startDate: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.semesterModel.countDocuments().exec(),
    ]);
    return { items, total };
  }

  createSemester(data: { name: string; startDate: Date; endDate: Date; academicYearId: string }) {
    return this.semesterModel.create(data);
  }

  async listLevels(pagination: { skip: number; limit: number }) {
    const [items, total] = await Promise.all([
      this.levelModel
        .find()
        .sort({ name: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.levelModel.countDocuments().exec(),
    ]);
    return { items, total };
  }

  async listOffers(pagination: { skip: number; limit: number }) {
    const [items, total] = await Promise.all([
      this.offerModel
        .find()
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.offerModel.countDocuments().exec(),
    ]);
    return { items, total };
  }

  createOffer(data: { programId: string; levelId: string; academicYearId: string; capacity: number }) {
    return this.offerModel.create(data);
  }

  createLevel(data: { name: string; cycle: LevelCycle; ects?: number; order?: number }) {
    return this.levelModel.create(data);
  }

  async listGroups(pagination: { skip: number; limit: number }) {
    const [items, total] = await Promise.all([
      this.groupModel
        .find()
        .sort({ name: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.groupModel.countDocuments().exec(),
    ]);
    return { items, total };
  }

  async createGroup(data: { name: string; offerId: string }) {
    const offer = await this.offerModel.findById(data.offerId).lean().exec();
    if (!offer) {
      throw new BadRequestException('Offre introuvable.');
    }
    return this.groupModel.create({
      name: data.name,
      offerId: offer._id,
      programId: offer.programId,
      levelId: offer.levelId,
    });
  }

  updateAcademicYear(id: string, data: Partial<AcademicYear>) {
    return this.academicYearModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  deleteAcademicYear(id: string) {
    return this.academicYearModel.findByIdAndDelete(id).exec();
  }

  updateProgram(id: string, data: Partial<Program>) {
    return this.programModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  deleteProgram(id: string) {
    return this.programModel.findByIdAndDelete(id).exec();
  }


  updateLevel(id: string, data: Partial<Level>) {
    return this.levelModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  updateSemester(id: string, data: Partial<Semester>) {
    return this.semesterModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  deleteSemester(id: string) {
    return this.semesterModel.findByIdAndDelete(id).exec();
  }

  updateOffer(id: string, data: Partial<ProgramOffer>) {
    return this.offerModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  deleteOffer(id: string) {
    return this.offerModel.findByIdAndDelete(id).exec();
  }

  deleteLevel(id: string) {
    return this.levelModel.findByIdAndDelete(id).exec();
  }

  async updateGroup(id: string, data: { name?: string; offerId?: string }) {
    if (data.offerId) {
      const offer = await this.offerModel.findById(data.offerId).lean().exec();
      if (!offer) {
        throw new BadRequestException('Offre introuvable.');
      }
      (data as any).programId = offer.programId as any;
      (data as any).levelId = offer.levelId as any;
    }
    return this.groupModel
      .findByIdAndUpdate(id, data as any, { returnDocument: 'after' })
      .exec();
  }

  deleteGroup(id: string) {
    return this.groupModel.findByIdAndDelete(id).exec();
  }
}
