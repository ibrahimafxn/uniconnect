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
import { ResourcesModule } from './resources/resources.module';
import { JuryModule } from './jury/jury.module';

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
    ResourcesModule,
    JuryModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
