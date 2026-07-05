import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = parseInt(id);
  const isSelf = session.userId === userId;
  const isAdmin = hasRole(session.role, ['ADMIN']);

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.fullName) updateData.fullName = body.fullName;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl || null;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.password) {
      updateData.password = bcrypt.hashSync(body.password, 10);
      updateData.plainPassword = body.password;
    }

    // Only Admin can update these fields
    if (isAdmin) {
      if (body.employeeId !== undefined) updateData.employeeId = body.employeeId || null;
      if (body.role) updateData.role = body.role;
      if (body.status) updateData.status = body.status;
      if (body.managerId !== undefined) updateData.managerId = body.managerId || null;
      if (body.tlId !== undefined) updateData.tlId = body.tlId || null;
      if (body.dailyWage !== undefined) updateData.dailyWage = body.dailyWage;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN'])) {
    return NextResponse.json({ error: 'Only Admin can delete users' }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
