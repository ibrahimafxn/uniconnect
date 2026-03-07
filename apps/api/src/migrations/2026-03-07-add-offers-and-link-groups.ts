import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AcademicYear } from '../academic/academic-year.schema';
import { ProgramOffer } from '../academic/program-offer.schema';
import { Group } from '../academic/group.schema';

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const years = app.get<Model<AcademicYear>>(getModelToken(AcademicYear.name));
    const offers = app.get<Model<ProgramOffer>>(getModelToken(ProgramOffer.name));
    const groups = app.get<Model<Group>>(getModelToken(Group.name));

    const year =
      (await years.findOne({ isActive: true }).exec()) ??
      (await years.find().sort({ startDate: -1 }).limit(1).exec()).at(0);
    if (!year?._id) {
      console.error('Migration annulée: aucune année académique trouvée.');
      process.exitCode = 1;
      return;
    }

    const targetGroups = await groups
      .find({ $or: [{ offerId: { $exists: false } }, { offerId: null }] })
      .exec();

    let updated = 0;
    for (const g of targetGroups) {
      if (!g.programId || !g.levelId) continue;
      const offer =
        (await offers
          .findOne({
            programId: new Types.ObjectId(g.programId),
            levelId: new Types.ObjectId(g.levelId),
            academicYearId: new Types.ObjectId(year._id),
          })
          .exec()) ??
        (await offers.create({
          programId: g.programId,
          levelId: g.levelId,
          academicYearId: year._id,
        }));
      await groups
        .updateOne({ _id: g._id }, { $set: { offerId: offer._id } })
        .exec();
      updated += 1;
    }

    console.log(`Groups linked to offers: ${updated}`);
  } finally {
    await app.close();
  }
}

migrate().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
