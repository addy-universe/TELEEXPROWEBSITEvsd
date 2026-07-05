import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let where: Record<string, unknown> = {};

  if (session.role === 'AGENT') {
    where.assignedAgentId = session.userId;
  } else if (session.role === 'TL') {
    where.assignedTlId = session.userId;
  } else if (session.role === 'MANAGER') {
    where.uploadedByManagerId = session.userId;
  }

  const leads = await prisma.lead.findMany({
    where,
    select: {
      customerName: true,
      phone: true,
      stateCity: true,
      productVariant: true,
      disposition: true,
      callbackAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const wsData = leads.map((l) => ({
    'Customer Name': l.customerName,
    'Phone Number': l.phone,
    'State/City': l.stateCity,
    'Product Variant': l.productVariant,
    'Disposition': l.disposition || 'Pending',
    'Callback': l.callbackAt ? new Date(l.callbackAt).toLocaleString('en-IN') : '',
  }));

  const ws = XLSX.utils.json_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="leads_${session.username}_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
