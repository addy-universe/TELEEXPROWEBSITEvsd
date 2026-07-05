import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { leadId, grossAmount, paymentType, advanceAmount, deliveryCost } = body;

    if (!leadId || !grossAmount || !paymentType) {
      return NextResponse.json({ error: 'Missing required sale fields' }, { status: 400 });
    }

    // Check if sale already exists for this lead
    const existing = await prisma.saleRecord.findUnique({ where: { leadId } });
    if (existing) {
      return NextResponse.json({ error: 'Sale already recorded for this lead' }, { status: 409 });
    }

    const sale = await prisma.saleRecord.create({
      data: {
        leadId,
        agentId: session.userId,
        grossAmount: parseFloat(grossAmount),
        paymentType,
        advanceAmount: parseFloat(advanceAmount || '0'),
        deliveryCost: parseFloat(deliveryCost || '0'),
        logisticsStatus: 'DISPATCHED',
      },
    });

    return NextResponse.json({ success: true, sale });
  } catch (error) {
    console.error('Sale error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let where = {};
  if (session.role === 'TL') {
    where = {
      agent: { tlId: session.userId }
    };
  } else if (session.role === 'AGENT') {
    where = {
      agentId: session.userId
    };
  }

  try {
    const sales = await prisma.saleRecord.findMany({
      where,
      include: {
        lead: {
          select: {
            customerName: true,
            phone: true,
            stateCity: true,
            productVariant: true,
          }
        },
        agent: {
          select: {
            fullName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Fetch sales error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN', 'MANAGER', 'TL', 'AGENT'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { saleId, logisticsStatus, deliveryCost, courierName, trackingId } = body;

    const updateData: Record<string, unknown> = {};
    if (logisticsStatus) updateData.logisticsStatus = logisticsStatus;
    if (deliveryCost !== undefined) updateData.deliveryCost = parseFloat(deliveryCost);
    if (courierName !== undefined) updateData.courierName = courierName;
    if (trackingId !== undefined) updateData.trackingId = trackingId;

    const sale = await prisma.saleRecord.update({
      where: { id: saleId },
      data: updateData,
    });

    // If logistics changed to DELIVERED, update lead disposition
    if (logisticsStatus === 'DELIVERED') {
      await prisma.lead.update({
        where: { id: sale.leadId },
        data: { disposition: 'DELIVERED' },
      });
    } else if (logisticsStatus === 'CANCELLED_RETURNED') {
      await prisma.lead.update({
        where: { id: sale.leadId },
        data: { disposition: 'CANCELLED' },
      });
    }

    return NextResponse.json({ success: true, sale });
  } catch (error) {
    console.error('Update sale error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
