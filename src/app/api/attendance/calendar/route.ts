import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM format
  const userId = searchParams.get('userId');

  if (!hasRole(session.role, ['ADMIN', 'HR', 'MANAGER'])) {
    if (session.role !== 'AGENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const targetUserId = session.role === 'AGENT' ? session.userId : (userId ? parseInt(userId) : undefined);

  let where: Record<string, unknown> = {
    date: { startsWith: targetMonth },
  };

  if (targetUserId) {
    where.userId = targetUserId;
  }

  const summaries = await prisma.attendanceSummary.findMany({
    where,
    include: {
      user: { select: { fullName: true, role: true, dailyWage: true } },
    },
    orderBy: [{ userId: 'asc' }, { date: 'asc' }],
  });

  // Get all agents for the calendar
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    select: { id: true, fullName: true, dailyWage: true },
    orderBy: { fullName: 'asc' },
  });

  return NextResponse.json({ summaries, agents, month: targetMonth });
}

// HR override
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN', 'HR'])) {
    return NextResponse.json({ error: 'Only HR/Admin can override' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { summaryId, dayStatus } = body;

    if (!summaryId || !dayStatus) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const summary = await prisma.attendanceSummary.update({
      where: { id: summaryId },
      data: {
        dayStatus,
        hrOverride: true,
        hrOverrideStatus: dayStatus,
      },
    });

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('Override error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
