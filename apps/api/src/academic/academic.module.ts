import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AcademicYear, AcademicYearSchema } from './academic-year.schema';
import { Program, ProgramSchema } from './program.schema';
import { Level, LevelSchema } from './level.schema';
import { Group, GroupSchema } from './group.schema';
import { ProgramOffer, ProgramOfferSchema } from './program-offer.schema';
import { Semester, SemesterSchema } from './semester.schema';
import { AcademicService } from './academic.service';
import { AcademicController } from './academic.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AcademicYear.name, schema: AcademicYearSchema },
      { name: Program.name, schema: ProgramSchema },
      { name: Level.name, schema: LevelSchema },
      { name: ProgramOffer.name, schema: ProgramOfferSchema },
      { name: Semester.name, schema: SemesterSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  providers: [AcademicService],
  controllers: [AcademicController],
  exports: [MongooseModule],
})
export class AcademicModule {}
