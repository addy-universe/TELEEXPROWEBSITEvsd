import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN', 'MANAGER', 'HR'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'month'; // 'today', 'week', 'month'
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const now = new Date();
  let dateFilter: { gte?: Date; lte?: Date } = {};
  
  if (from && to) {
    dateFilter = {
      gte: new Date(from),
      lte: new Date(to + 'T23:59:59'),
    };
  } else {
    let startDate = new Date();
    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }
    dateFilter = { gte: startDate };
  }

  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        fullName: true,
        employeeId: true,
        dailyWage: true,
      }
    });

    const sales = await prisma.saleRecord.findMany({
      where: {
        createdAt: dateFilter,
        logisticsStatus: 'DELIVERED',
      },
    });

    // Let's assume a simple commission structure: 
    // 5% of grossAmount for every delivered sale.
    const COMMISSION_RATE = 0.05;

    const data = agents.map(agent => {
      const agentSales = sales.filter(s => s.agentId === agent.id);
      const totalRevenue = agentSales.reduce((acc, curr) => acc + curr.grossAmount, 0);
      const commission = totalRevenue * COMMISSION_RATE;

      return {
        ...agent,
        deliveredOrders: agentSales.length,
        totalRevenue,
        commission,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Commission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
