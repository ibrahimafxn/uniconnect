import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envTestPath = path.resolve(process.cwd(), '.env.test');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
