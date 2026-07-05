const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // We'll generate a random avatar URL using Dicebear (initials style for generic, or open-peeps/avataaars for faces)
    // Let's use generic cute faces for a better demo
    const url = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=b6e3f4`;
    
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: url }
    });
    console.log(`Updated avatar for ${user.username}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
