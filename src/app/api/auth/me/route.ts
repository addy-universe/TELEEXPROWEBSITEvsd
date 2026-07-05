import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      manager: { select: { fullName: true } },
      teamLeader: { select: { fullName: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      employeeId: user.employeeId,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      managerId: user.managerId,
      tlId: user.tlId,
      managerName: user.manager?.fullName || null,
      tlName: user.teamLeader?.fullName || null,
      dailyWage: user.dailyWage,
    },
  });
}
