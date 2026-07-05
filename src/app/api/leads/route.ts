import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (hasRole(session.role, ['HR'])) {
    return NextResponse.json({ error: 'HR cannot access leads' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const disposition = searchParams.get('disposition') || undefined;
  const search = searchParams.get('search') || undefined;

  let where: Record<string, unknown> = {};

  if (session.role === 'AGENT') {
    where.assignedAgentId = session.userId;
  } else if (session.role === 'TL') {
    where.assignedTlId = session.userId;
  } else if (session.role === 'MANAGER') {
    where.uploadedByManagerId = session.userId;
  }

  if (disposition) {
    where.disposition = disposition;
  }

  if (search) {
    where.OR = [
      { customerName: { contains: search } },
      { phone: { contains: search } },
      { stateCity: { contains: search } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        assignedAgent: { select: { fullName: true } },
        assignedTl: { select: { fullName: true } },
        saleRecord: true,
        remarks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { agent: { select: { fullName: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({ leads, total, page, limit });
}
