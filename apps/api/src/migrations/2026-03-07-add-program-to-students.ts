import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { StudentProfile } from '../students/student-profile.schema';
import { Group } from '../academic/group.schema';

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const students = app.get<Model<StudentProfile>>(
      getModelToken(StudentProfile.name),
    );
    const groups = app.get<Model<Group>>(getModelToken(Group.name));

    const target = await students
      .find({
        $or: [
          { programId: { $exists: false } },
          { programId: null },
          { offerId: { $exists: false } },
          { offerId: null },
        ],
      })
      .exec();

    let updated = 0;
    let skipped = 0;

    for (const s of target) {
      const group = await groups.findById(s.groupId).exec();
      if (!group?.programId) {
        skipped += 1;
        continue;
      }
      const update: any = {
        programId: new Types.ObjectId(group.programId),
      };
      if (group.offerId) {
        update.offerId = new Types.ObjectId(group.offerId);
      }
      await students.updateOne({ _id: s._id }, { $set: update }).exec();
      updated += 1;
    }

    console.log(`Students updated: ${updated}`);
    if (skipped > 0) {
      console.log(`Students skipped (no group program): ${skipped}`);
    }
  } finally {
    await app.close();
  }
}

migrate().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
