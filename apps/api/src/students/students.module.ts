import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentProfile, StudentProfileSchema } from './student-profile.schema';
import { Enrollment, EnrollmentSchema } from './enrollment.schema';
import { StudentDocument, StudentDocumentSchema } from './student-document.schema';
import { AcademicYear, AcademicYearSchema } from '../academic/academic-year.schema';
import { ProgramOffer, ProgramOfferSchema } from '../academic/program-offer.schema';
import { Group, GroupSchema } from '../academic/group.schema';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: StudentDocument.name, schema: StudentDocumentSchema },
      { name: AcademicYear.name, schema: AcademicYearSchema },
      { name: ProgramOffer.name, schema: ProgramOfferSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  providers: [StudentsService],
  controllers: [StudentsController],
  exports: [MongooseModule],
})
export class StudentsModule {}
