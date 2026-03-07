import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Group } from '../academic/group.schema';
import { Level } from '../academic/level.schema';
import { Program } from '../academic/program.schema';
import { writeFileSync } from 'fs';

async function exportMap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const groups = app.get<Model<Group>>(getModelToken(Group.name));
    const levels = app.get<Model<Level>>(getModelToken(Level.name));
    const programs = app.get<Model<Program>>(getModelToken(Program.name));

    const [groupDocs, levelDocs, programDocs] = await Promise.all([
      groups.find().exec(),
      levels.find().exec(),
      programs.find().exec(),
    ]);

    const levelById = new Map(levelDocs.map((l) => [String(l._id), l]));
    const programById = new Map(programDocs.map((p) => [String(p._id), p]));

    const list = groupDocs.map((g) => {
      const level = levelById.get(String(g.levelId));
      const program = programById.get(String((g as any).programId));
      return {
        groupId: String(g._id),
        groupName: g.name,
        levelId: String(g.levelId),
        levelName: level?.name ?? null,
        programId: program ? String(program._id) : null,
        programName: program?.name ?? null,
      };
    });

    const mapById: Record<string, string | null> = {};
    const mapByNameLevel: Record<string, string | null> = {};

    list.forEach((g) => {
      mapById[g.groupId] = g.programName ?? null;
      if (g.levelName) {
        mapByNameLevel[`${g.groupName}|${g.levelName}`] = g.programName ?? null;
      }
    });

    writeFileSync('/tmp/groups-program-list.json', JSON.stringify(list, null, 2));
    writeFileSync('/tmp/groups-program-map.byId.json', JSON.stringify(mapById, null, 2));
    writeFileSync('/tmp/groups-program-map.byNameLevel.json', JSON.stringify(mapByNameLevel, null, 2));

    console.log('Export terminé.');
    console.log('Fichiers générés :');
    console.log('- /tmp/groups-program-list.json');
    console.log('- /tmp/groups-program-map.byId.json');
    console.log('- /tmp/groups-program-map.byNameLevel.json');
  } finally {
    await app.close();
  }
}

exportMap().catch((err) => {
  console.error('Export failed', err);
  process.exit(1);
});
