import dotenv from 'dotenv';
import prisma from './prisma/client';
import { hashPassword } from './utils/hash';

dotenv.config();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'password123';

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', email);
    return;
  }

  const hashed = await hashPassword(password);
  const admin = await prisma.admin.create({ data: { email, password: hashed } });
  console.log('Created admin', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
