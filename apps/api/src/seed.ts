import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { Role } from './common/roles.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const usersService = app.get(UsersService);

    const email = (
      process.env.SEED_SUPERADMIN_EMAIL ?? 'admin@uniconnect.local'
    )
      .toLowerCase()
      .trim();
    const password = process.env.SEED_SUPERADMIN_PASSWORD ?? 'change_this_admin_password';

    const existing = await usersService.findByEmail(email);
    if (existing) {
      console.log(`SuperAdmin already exists: ${email}`);
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    await usersService.create(email, hash, Role.SuperAdmin);

    console.log('SuperAdmin created');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } finally {
    await app.close();
  }
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
