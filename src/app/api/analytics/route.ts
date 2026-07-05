import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN', 'MANAGER'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'today'; // today, week, month
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let dateFilter: { gte?: Date; lte?: Date } = {};
  const now = new Date();

  if (from && to) {
    dateFilter = {
      gte: new Date(from),
      lte: new Date(to + 'T23:59:59'),
    };
  } else if (range === 'today') {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    dateFilter = { gte: todayStart, lte: todayEnd };
  } else if (range === 'week') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    dateFilter = { gte: weekStart, lte: now };
  } else if (range === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = { gte: monthStart, lte: now };
  }

  // Total Gross Sales
  const salesData = await prisma.saleRecord.findMany({
    where: { createdAt: dateFilter },
  });

  const totalGrossSales = salesData.reduce((sum, s) => sum + s.grossAmount, 0);

  const prepaidSales = salesData.filter((s) => s.paymentType === 'PREPAID');
  const totalPrepaid = prepaidSales.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalAdvance = salesData.reduce((sum, s) => sum + s.advanceAmount, 0);
  const totalPrepaidCollected = totalPrepaid + totalAdvance;

  const cancelledSales = salesData.filter((s) => s.logisticsStatus === 'CANCELLED_RETURNED');
  const sunkDeliveryCost = cancelledSales.reduce((sum, s) => sum + s.deliveryCost, 0);

  const deliveredCount = salesData.filter((s) => s.logisticsStatus === 'DELIVERED').length;
  const cancelledCount = cancelledSales.length;
  const orderSuccessRate =
    deliveredCount + cancelledCount > 0
      ? Math.round((deliveredCount / (deliveredCount + cancelledCount)) * 10000) / 100
      : 0;

  const totalOrders = salesData.length;
  const totalDeliveryCost = salesData.reduce((sum, s) => sum + s.deliveryCost, 0);
  const netRevenue = totalPrepaidCollected - sunkDeliveryCost;

  // Leads stats
  const leadsWhere: Record<string, unknown> = {};
  if (dateFilter.gte) leadsWhere.createdAt = dateFilter;

  const totalLeads = await prisma.lead.count({ where: leadsWhere });
  const pendingLeads = await prisma.lead.count({
    where: { ...leadsWhere, disposition: null },
  });
  const followUpLeads = await prisma.lead.count({
    where: { ...leadsWhere, disposition: 'FOLLOW_UP' },
  });

  return NextResponse.json({
    totalGrossSales,
    totalPrepaidCollected,
    sunkDeliveryCost,
    netRevenue,
    orderSuccessRate,
    totalOrders,
    deliveredCount,
    cancelledCount,
    totalDeliveryCost,
    totalLeads,
    pendingLeads,
    followUpLeads,
    range,
  });
}
