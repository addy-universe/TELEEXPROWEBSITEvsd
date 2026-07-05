import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN', 'MANAGER'])) {
    return NextResponse.json({ error: 'Only Managers can upload leads' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }

    const batchId = uuidv4();

    // Map columns flexibly
    const leads = rawData.map((row) => {
      const customerName =
        row['Customer Name'] || row['customer_name'] || row['Name'] || row['name'] || '';
      const phone =
        row['Phone Number'] || row['phone_number'] || row['Phone'] || row['phone'] || row['Mobile'] || '';
      const stateCity =
        row['State/City'] || row['state_city'] || row['City'] || row['city'] || row['State'] || '';
      const productVariant =
        row['Product Variant'] || row['product_variant'] || row['Product'] || row['product'] || '';

      return {
        customerName: String(customerName).trim(),
        phone: String(phone).trim(),
        stateCity: String(stateCity).trim(),
        productVariant: String(productVariant).trim(),
        uploadedByManagerId: session.userId,
        batchId,
      };
    }).filter((l) => l.customerName && l.phone);

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'No valid leads found. Ensure columns: Customer Name, Phone Number, State/City, Product Variant' },
        { status: 400 }
      );
    }

    const incomingPhones = leads.map(l => l.phone);
    const existingLeads = await prisma.lead.findMany({
      where: { phone: { in: incomingPhones } },
      select: { phone: true }
    });
    const existingPhones = new Set(existingLeads.map(l => l.phone));

    const newLeads = leads.filter(l => !existingPhones.has(l.phone));

    if (newLeads.length === 0) {
      return NextResponse.json(
        { error: `All ${leads.length} leads in the file are duplicates and were skipped.` },
        { status: 400 }
      );
    }

    await prisma.lead.createMany({ data: newLeads });

    return NextResponse.json({
      success: true,
      batchId,
      count: newLeads.length,
      message: `${newLeads.length} leads uploaded successfully. ${leads.length - newLeads.length} duplicates skipped.`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
