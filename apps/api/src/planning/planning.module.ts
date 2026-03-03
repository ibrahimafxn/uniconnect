import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';
import { Room, RoomSchema } from './room.schema';
import { Session, SessionSchema } from './session.schema';
import { StudentProfile, StudentProfileSchema } from '../students/student-profile.schema';
import { User, UserSchema } from '../users/user.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: Session.name, schema: SessionSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [PlanningService],
  controllers: [PlanningController],
})
export class PlanningModule {}
