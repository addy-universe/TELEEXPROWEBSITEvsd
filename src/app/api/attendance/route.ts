import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Log a status change (Time In, Break, Time Out etc)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { status } = body;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Log attendance event
    const log = await prisma.attendanceLog.create({
      data: {
        userId: session.userId,
        status,
        timestamp: now,
        date: dateStr,
      },
    });

    // Update/create attendance summary
    let summary = await prisma.attendanceSummary.findUnique({
      where: { userId_date: { userId: session.userId, date: dateStr } },
    });

    if (!summary) {
      summary = await prisma.attendanceSummary.create({
        data: {
          userId: session.userId,
          date: dateStr,
          timeIn: status === 'TIME_IN' ? now : null,
          dayStatus: 'PRESENT',
        },
      });
    }

    if (status === 'TIME_IN' && !summary.timeIn) {
      await prisma.attendanceSummary.update({
        where: { id: summary.id },
        data: { timeIn: now },
      });
    } else if (status === 'TIME_OUT') {
      // Calculate net productive hours
      const logs = await prisma.attendanceLog.findMany({
        where: { userId: session.userId, date: dateStr },
        orderBy: { timestamp: 'asc' },
      });

      const breakMins = calculateBreakMinutes(logs);
      const timeIn = summary.timeIn || now;
      const totalMins = (now.getTime() - timeIn.getTime()) / (1000 * 60);
      const netHours = (totalMins - breakMins) / 60;

      let dayStatus = 'PRESENT';
      if (netHours < 4) {
        dayStatus = 'HALF_DAY';
      } else if (netHours < 8) {
        dayStatus = 'FLAG_FOR_REVIEW';
      }

      await prisma.attendanceSummary.update({
        where: { id: summary.id },
        data: {
          timeOut: now,
          totalBreakMins: Math.round(breakMins),
          netProductiveHours: Math.round(netHours * 100) / 100,
          dayStatus,
        },
      });
    }

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get current status for the logged-in user
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const targetUserId = userId ? parseInt(userId) : session.userId;

  const dateStr = new Date().toISOString().split('T')[0];

  const latestLog = await prisma.attendanceLog.findFirst({
    where: { userId: targetUserId, date: dateStr },
    orderBy: { timestamp: 'desc' },
  });

  const summary = await prisma.attendanceSummary.findUnique({
    where: { userId_date: { userId: targetUserId, date: dateStr } },
  });

  const todayLogs = await prisma.attendanceLog.findMany({
    where: { userId: targetUserId, date: dateStr },
    orderBy: { timestamp: 'asc' },
  });

  return NextResponse.json({
    currentStatus: latestLog?.status || null,
    lastTimestamp: latestLog?.timestamp || null,
    summary,
    todayLogs,
  });
}

interface AttendanceLogEntry {
  status: string;
  timestamp: Date;
}

function calculateBreakMinutes(logs: AttendanceLogEntry[]): number {
  let breakMins = 0;
  let breakStart: Date | null = null;

  for (const log of logs) {
    if (['BIO_BREAK', 'LUNCH_BREAK', 'TRAINING_BREAK', 'MEETING_BREAK'].includes(log.status)) {
      breakStart = log.timestamp;
    } else if (breakStart && (log.status === 'TIME_IN' || log.status === 'TIME_OUT')) {
      breakMins += (log.timestamp.getTime() - breakStart.getTime()) / (1000 * 60);
      breakStart = null;
    }
  }

  // If currently on break
  if (breakStart) {
    breakMins += (new Date().getTime() - breakStart.getTime()) / (1000 * 60);
  }

  return breakMins;
}
