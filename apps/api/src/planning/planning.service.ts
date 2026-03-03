import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room } from './room.schema';
import { Session } from './session.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { Role } from '../common/roles.enum';
import { User } from '../users/user.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';

type SessionUser = {
  userId: string;
  email: string;
  role: Role;
};

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel(Room.name)
    private readonly roomModel: Model<Room>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<Session>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly auditLog: AuditLogService,
  ) {}

  listRooms() {
    return this.roomModel.find().sort({ name: 1 }).exec();
  }

  async createRoom(
    data: { name: string; capacity: number; location?: string },
    actor: AuditActor,
  ) {
    const room = await this.roomModel.create(data);
    await this.auditLog.log({
      action: 'planning.room.create',
      entity: 'room',
      entityId: String(room._id),
      actor,
      metadata: { name: room.name, capacity: room.capacity, location: room.location ?? null },
    });
    return room;
  }

  async updateRoom(id: string, data: Partial<Room>, actor: AuditActor) {
    const room = await this.roomModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (room) {
      await this.auditLog.log({
        action: 'planning.room.update',
        entity: 'room',
        entityId: String(room._id),
        actor,
        metadata: data,
      });
    }
    return room;
  }

  async deleteRoom(id: string, actor: AuditActor) {
    const room = await this.roomModel.findByIdAndDelete(id).exec();
    if (room) {
      await this.auditLog.log({
        action: 'planning.room.delete',
        entity: 'room',
        entityId: String(room._id),
        actor,
        metadata: { name: room.name },
      });
    }
    return room;
  }

  async listSessions(params: {
    dateFrom?: string;
    dateTo?: string;
    groupId?: string;
    teacherId?: string;
    roomId?: string;
    user: SessionUser;
  }) {
    const filter: Record<string, any> = {};
    if (params.dateFrom || params.dateTo) {
      filter.date = {};
      if (params.dateFrom) filter.date.$gte = new Date(params.dateFrom);
      if (params.dateTo) filter.date.$lte = new Date(params.dateTo);
    }

    if (
      params.user.role === Role.Teacher ||
      params.user.role === Role.External
    ) {
      filter.teacherId = params.user.userId;
    } else if (params.user.role === Role.Student) {
      const profile = await this.studentModel
        .findOne({ email: params.user.email?.toLowerCase().trim() })
        .lean()
        .exec();
      if (!profile?.groupId) return [];
      filter.groupId = profile.groupId;
    } else {
      if (params.groupId) filter.groupId = params.groupId;
      if (params.teacherId) filter.teacherId = params.teacherId;
      if (params.roomId) filter.roomId = params.roomId;
    }

    return this.sessionModel
      .find(filter)
      .sort({ date: 1, startMinutes: 1 })
      .exec();
  }

  async createSession(
    data: {
      date: string;
      startTime: string;
      endTime: string;
      groupId: string;
      teacherId: string;
      roomId: string;
      label?: string;
    },
    actor: AuditActor,
  ) {
    await this.ensureTeacherExists(data.teacherId);
    const { startMinutes, endMinutes } = this.computeMinutes(
      data.startTime,
      data.endTime,
    );
    const date = this.normalizeDate(data.date);
    await this.ensureNoConflict({
      date,
      startMinutes,
      endMinutes,
      groupId: data.groupId,
      teacherId: data.teacherId,
      roomId: data.roomId,
    });
    const session = await this.sessionModel.create({
      ...data,
      date,
      startMinutes,
      endMinutes,
    });
    await this.auditLog.log({
      action: 'planning.session.create',
      entity: 'session',
      entityId: String(session._id),
      actor,
      metadata: {
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        groupId: String(session.groupId),
        teacherId: String(session.teacherId),
        roomId: String(session.roomId),
        label: session.label ?? null,
      },
    });
    return session;
  }

  async updateSession(
    id: string,
    data: Partial<Session> & { date?: string },
    actor: AuditActor,
  ) {
    const current = await this.sessionModel.findById(id).lean().exec();
    if (!current) {
      throw new BadRequestException('Séance introuvable.');
    }
    const teacherId = String(data.teacherId ?? current.teacherId);
    await this.ensureTeacherExists(teacherId);
    const date = data.date ? this.normalizeDate(data.date) : current.date;
    const startTime = data.startTime ?? current.startTime;
    const endTime = data.endTime ?? current.endTime;
    const { startMinutes, endMinutes } = this.computeMinutes(
      startTime,
      endTime,
    );
    const groupId = (data.groupId ?? current.groupId) as any;
    const roomId = (data.roomId ?? current.roomId) as any;

    await this.ensureNoConflict(
      {
        date,
        startMinutes,
        endMinutes,
        groupId: String(groupId),
        teacherId: String(teacherId),
        roomId: String(roomId),
      },
      id,
    );

    const session = await this.sessionModel
      .findByIdAndUpdate(
        id,
        {
          ...data,
          date,
          startTime,
          endTime,
          startMinutes,
          endMinutes,
        },
        { new: true },
      )
      .exec();
    if (session) {
      await this.auditLog.log({
        action: 'planning.session.update',
        entity: 'session',
        entityId: String(session._id),
        actor,
        metadata: data,
      });
    }
    return session;
  }

  async deleteSession(id: string, actor: AuditActor) {
    const session = await this.sessionModel.findByIdAndDelete(id).exec();
    if (session) {
      await this.auditLog.log({
        action: 'planning.session.delete',
        entity: 'session',
        entityId: String(session._id),
        actor,
        metadata: {
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          groupId: String(session.groupId),
          teacherId: String(session.teacherId),
          roomId: String(session.roomId),
        },
      });
    }
    return session;
  }

  private computeMinutes(start: string, end: string) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
      throw new BadRequestException('Horaire invalide.');
    }
    if (startMinutes >= endMinutes) {
      throw new BadRequestException(
        "L'heure de fin doit être après l'heure de début.",
      );
    }
    return { startMinutes, endMinutes };
  }

  private normalizeDate(dateStr: string) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide.');
    }
    const normalized = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    return normalized;
  }

  private async ensureNoConflict(
    params: {
      date: Date;
      startMinutes: number;
      endMinutes: number;
      groupId: string;
      teacherId: string;
      roomId: string;
    },
    excludeId?: string,
  ) {
    const conflictQuery: any = {
      date: params.date,
      startMinutes: { $lt: params.endMinutes },
      endMinutes: { $gt: params.startMinutes },
      $or: [
        { roomId: new Types.ObjectId(params.roomId) },
        { teacherId: new Types.ObjectId(params.teacherId) },
        { groupId: new Types.ObjectId(params.groupId) },
      ],
    };
    if (excludeId) {
      conflictQuery._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const conflict = await this.sessionModel
      .findOne(conflictQuery)
      .lean()
      .exec();
    if (!conflict) return;

    const reasons: string[] = [];
    if (String(conflict.roomId) === params.roomId) reasons.push('salle');
    if (String(conflict.teacherId) === params.teacherId) reasons.push('enseignant');
    if (String(conflict.groupId) === params.groupId) reasons.push('groupe');
    const reasonText = reasons.length > 0 ? reasons.join(', ') : 'conflit';
    const timeRange =
      conflict.startTime && conflict.endTime
        ? `${conflict.startTime}-${conflict.endTime}`
        : '';
    const dateText = conflict.date
      ? new Date(conflict.date).toISOString().slice(0, 10)
      : '';
    const conflictId = conflict._id ? String(conflict._id) : '';
    const detail = [
      reasonText ? `Ressource: ${reasonText}` : '',
      dateText ? `Date: ${dateText}` : '',
      timeRange ? `Heure: ${timeRange}` : '',
      conflictId ? `Séance: ${conflictId}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    throw new BadRequestException(
      detail ? `Conflit de planning. ${detail}` : 'Conflit de planning.',
    );
  }

  private async ensureTeacherExists(teacherId: string) {
    const user = await this.userModel.findById(teacherId).lean().exec();
    if (!user) {
      throw new BadRequestException('Enseignant introuvable.');
    }
    if (![Role.Teacher, Role.External].includes(user.role as Role)) {
      throw new BadRequestException('Utilisateur non enseignant.');
    }
  }
}
