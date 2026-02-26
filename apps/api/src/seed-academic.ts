import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AcademicYear } from './academic/academic-year.schema';
import { Program } from './academic/program.schema';
import { Level } from './academic/level.schema';
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
      const prog =
        (await programs.findOne({ name: p.name }).exec()) ??
        (await programs.create(p));

      for (const levelName of levelNames) {
        const level =
          (await levels
            .findOne({
              name: levelName,
              programId: new Types.ObjectId(prog._id),
            })
            .exec()) ??
          (await levels.create({ name: levelName, programId: prog._id }));

        for (const groupName of groupNames) {
          const group = await groups
            .findOne({
              name: groupName,
              levelId: new Types.ObjectId(level._id),
            })
            .exec();
          if (!group) {
            await groups.create({ name: groupName, levelId: level._id });
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
