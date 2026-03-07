import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Group } from '../academic/group.schema';
import { Program } from '../academic/program.schema';
import { Level } from '../academic/level.schema';

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const groups = app.get<Model<Group>>(getModelToken(Group.name));
    const programs = app.get<Model<Program>>(getModelToken(Program.name));
    const levels = app.get<Model<Level>>(getModelToken(Level.name));

    const programIdEnv = process.env.PROGRAM_ID?.trim();
    const programNameEnv = process.env.PROGRAM_NAME?.trim();
    const groupProgramMapRaw = process.env.GROUP_PROGRAM_MAP?.trim();

    let programId: Types.ObjectId | null = null;
    const programById = new Map<string, Program>();
    const programByName = new Map<string, Program>();
    const levelById = new Map<string, Level>();

    const allPrograms = await programs.find().exec();
    allPrograms.forEach((p) => {
      programById.set(String(p._id), p);
      programByName.set(p.name.toLowerCase(), p);
    });

    const allLevels = await levels.find().exec();
    allLevels.forEach((l) => levelById.set(String(l._id), l));

    if (programIdEnv) {
      programId = new Types.ObjectId(programIdEnv);
    } else if (programNameEnv) {
      const program = programByName.get(programNameEnv.toLowerCase());
      if (program?._id) programId = new Types.ObjectId(program._id);
    } else {
      if (allPrograms.length === 1) {
        programId = new Types.ObjectId(allPrograms[0]._id);
      } else {
        // Pas de filière par défaut: on tentera l'inférence ou le mapping par groupe.
        programId = null;
      }
    }

    let groupProgramMap: Record<string, string> = {};
    if (groupProgramMapRaw) {
      try {
        groupProgramMap = JSON.parse(groupProgramMapRaw);
      } catch {
        console.error('GROUP_PROGRAM_MAP invalide. Utilisez un JSON valide.');
        process.exitCode = 1;
        return;
      }
    }

    const targetGroups = await groups
      .find({ $or: [{ programId: { $exists: false } }, { programId: null }] })
      .exec();

    let updated = 0;
    let skipped = 0;

    const normalize = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9]+/g, '');

    const inferProgramId = (groupName: string): Types.ObjectId | null => {
      const n = normalize(groupName);
      const matches: Program[] = [];
      for (const p of allPrograms) {
        const nameKey = normalize(p.name);
        const codeKey = p.code ? normalize(p.code) : '';
        if ((codeKey && n.includes(codeKey)) || (nameKey && n.includes(nameKey))) {
          matches.push(p);
        }
      }
      if (matches.length === 1) return new Types.ObjectId(matches[0]._id);
      return null;
    };

    for (const g of targetGroups) {
      const level = levelById.get(String(g.levelId));
      const keyById = String(g._id);
      const keyByNameLevel = level ? `${g.name}|${level.name}` : '';
      const keyByName = g.name;

      const mapValue =
        groupProgramMap[keyById] ??
        (keyByNameLevel ? groupProgramMap[keyByNameLevel] : undefined) ??
        groupProgramMap[keyByName];

      let finalProgramId: Types.ObjectId | null = null;

      if (mapValue) {
        if (programById.has(mapValue)) {
          finalProgramId = new Types.ObjectId(mapValue);
        } else {
          const p = programByName.get(mapValue.toLowerCase());
          if (p?._id) finalProgramId = new Types.ObjectId(p._id);
        }
      }

      if (!finalProgramId) {
        finalProgramId = inferProgramId(g.name);
      }

      if (!finalProgramId && programId) {
        finalProgramId = programId;
      }

      if (!finalProgramId) {
        skipped += 1;
        continue;
      }

      await groups.updateOne({ _id: g._id }, { $set: { programId: finalProgramId } }).exec();
      updated += 1;
    }

    console.log(`Groups updated: ${updated}`);
    if (skipped > 0) {
      console.log(`Groups skipped (no mapping): ${skipped}`);
    }
  } finally {
    await app.close();
  }
}

migrate().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
