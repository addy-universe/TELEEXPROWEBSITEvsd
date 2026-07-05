import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN', 'MANAGER', 'TL'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = new Date().toISOString().split('T')[0];
  const todayStart = new Date(today);
  const todayEnd = new Date(today + 'T23:59:59');

  // Get agents based on role
  let agentWhere: Record<string, unknown> = { role: 'AGENT' };

  if (session.role === 'TL') {
    agentWhere.tlId = session.userId;
  } else if (session.role === 'MANAGER') {
    // Get all TLs under this manager, then their agents
    const tls = await prisma.user.findMany({
      where: { managerId: session.userId, role: 'TL' },
      select: { id: true },
    });
    agentWhere.tlId = { in: tls.map((t) => t.id) };
  }

  const agents = await prisma.user.findMany({
    where: agentWhere,
    select: {
      id: true,
      fullName: true,
      tlId: true,
      teamLeader: { select: { fullName: true } },
    },
  });

  const agentData = await Promise.all(
    agents.map(async (agent) => {
      // Current status
      const latestLog = await prisma.attendanceLog.findFirst({
        where: { userId: agent.id, date: today },
        orderBy: { timestamp: 'desc' },
      });

      // Calculate active duration for current status
      let statusDuration = 0;
      if (latestLog) {
        statusDuration = Math.round(
          (new Date().getTime() - new Date(latestLog.timestamp).getTime()) / (1000 * 60)
        );
      }

      // Total calls logged today (remarks count)
      const callsToday = await prisma.remark.count({
        where: {
          agentId: agent.id,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });

      // Pending callbacks
      const pendingCallbacks = await prisma.lead.count({
        where: {
          assignedAgentId: agent.id,
          disposition: 'FOLLOW_UP',
          callbackAt: { lte: new Date() },
        },
      });

      // Today's sales revenue
      const todaySales = await prisma.saleRecord.findMany({
        where: {
          agentId: agent.id,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });
      const totalRevenue = todaySales.reduce((sum, s) => sum + s.grossAmount, 0);

      // Underperformance flag
      const now = new Date();
      const is4pm = now.getHours() >= 16;
      const isUnderperforming = is4pm && callsToday < 80;

      return {
        id: agent.id,
        name: agent.fullName,
        tlName: agent.teamLeader?.fullName || 'Unassigned',
        currentStatus: latestLog?.status || 'OFFLINE',
        statusDuration,
        callsToday,
        pendingCallbacks,
        totalRevenue,
        isUnderperforming,
      };
    })
  );

  return NextResponse.json({ agents: agentData, date: today });
}
