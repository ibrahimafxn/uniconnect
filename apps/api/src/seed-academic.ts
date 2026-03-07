import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AcademicYear } from './academic/academic-year.schema';
import { Program } from './academic/program.schema';
import { Level } from './academic/level.schema';
import { ProgramOffer } from './academic/program-offer.schema';
import { Group } from './academic/group.schema';

async function seedAcademic() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const years = app.get<Model<AcademicYear>>(
      getModelToken(AcademicYear.name),
    );
    const programs = app.get<Model<Program>>(getModelToken(Program.name));
    const levels = app.get<Model<Level>>(getModelToken(Level.name));
    const offers = app.get<Model<ProgramOffer>>(getModelToken(ProgramOffer.name));
    const groups = app.get<Model<Group>>(getModelToken(Group.name));

    const year = await years.findOne({ name: '2025-2026' }).exec();
    const yearDoc =
      year ??
      (await years.create({
        name: '2025-2026',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-07-15'),
        isActive: true,
      }));

    const programsSeed = [
      { name: 'Informatique', code: 'INFO' },
      { name: 'Gestion', code: 'GEST' },
      { name: 'Droit', code: 'DROIT' },
    ];

    const levelNames = ['L1', 'L2', 'L3', 'M1', 'M2'];
    const groupNames = ['G1', 'G2'];

    for (const p of programsSeed) {
      await programs.findOne({ name: p.name }).exec().then(async (prog) => {
        if (!prog) await programs.create(p);
      });
    }

    const programDocs = await programs.find().exec();
    for (const levelName of levelNames) {
      const level =
        (await levels.findOne({ name: levelName }).exec()) ??
        (await levels.create({ name: levelName }));

      for (const prog of programDocs) {
        const offer =
          (await offers
            .findOne({
              programId: new Types.ObjectId(prog._id),
              levelId: new Types.ObjectId(level._id),
              academicYearId: new Types.ObjectId(yearDoc._id),
            })
            .exec()) ??
          (await offers.create({
            programId: prog._id,
            levelId: level._id,
            academicYearId: yearDoc._id,
          }));
        for (const groupName of groupNames) {
          const group = await groups
            .findOne({
              name: groupName,
              levelId: new Types.ObjectId(level._id),
              programId: new Types.ObjectId(prog._id),
              offerId: new Types.ObjectId(offer._id),
            })
            .exec();
          if (!group) {
            await groups.create({
              name: groupName,
              offerId: offer._id,
              levelId: level._id,
              programId: prog._id,
            });
          }
        }
      }
    }

    console.log('Academic seed completed');
    console.log(`AcademicYear: ${yearDoc.name}`);
    console.log(`Programs: ${programsSeed.map((p) => p.name).join(', ')}`);
  } finally {
    await app.close();
  }
}

seedAcademic().catch((err) => {
  console.error('Seed academic failed', err);
  process.exit(1);
});
