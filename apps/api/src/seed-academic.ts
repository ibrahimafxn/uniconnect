import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AcademicYear } from './academic/academic-year.schema';
import { Program } from './academic/program.schema';
import { Level } from './academic/level.schema';
import { ProgramOffer } from './academic/program-offer.schema';
import { Group } from './academic/group.schema';

// ---------------------------------------------------------------------------
// Système LMD français — structure académique
// Référence : campusfrance.org/les-diplomes-en-france
// ---------------------------------------------------------------------------

const PROGRAMS = [
  // ── Filières universitaires (Licence → Master → Doctorat) ───────────────
  {
    name: 'Informatique',
    code: 'INFO',
    domaine: 'Sciences et Technologies',
    type: 'universitaire',
    eligibleCycles: ['L', 'M', 'D'],
  },
  {
    name: 'Mathématiques',
    code: 'MATH',
    domaine: 'Sciences et Technologies',
    type: 'universitaire',
    eligibleCycles: ['L', 'M'],
  },
  {
    name: 'Droit',
    code: 'DROIT',
    domaine: 'Droit, Économie, Gestion',
    type: 'universitaire',
    eligibleCycles: ['L', 'M', 'D'],
  },
  {
    name: 'Économie-Gestion',
    code: 'ECO',
    domaine: 'Droit, Économie, Gestion',
    type: 'universitaire',
    eligibleCycles: ['L', 'M'],
  },
  {
    name: 'Lettres Modernes',
    code: 'LET',
    domaine: 'Lettres, Langues et Sciences Humaines',
    type: 'universitaire',
    eligibleCycles: ['L'],
  },
  {
    name: 'Sciences de la Vie et de la Terre',
    code: 'SVT',
    domaine: 'Sciences, Technologies, Santé',
    type: 'universitaire',
    eligibleCycles: ['L', 'M'],
  },

  // ── BTS (Brevet de Technicien Supérieur — Bac+2) ────────────────────────
  {
    name: 'BTS Informatique',
    code: 'BTS-INFO',
    domaine: 'Sciences et Technologies',
    type: 'bts',
    eligibleCycles: ['BTS'],
  },
  {
    name: 'BTS Comptabilité et Gestion',
    code: 'BTS-CG',
    domaine: 'Droit, Économie, Gestion',
    type: 'bts',
    eligibleCycles: ['BTS'],
  },

  // ── BUT (Bachelor Universitaire de Technologie — Bac+3) ─────────────────
  {
    name: 'BUT Informatique',
    code: 'BUT-INFO',
    domaine: 'Sciences et Technologies',
    type: 'but',
    eligibleCycles: ['BUT'],
  },
  {
    name: 'BUT Gestion des Entreprises et des Administrations',
    code: 'BUT-GEA',
    domaine: 'Droit, Économie, Gestion',
    type: 'but',
    eligibleCycles: ['BUT'],
  },

  // ── CPGE (Classes Préparatoires aux Grandes Écoles) ─────────────────────
  {
    name: 'CPGE Mathématiques-Physique',
    code: 'CPGE-MP',
    domaine: 'Sciences et Technologies',
    type: 'cpge',
    eligibleCycles: ['CPGE'],
  },
];

// Niveaux organisés par cycle LMD
const LEVELS: Array<{
  name: string;
  cycle: string;
  ects?: number;
  order: number;
}> = [
  // 1er cycle — Licence (Bac+1 → Bac+3 | 60 → 180 ECTS)
  { name: 'L1', cycle: 'L', ects: 60,  order: 1 },
  { name: 'L2', cycle: 'L', ects: 120, order: 2 },
  { name: 'L3', cycle: 'L', ects: 180, order: 3 },

  // 2ème cycle — Master (Bac+4 → Bac+5 | 240 → 300 ECTS)
  { name: 'M1', cycle: 'M', ects: 240, order: 1 },
  { name: 'M2', cycle: 'M', ects: 300, order: 2 },

  // 3ème cycle — Doctorat (Bac+6 → Bac+8)
  { name: 'D1', cycle: 'D', order: 1 },
  { name: 'D2', cycle: 'D', order: 2 },
  { name: 'D3', cycle: 'D', order: 3 },

  // BTS — 2 ans (Bac+2)
  { name: 'BTS1', cycle: 'BTS', order: 1 },
  { name: 'BTS2', cycle: 'BTS', order: 2 },

  // BUT — 3 ans (Bac+3)
  { name: 'BUT1', cycle: 'BUT', order: 1 },
  { name: 'BUT2', cycle: 'BUT', order: 2 },
  { name: 'BUT3', cycle: 'BUT', order: 3 },

  // CPGE — 2 ans (Sup / Spé)
  { name: 'CPGE-SUP', cycle: 'CPGE', order: 1 },
  { name: 'CPGE-SPE', cycle: 'CPGE', order: 2 },
];

async function seedAcademic() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const years    = app.get<Model<AcademicYear>>(getModelToken(AcademicYear.name));
    const programs = app.get<Model<Program>>(getModelToken(Program.name));
    const levels   = app.get<Model<Level>>(getModelToken(Level.name));
    const offers   = app.get<Model<ProgramOffer>>(getModelToken(ProgramOffer.name));
    const groups   = app.get<Model<Group>>(getModelToken(Group.name));

    // ── Année universitaire active ────────────────────────────────────────
    const year = await years.findOne({ name: '2025-2026' }).exec();
    const yearDoc =
      year ??
      (await years.create({
        name: '2025-2026',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-07-15'),
        isActive: true,
      }));

    // ── Filières ──────────────────────────────────────────────────────────
    for (const p of PROGRAMS) {
      const existing = await programs.findOne({ name: p.name }).exec();
      if (!existing) {
        await programs.create({ name: p.name, code: p.code, domaine: p.domaine, type: p.type });
      } else {
        await programs.updateOne(
          { _id: existing._id },
          { domaine: p.domaine, type: p.type, code: p.code },
        );
      }
    }

    // ── Niveaux ───────────────────────────────────────────────────────────
    const levelDocs: Map<string, any> = new Map();
    for (const l of LEVELS) {
      const existing = await levels.findOne({ name: l.name }).exec();
      const doc =
        existing ??
        (await levels.create({ name: l.name, cycle: l.cycle, ects: l.ects, order: l.order }));
      if (existing) {
        await levels.updateOne(
          { _id: existing._id },
          { cycle: l.cycle, ects: l.ects, order: l.order },
        );
      }
      levelDocs.set(l.name, doc);
    }

    // ── Offres et groupes (programme × niveau éligible) ──────────────────
    const programDocs = await programs.find().exec();

    for (const progSeed of PROGRAMS) {
      const progDoc = programDocs.find((p) => p.name === progSeed.name);
      if (!progDoc) continue;

      const compatibleLevels = LEVELS.filter((l) =>
        progSeed.eligibleCycles.includes(l.cycle),
      );

      for (const levelSeed of compatibleLevels) {
        const levelDoc = levelDocs.get(levelSeed.name);
        if (!levelDoc) continue;

        const offer =
          (await offers
            .findOne({
              programId: new Types.ObjectId(progDoc._id),
              levelId: new Types.ObjectId(levelDoc._id),
              academicYearId: new Types.ObjectId(yearDoc._id),
            })
            .exec()) ??
          (await offers.create({
            programId: progDoc._id,
            levelId: levelDoc._id,
            academicYearId: yearDoc._id,
            capacity: 30,
          }));

        for (const groupName of ['G1', 'G2']) {
          const group = await groups
            .findOne({
              name: groupName,
              levelId: new Types.ObjectId(levelDoc._id),
              programId: new Types.ObjectId(progDoc._id),
              offerId: new Types.ObjectId(offer._id),
            })
            .exec();
          if (!group) {
            await groups.create({
              name: groupName,
              offerId: offer._id,
              levelId: levelDoc._id,
              programId: progDoc._id,
            });
          }
        }
      }
    }

    // ── Résumé ────────────────────────────────────────────────────────────
    console.log('\n✅ Seed académique terminé — Système LMD français');
    console.log(`   Année : ${yearDoc.name}`);
    console.log(`   Filières   : ${await programs.countDocuments()}`);
    console.log(`   Niveaux    : ${await levels.countDocuments()}`);
    console.log(`   Offres     : ${await offers.countDocuments()}`);
    console.log(`   Groupes    : ${await groups.countDocuments()}`);
    console.log('\n   Cycles couverts :');
    console.log('   • Licence (L1, L2, L3) — 60/120/180 ECTS');
    console.log('   • Master  (M1, M2)     — 240/300 ECTS');
    console.log('   • Doctorat (D1, D2, D3)');
    console.log('   • BTS (BTS1, BTS2)     — Bac+2');
    console.log('   • BUT (BUT1, BUT2, BUT3) — Bac+3');
    console.log('   • CPGE (SUP, SPE)      — Classes préparatoires');
  } finally {
    await app.close();
  }
}

seedAcademic().catch((err) => {
  console.error('Seed academic failed', err);
  process.exit(1);
});
