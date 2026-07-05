import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role !== 'AGENT') {
    return NextResponse.json({ callbacks: [] });
  }

  const now = new Date();

  const pendingCallbacks = await prisma.lead.findMany({
    where: {
      assignedAgentId: session.userId,
      disposition: 'FOLLOW_UP',
      callbackAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      customerName: true,
      phone: true,
      callbackAt: true,
      productVariant: true,
    },
    orderBy: { callbackAt: 'asc' },
    take: 10,
  });

  return NextResponse.json({ callbacks: pendingCallbacks });
}
