import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { leadId, disposition, note, callbackAt } = body;

    if (!leadId || !disposition) {
      return NextResponse.json({ error: 'Lead ID and disposition are required' }, { status: 400 });
    }

    if (disposition === 'FOLLOW_UP' && !callbackAt) {
      return NextResponse.json({ error: 'Callback date required for Follow Up' }, { status: 400 });
    }

    // Create remark
    const remark = await prisma.remark.create({
      data: {
        leadId,
        agentId: session.userId,
        disposition,
        note: note || '',
        callbackAt: callbackAt ? new Date(callbackAt) : null,
      },
    });

    // Update lead disposition
    const leadUpdate: Record<string, unknown> = { disposition };
    if (callbackAt) {
      leadUpdate.callbackAt = new Date(callbackAt);
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: leadUpdate,
    });

    return NextResponse.json({ success: true, remark });
  } catch (error) {
    console.error('Remark error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
