import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function seedLeads() {
  console.log('🌱 Adding demo leads...');

  // Get agent1
  const agent1 = await prisma.user.findUnique({
    where: { username: 'agent1' },
    include: { manager: true, teamLeader: true },
  });

  if (!agent1) {
    console.error('agent1 not found!');
    process.exit(1);
  }

  const batchId = 'DEMO_BATCH_001';

  const demoLeads = [
    {
      customerName: 'Rahul Verma',
      phone: '+919876543210',
      stateCity: 'Delhi',
      productVariant: 'Shilajit Gold 50g',
      assignedAgentId: agent1.id,
      assignedTlId: agent1.tlId,
      uploadedByManagerId: agent1.managerId || 1, // Fallback to admin/head if needed
      batchId,
    },
    {
      customerName: 'Anil Kumar',
      phone: '+918765432109',
      stateCity: 'Mumbai',
      productVariant: 'Ashwagandha Pro',
      assignedAgentId: agent1.id,
      assignedTlId: agent1.tlId,
      uploadedByManagerId: agent1.managerId || 1,
      batchId,
    },
    {
      customerName: 'Sanjay Sharma',
      phone: '+917654321098',
      stateCity: 'Bangalore',
      productVariant: 'Men Wellness Pack',
      assignedAgentId: agent1.id,
      assignedTlId: agent1.tlId,
      uploadedByManagerId: agent1.managerId || 1,
      batchId,
    },
    {
      customerName: 'Manoj Singh',
      phone: '+916543210987',
      stateCity: 'Pune',
      productVariant: 'Shilajit Resin',
      assignedAgentId: agent1.id,
      assignedTlId: agent1.tlId,
      uploadedByManagerId: agent1.managerId || 1,
      batchId,
    },
    {
      customerName: 'Vikash Yadav',
      phone: '+915432109876',
      stateCity: 'Gurgaon',
      productVariant: 'Testosterone Booster',
      assignedAgentId: agent1.id,
      assignedTlId: agent1.tlId,
      uploadedByManagerId: agent1.managerId || 1,
      batchId,
    }
  ];

  for (const lead of demoLeads) {
    await prisma.lead.create({ data: lead });
  }

  console.log(`✅ Added ${demoLeads.length} demo leads for agent1!`);
}

seedLeads()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
