import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherProfileService } from './teacher-profile.service';
import { TeacherProfileController } from './teacher-profile.controller';
import { TeacherProfile, TeacherProfileSchema } from './teacher-profile.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: TeacherProfile.name, schema: TeacherProfileSchema },
    ]),
  ],
  providers: [TeacherProfileService],
  controllers: [TeacherProfileController],
})
export class TeacherProfileModule {}
