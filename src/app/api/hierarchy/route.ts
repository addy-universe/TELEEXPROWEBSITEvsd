import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        employeeId: true,
        avatarUrl: true,
        role: true,
        status: true,
        managerId: true,
        tlId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Hierarchy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
