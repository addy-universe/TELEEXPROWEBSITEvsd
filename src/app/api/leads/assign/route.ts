import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN', 'MANAGER', 'TL'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { leadIds, assignToId, assignType } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No leads selected' }, { status: 400 });
    }

    if (!assignToId) {
      return NextResponse.json({ error: 'Assignment target required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (assignType === 'tl') {
      if (!hasRole(session.role, ['ADMIN', 'MANAGER'])) {
        return NextResponse.json({ error: 'Only Managers can assign to TLs' }, { status: 403 });
      }
      updateData.assignedTlId = assignToId;
    } else if (assignType === 'agent') {
      if (!hasRole(session.role, ['ADMIN', 'MANAGER', 'TL'])) {
        return NextResponse.json({ error: 'Only TLs can assign to Agents' }, { status: 403 });
      }
      updateData.assignedAgentId = assignToId;
    }

    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `${leadIds.length} leads assigned successfully`,
    });
  } catch (error) {
    console.error('Assign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
