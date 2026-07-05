import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const leadId = parseInt(id);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedAgent: { select: { fullName: true } },
      assignedTl: { select: { fullName: true } },
      uploadedBy: { select: { fullName: true } },
      saleRecord: true,
      remarks: {
        orderBy: { createdAt: 'desc' },
        include: { agent: { select: { fullName: true } } },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Agent can only see their own leads
  if (session.role === 'AGENT' && lead.assignedAgentId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ lead });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const leadId = parseInt(id);
  const body = await request.json();

  try {
    const updateData: Record<string, unknown> = {};

    if (body.disposition) updateData.disposition = body.disposition;
    if (body.callbackAt) updateData.callbackAt = new Date(body.callbackAt);
    if (body.assignedAgentId !== undefined) updateData.assignedAgentId = body.assignedAgentId;
    if (body.assignedTlId !== undefined) updateData.assignedTlId = body.assignedTlId;

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
