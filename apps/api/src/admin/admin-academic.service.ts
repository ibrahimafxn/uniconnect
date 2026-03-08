import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AcademicYear } from '../academic/academic-year.schema';
import { Semester } from '../academic/semester.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { Group } from '../academic/group.schema';
import { Program } from '../academic/program.schema';
import { Level } from '../academic/level.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';
import {
  AcademicCalendarEvent,
  CalendarEventType,
} from './schemas/academic-calendar-event.schema';

export interface SemesterInit {
  name: string;
  startDate: string;
  endDate: string;
}

export interface OfferInit {
  programId: string;
  levelId: string;
  capacity: number;
}

@Injectable()
export class AdminAcademicService {
  constructor(
    @InjectModel(AcademicYear.name)
    private readonly academicYearModel: Model<AcademicYear>,
    @InjectModel(Semester.name)
    private readonly semesterModel: Model<Semester>,
    @InjectModel(ProgramOffer.name)
    private readonly offerModel: Model<ProgramOffer>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<Group>,
    @InjectModel(Program.name)
    private readonly programModel: Model<Program>,
    @InjectModel(Level.name)
    private readonly levelModel: Model<Level>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    @InjectModel(AcademicCalendarEvent.name)
    private readonly calendarEventModel: Model<AcademicCalendarEvent>,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ─── UC-A01 : Initialisation d'année académique ──────────────────────────────

  async initializeYear(params: {
    name: string;
    startDate: string;
    endDate: string;
    isActive?: boolean;
    semesters: SemesterInit[];
    offers: OfferInit[];
    actor: AuditActor;
  }) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Dates invalides.');
    }
    if (end <= start) {
      throw new BadRequestException('La date de fin doit être après la date de début.');
    }

    // Deactivate existing active year if new one is set as active
    if (params.isActive) {
      await this.academicYearModel
        .updateMany({ isActive: true }, { isActive: false })
        .exec();
    }

    const year = await this.academicYearModel.create({
      name: params.name,
      startDate: start,
      endDate: end,
      isActive: params.isActive ?? false,
    });

    // Create semesters
    const semesters = await Promise.all(
      params.semesters.map((s) =>
        this.semesterModel.create({
          name: s.name,
          startDate: new Date(s.startDate),
          endDate: new Date(s.endDate),
          academicYearId: year._id,
        }),
      ),
    );

    // Validate programs & levels exist before creating offers
    const offerIds: string[] = [];
    for (const o of params.offers) {
      const [program, level] = await Promise.all([
        this.programModel.findById(o.programId).lean().exec(),
        this.levelModel.findById(o.levelId).lean().exec(),
      ]);
      if (!program) throw new BadRequestException(`Programme ${o.programId} introuvable.`);
      if (!level) throw new BadRequestException(`Niveau ${o.levelId} introuvable.`);

      const offer = await this.offerModel.create({
        programId: o.programId,
        levelId: o.levelId,
        academicYearId: String(year._id),
        capacity: o.capacity,
      });
      offerIds.push(String(offer._id));
    }

    await this.auditLogService.log({
      action: 'INIT_ACADEMIC_YEAR',
      entity: 'AcademicYear',
      entityId: String(year._id),
      actor: params.actor,
      metadata: {
        name: params.name,
        semesterCount: semesters.length,
        offerCount: offerIds.length,
      },
    });

    return { year, semesters, offerCount: offerIds.length };
  }

  // ─── UC-A06 : Clôture d'année académique ────────────────────────────────────

  async closeYear(yearId: string, actor: AuditActor) {
    const year = await this.academicYearModel.findById(yearId).exec();
    if (!year) throw new NotFoundException('Année académique introuvable.');
    if (!year.isActive) {
      throw new BadRequestException("L'année académique n'est pas active.");
    }

    // Count students still enrolled in this year
    const activeStudentCount = await this.studentModel
      .countDocuments({ academicYearId: yearId })
      .exec();

    // Archive: mark as inactive
    await this.academicYearModel
      .findByIdAndUpdate(yearId, { isActive: false })
      .exec();

    await this.auditLogService.log({
      action: 'CLOSE_ACADEMIC_YEAR',
      entity: 'AcademicYear',
      entityId: yearId,
      actor,
      metadata: { name: year.name, activeStudentCount },
    });

    return {
      success: true,
      closedYear: year.name,
      archivedStudents: activeStudentCount,
    };
  }

  // ─── Year summary / report ───────────────────────────────────────────────────

  async getYearSummary(yearId: string) {
    const year = await this.academicYearModel.findById(yearId).lean().exec();
    if (!year) throw new NotFoundException('Année académique introuvable.');

    const [offers, semesters, studentCount] = await Promise.all([
      this.offerModel
        .find({ academicYearId: yearId })
        .populate('programId', 'name code')
        .populate('levelId', 'name cycle')
        .lean()
        .exec(),
      this.semesterModel
        .find({ academicYearId: yearId })
        .sort({ startDate: 1 })
        .lean()
        .exec(),
      this.studentModel.countDocuments({ academicYearId: yearId }).exec(),
    ]);

    const groupCounts = await Promise.all(
      offers.map(async (o) => ({
        offerId: String(o._id),
        groupCount: await this.groupModel
          .countDocuments({ offerId: o._id })
          .exec(),
      })),
    );

    return {
      year,
      semesters,
      offers: offers.map((o) => ({
        ...o,
        groupCount: groupCounts.find((g) => g.offerId === String(o._id))?.groupCount ?? 0,
      })),
      totalStudents: studentCount,
    };
  }

  // ─── Calendrier universitaire ────────────────────────────────────────────────

  async createCalendarEvent(params: {
    academicYearId: string;
    type: CalendarEventType;
    label: string;
    startDate: string;
    endDate: string;
    offerId?: string;
    actor: AuditActor;
  }) {
    const year = await this.academicYearModel
      .findById(params.academicYearId)
      .lean()
      .exec();
    if (!year) throw new NotFoundException('Année académique introuvable.');

    const event = await this.calendarEventModel.create({
      academicYearId: params.academicYearId,
      type: params.type,
      label: params.label,
      startDate: new Date(params.startDate),
      endDate: new Date(params.endDate),
      offerId: params.offerId,
    });

    await this.auditLogService.log({
      action: 'CREATE_CALENDAR_EVENT',
      entity: 'AcademicCalendarEvent',
      entityId: String(event._id),
      actor: params.actor,
      metadata: { type: params.type, label: params.label },
    });

    return event;
  }

  async listCalendarEvents(params: {
    academicYearId?: string;
    type?: CalendarEventType;
    skip: number;
    limit: number;
  }) {
    const filter: Record<string, any> = {};
    if (params.academicYearId) filter.academicYearId = params.academicYearId;
    if (params.type) filter.type = params.type;

    const [items, total] = await Promise.all([
      this.calendarEventModel
        .find(filter)
        .sort({ startDate: 1 })
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.calendarEventModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async deleteCalendarEvent(id: string, actor: AuditActor) {
    const event = await this.calendarEventModel.findByIdAndDelete(id).exec();
    if (!event) throw new NotFoundException('Événement introuvable.');

    await this.auditLogService.log({
      action: 'DELETE_CALENDAR_EVENT',
      entity: 'AcademicCalendarEvent',
      entityId: id,
      actor,
    });

    return { success: true };
  }

  async updateOfferCapacity(
    offerId: string,
    capacity: number,
    actor: AuditActor,
  ) {
    if (capacity < 0) throw new BadRequestException('Capacité invalide.');
    const offer = await this.offerModel
      .findByIdAndUpdate(offerId, { capacity }, { returnDocument: 'after' })
      .exec();
    if (!offer) throw new NotFoundException('Offre introuvable.');

    await this.auditLogService.log({
      action: 'UPDATE_OFFER_CAPACITY',
      entity: 'ProgramOffer',
      entityId: offerId,
      actor,
      metadata: { capacity },
    });

    return offer;
  }
}
