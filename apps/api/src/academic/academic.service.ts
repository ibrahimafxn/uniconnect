import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AcademicYear } from './academic-year.schema';
import { Program } from './program.schema';
import { Level } from './level.schema';
import { Group } from './group.schema';

@Injectable()
export class AcademicService {
  constructor(
    @InjectModel(AcademicYear.name)
    private readonly academicYearModel: Model<AcademicYear>,
    @InjectModel(Program.name)
    private readonly programModel: Model<Program>,
    @InjectModel(Level.name)
    private readonly levelModel: Model<Level>,
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

  createProgram(data: { name: string; code?: string }) {
    return this.programModel.create(data);
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

  createLevel(data: { name: string; programId: string }) {
    return this.levelModel.create({
      name: data.name,
      programId: data.programId,
    });
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

  createGroup(data: { name: string; levelId: string }) {
    return this.groupModel.create({ name: data.name, levelId: data.levelId });
  }

  updateAcademicYear(id: string, data: Partial<AcademicYear>) {
    return this.academicYearModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  deleteAcademicYear(id: string) {
    return this.academicYearModel.findByIdAndDelete(id).exec();
  }

  updateProgram(id: string, data: Partial<Program>) {
    return this.programModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  deleteProgram(id: string) {
    return this.programModel.findByIdAndDelete(id).exec();
  }

  updateLevel(id: string, data: Partial<Level>) {
    return this.levelModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  deleteLevel(id: string) {
    return this.levelModel.findByIdAndDelete(id).exec();
  }

  updateGroup(id: string, data: Partial<Group>) {
    return this.groupModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  deleteGroup(id: string) {
    return this.groupModel.findByIdAndDelete(id).exec();
  }
}
