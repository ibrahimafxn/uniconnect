import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AcademicModule } from './academic/academic.module';
import { StudentsModule } from './students/students.module';
import { PaymentsModule } from './payments/payments.module';
import { PlanningModule } from './planning/planning.module';
import { AuditModule } from './audit/audit.module';
import { MessagesModule } from './messages/messages.module';
import { NotesModule } from './notes/notes.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TeacherProfileModule } from './teacher-profile/teacher-profile.module';
import { ScolariteModule } from './scolarite/scolarite.module';
import { AdminModule } from './admin/admin.module';
import { ApplicationsModule } from './applications/applications.module';
import { ResourcesModule } from './resources/resources.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { DocumentRequestsModule } from './document-requests/document-requests.module';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/uniconnect',
    ),
    UsersModule,
    AuthModule,
    AcademicModule,
    StudentsModule,
    PaymentsModule,
    PlanningModule,
    AuditModule,
    MessagesModule,
    NotesModule,
    AttendanceModule,
    TeacherProfileModule,
    ScolariteModule,
    AdminModule,
    ApplicationsModule,
    ResourcesModule,
    AssignmentsModule,
    DocumentRequestsModule,
    AnnouncementsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
