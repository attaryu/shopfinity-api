import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DIRECT_DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seeding...');

  // Hash passwords
  const hashedAdminPassword = await bcrypt.hash('Admin123!', 10);
  const hashedUserPassword = await bcrypt.hash('User123!', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shopfinity.com' },
    update: {},
    create: {
      fullname: 'Admin User',
      email: 'admin@shopfinity.com',
      password: hashedAdminPassword,
      role: Role.ADMIN,
    },
  });

  console.log('✓ Admin user created:', {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });

  // Create Regular Test User
  const testUser = await prisma.user.upsert({
    where: { email: 'user@shopfinity.com' },
    update: {},
    create: {
      fullname: 'Test User',
      email: 'user@shopfinity.com',
      password: hashedUserPassword,
      role: Role.USER,
    },
  });

  console.log('✓ Test user created:', {
    id: testUser.id,
    email: testUser.email,
    role: testUser.role,
  });

  console.log('\n✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
