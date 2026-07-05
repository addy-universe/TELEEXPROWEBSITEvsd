import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const BASE_URL = 'https://track.delhivery.com';

function getToken() {
  return process.env.DELHIVERY_API_KEY || '';
}

// GET: Sync all CRM orders that have Delhivery waybills — fetch live status from API
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasRole(session.role, ['ADMIN', 'MANAGER'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = getToken();
  if (!token || token === 'your_delhivery_api_key_here') {
    return NextResponse.json({ error: 'Delhivery API key not configured' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const dateFilter = searchParams.get('date') || ''; // optional YYYY-MM-DD

  try {
    // Fetch ALL sale records (show full order pipeline)
    const whereClause: any = {};

    // Optionally filter by date
    if (dateFilter) {
      const startDate = new Date(dateFilter);
      const endDate = new Date(dateFilter);
      endDate.setDate(endDate.getDate() + 1);
      whereClause.createdAt = { gte: startDate, lt: endDate };
    }

    const saleRecords = await prisma.saleRecord.findMany({
      where: whereClause,
      include: {
        lead: true,
        agent: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (saleRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders found in CRM yet.',
        orders: [],
        stats: { total: 0, dispatched: 0, delivered: 0, returned: 0, withLiveTracking: 0, pendingPickup: 0, noTrackingId: 0 },
        totalOrders: 0,
      });
    }

    // Collect all waybills and batch-track them via Delhivery API
    const waybills = saleRecords.map(s => s.trackingId).filter(Boolean) as string[];
    const trackingResults: Record<string, any> = {};

    // Delhivery supports comma-separated waybills (max ~25 at a time)
    const batchSize = 25;
    for (let i = 0; i < waybills.length; i += batchSize) {
      const batch = waybills.slice(i, i + batchSize).join(',');
      try {
        const res = await fetch(
          `${BASE_URL}/api/v1/packages/json/?waybill=${batch}&token=${token}`,
          { headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.ShipmentData) {
            for (const sd of data.ShipmentData) {
              const awb = sd.Shipment?.AWB;
              if (awb) trackingResults[awb] = sd.Shipment;
            }
          }
        }
      } catch (err) {
        console.error('Batch tracking error:', err);
      }
    }

    // Merge CRM data + live Delhivery tracking
    const orders = saleRecords.map(sale => {
      const liveData = trackingResults[sale.trackingId || ''] || null;
      const liveStatus = liveData?.Status?.Status || null;
      const lastScan = liveData?.Scans?.[liveData.Scans.length - 1]?.ScanDetail || null;

      // Auto-update CRM logistics status if Delhivery says Delivered or RTO
      let updatedCrmStatus = sale.logisticsStatus;
      if (liveData?.Status?.StatusType === 'DL') updatedCrmStatus = 'DELIVERED';
      else if (liveData?.Status?.StatusType === 'RT') updatedCrmStatus = 'CANCELLED_RETURNED';

      return {
        saleRecordId: sale.id,
        orderId: `ORD-${sale.id}`,
        createdAt: sale.createdAt,
        customer: {
          name: sale.lead?.customerName || 'N/A',
          phone: sale.lead?.phone || '',
          city: sale.lead?.stateCity || '',
        },
        product: sale.lead?.productVariant || 'N/A',
        amount: sale.grossAmount,
        paymentType: sale.paymentType,
        agent: sale.agent?.fullName || 'N/A',
        waybill: sale.trackingId,
        courier: sale.courierName,
        crmStatus: updatedCrmStatus,
        // Live tracking from Delhivery API
        liveTracking: liveData ? {
          status: liveStatus,
          statusType: liveData.Status?.StatusType,
          origin: liveData.Origin,
          destination: liveData.Destination,
          chargedAmount: liveData.ChargedAmount,
          chargedWeight: liveData.ChargedWeight,
          scansCount: liveData.Scans?.length || 0,
          lastScan: lastScan ? {
            status: lastScan.Scan || lastScan.ScanType,
            location: lastScan.ScannedLocation,
            dateTime: lastScan.ScanDateTime,
            instructions: lastScan.Instructions,
          } : null,
          estimatedDelivery: liveData.EstimatedDate || null,
        } : {
          status: 'No tracking data from Delhivery',
          note: 'Waybill may be newly created or not yet picked up',
        },
      };
    });

    // Summary stats
    const stats = {
      total: orders.length,
      dispatched: orders.filter(o => o.crmStatus === 'DISPATCHED').length,
      delivered: orders.filter(o => o.crmStatus === 'DELIVERED').length,
      returned: orders.filter(o => o.crmStatus === 'CANCELLED_RETURNED').length,
      withLiveTracking: orders.filter(o => o.liveTracking?.statusType).length,
      pendingPickup: orders.filter(o => o.waybill && !o.liveTracking?.statusType).length,
      noTrackingId: orders.filter(o => !o.waybill).length,
    };

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      stats,
      orders,
      totalOrders: orders.length,
    });

  } catch (error: any) {
    console.error('Daily sync error:', error);
    return NextResponse.json({ error: 'Failed to sync orders', detail: error.message }, { status: 500 });
  }
}
