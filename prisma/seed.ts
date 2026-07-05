import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.resolve(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding TeleExpro CRM database...');

  // Clear existing data
  await prisma.attendanceSummary.deleteMany();
  await prisma.attendanceLog.deleteMany();
  await prisma.remark.deleteMany();
  await prisma.saleRecord.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hash('admin123'),
      plainPassword: 'admin123',
      fullName: 'Aryan Kumar (Admin)',
      role: 'ADMIN',
      dailyWage: 0,
    },
  });
  console.log(`✅ Admin: ${admin.username} / admin123`);

  // Create Head
  const head = await prisma.user.create({
    data: {
      username: 'head',
      password: hash('head123'),
      plainPassword: 'head123',
      fullName: 'Vikram Singh (Head)',
      role: 'HEAD',
      dailyWage: 0,
    },
  });
  console.log(`✅ Head: ${head.username} / head123`);

  // Create HR
  const hr = await prisma.user.create({
    data: {
      username: 'hr',
      password: hash('hr123'),
      plainPassword: 'hr123',
      fullName: 'Priya Sharma (HR)',
      role: 'HR',
      dailyWage: 0,
    },
  });
  console.log(`✅ HR: ${hr.username} / hr123`);

  // Create Manager
  const manager = await prisma.user.create({
    data: {
      username: 'manager1',
      password: hash('mgr123'),
      plainPassword: 'mgr123',
      fullName: 'Rajesh Verma (Manager)',
      role: 'MANAGER',
      dailyWage: 0,
    },
  });
  console.log(`✅ Manager: ${manager.username} / mgr123`);

  // Create Team Leader
  const tl = await prisma.user.create({
    data: {
      username: 'tl1',
      password: hash('tl123'),
      plainPassword: 'tl123',
      fullName: 'Amit Gupta (TL)',
      role: 'TL',
      managerId: manager.id,
      dailyWage: 800,
    },
  });
  console.log(`✅ TL: ${tl.username} / tl123`);

  // Create Agents
  const agentNames = [
    { username: 'agent1', name: 'Suresh Kumar', wage: 600 },
    { username: 'agent2', name: 'Deepak Yadav', wage: 600 },
    { username: 'agent3', name: 'Mohit Sharma', wage: 550 },
  ];

  for (const a of agentNames) {
    const agent = await prisma.user.create({
      data: {
        username: a.username,
        password: hash('agent123'),
        plainPassword: 'agent123',
        fullName: a.name,
        role: 'AGENT',
        managerId: manager.id,
        tlId: tl.id,
        dailyWage: a.wage,
      },
    });
    console.log(`✅ Agent: ${agent.username} / agent123`);
  }

  console.log('\n🎉 Seed complete! All users created.');
  console.log('\n📋 Login Credentials:');
  console.log('  admin    / admin123');
  console.log('  head     / head123');
  console.log('  hr       / hr123');
  console.log('  manager1 / mgr123');
  console.log('  tl1      / tl123');
  console.log('  agent1-3 / agent123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
