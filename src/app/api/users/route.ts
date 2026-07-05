import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN', 'MANAGER', 'TL', 'HR'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let where = {};
  if (session.role === 'MANAGER') {
    where = {
      OR: [
        { managerId: session.userId },
        { id: session.userId },
      ],
    };
  } else if (session.role === 'TL') {
    where = {
      OR: [
        { tlId: session.userId },
        { id: session.userId },
      ],
    };
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      plainPassword: true,
      fullName: true,
      employeeId: true,
      avatarUrl: true,
      role: true,
      phone: true,
      status: true,
      managerId: true,
      tlId: true,
      dailyWage: true,
      createdAt: true,
      manager: { select: { fullName: true } },
      teamLeader: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN'])) {
    return NextResponse.json({ error: 'Only Admin can create users' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { username, password, fullName, employeeId, avatarUrl, role, phone, status, managerId, tlId, dailyWage } = body;

    if (!username || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        username,
        password: bcrypt.hashSync(password, 10),
        plainPassword: password,
        fullName,
        employeeId: employeeId || null,
        avatarUrl: avatarUrl || null,
        role,
        phone: phone || null,
        status: status || 'ACTIVE',
        managerId: managerId || null,
        tlId: tlId || null,
        dailyWage: dailyWage || 0,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        employeeId: user.employeeId,
        avatarUrl: user.avatarUrl,
        role: user.role,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
