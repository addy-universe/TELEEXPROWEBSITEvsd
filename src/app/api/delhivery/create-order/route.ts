import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const BASE_URL = 'https://track.delhivery.com';

function getToken() {
  return process.env.DELHIVERY_API_KEY || '';
}

// POST: Create/manifest an order on Delhivery and store the waybill in CRM
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasRole(session.role, ['ADMIN', 'MANAGER'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = getToken();
  if (!token || token === 'your_delhivery_api_key_here') {
    return NextResponse.json({ error: 'Delhivery API key not configured' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { saleRecordId, consigneeName, consigneePhone, consigneeAddress, consigneeCity, consigneeState, consigneePincode, productName, weight, paymentMode, codAmount, warehouseName, orderId } = body;

    if (!consigneeName || !consigneePhone || !consigneeAddress || !consigneePincode) {
      return NextResponse.json({ error: 'Missing required fields: consigneeName, consigneePhone, consigneeAddress, consigneePincode' }, { status: 400 });
    }

    // Build Delhivery manifest payload
    const shipmentData = {
      shipments: [{
        name: consigneeName,
        add: consigneeAddress,
        pin: consigneePincode,
        city: consigneeCity || '',
        state: consigneeState || '',
        country: 'India',
        phone: consigneePhone,
        order: orderId || `CRM-${Date.now()}`,
        payment_mode: paymentMode || 'COD',
        cod_amount: codAmount || 0,
        products_desc: productName || 'Product',
        weight: weight || 500,
        shipment_width: 10,
        shipment_height: 10,
        shipment_length: 10,
        seller_name: warehouseName || '',
        return_name: '',
        return_add: '',
        return_pin: '',
        return_city: '',
        return_state: '',
        return_country: 'India',
        return_phone: '',
      }],
      pickup_location: {
        name: warehouseName || 'Default Warehouse',
      },
    };

    const payload = `format=json&data=${JSON.stringify(shipmentData)}`;

    const res = await fetch(`${BASE_URL}/api/cmu/create.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });

    const result = await res.json();

    // If successful and we got a waybill, update the SaleRecord
    if (result.success && result.packages && result.packages.length > 0) {
      const pkg = result.packages[0];
      const waybill = pkg.waybill;

      if (saleRecordId && waybill) {
        await prisma.saleRecord.update({
          where: { id: parseInt(saleRecordId) },
          data: {
            trackingId: waybill,
            courierName: 'Delhivery',
          },
        });
      }

      return NextResponse.json({
        success: true,
        waybill,
        orderId: pkg.refnum,
        message: 'Order created on Delhivery and waybill saved to CRM',
        delhiveryResponse: result,
      });
    }

    // Return the raw response even if not fully successful
    return NextResponse.json({
      success: false,
      message: 'Delhivery returned a response but order may not be fully created',
      delhiveryResponse: result,
    });

  } catch (error: any) {
    console.error('Delhivery create order error:', error);
    return NextResponse.json({ error: 'Failed to create order', detail: error.message }, { status: 500 });
  }
}
