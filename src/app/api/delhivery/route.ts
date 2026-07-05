import { NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';

const BASE_URL = 'https://track.delhivery.com';

function getToken() {
  return process.env.DELHIVERY_API_KEY || '';
}

function headers() {
  return {
    'Authorization': `Token ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!hasRole(session.role, ['ADMIN', 'MANAGER'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = getToken();
  if (!token || token === 'your_delhivery_api_key_here') {
    return NextResponse.json({ error: 'Delhivery API key not configured. Please add it to your .env file.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'overview';

  try {
    // ACTION: Track a single waybill
    if (action === 'track') {
      const waybill = searchParams.get('waybill');
      if (!waybill) return NextResponse.json({ error: 'Waybill number required' }, { status: 400 });

      const res = await fetch(`${BASE_URL}/api/v1/packages/json/?waybill=${waybill}&token=${token}`, {
        headers: headers(),
      });
      const data = await res.json();
      return NextResponse.json({ success: true, action: 'track', data });
    }

    // ACTION: Track multiple waybills (comma separated)
    if (action === 'track_bulk') {
      const waybills = searchParams.get('waybills');
      if (!waybills) return NextResponse.json({ error: 'Waybill numbers required (comma separated)' }, { status: 400 });

      const res = await fetch(`${BASE_URL}/api/v1/packages/json/?waybill=${waybills}&token=${token}`, {
        headers: headers(),
      });
      const data = await res.json();
      return NextResponse.json({ success: true, action: 'track_bulk', data });
    }

    // ACTION: Check pincode serviceability
    if (action === 'pincode') {
      const pincode = searchParams.get('pincode');
      if (!pincode) return NextResponse.json({ error: 'Pincode required' }, { status: 400 });

      const res = await fetch(`${BASE_URL}/c/api/pin-codes/json/?filter_codes=${pincode}&token=${token}`, {
        headers: headers(),
      });
      const data = await res.json();
      return NextResponse.json({ success: true, action: 'pincode', data });
    }

    // ACTION: Fetch a single waybill number
    if (action === 'fetch_waybill') {
      const res = await fetch(`${BASE_URL}/waybill/api/fetch/json/?token=${token}`, {
        headers: headers(),
      });
      const data = await res.json();
      return NextResponse.json({ success: true, action: 'fetch_waybill', data });
    }

    // ACTION: Fetch bulk waybills
    if (action === 'fetch_waybills') {
      const count = searchParams.get('count') || '10';
      const res = await fetch(`${BASE_URL}/waybill/api/bulk/json/?count=${count}&token=${token}`, {
        headers: headers(),
      });
      const data = await res.json();
      return NextResponse.json({ success: true, action: 'fetch_waybills', data });
    }

    // ACTION: Calculate shipping cost
    if (action === 'calculate') {
      const originPin = searchParams.get('origin_pin') || '';
      const destPin = searchParams.get('dest_pin') || '';
      const weight = searchParams.get('weight') || '500';
      const paymentMode = searchParams.get('payment_mode') || 'Pre-paid';

      const res = await fetch(
        `${BASE_URL}/api/kinko/v1/invoice/charges/.json?md=${paymentMode}&ss=Delivered&d_pin=${destPin}&o_pin=${originPin}&cgm=${weight}&pt=Pre-paid&cod=0&token=${token}`,
        { headers: headers() }
      );
      const data = await res.json();
      return NextResponse.json({ success: true, action: 'calculate', data });
    }

    // ACTION: Generate packing slip / shipping label
    if (action === 'label') {
      const waybill = searchParams.get('waybill');
      if (!waybill) return NextResponse.json({ error: 'Waybill number required' }, { status: 400 });

      const labelUrl = `${BASE_URL}/api/p/packing_slip?wbns=${waybill}&token=${token}`;
      return NextResponse.json({ success: true, action: 'label', labelUrl });
    }

    // ACTION: Fetch recent orders/shipments from Delhivery account
    if (action === 'recent_orders') {
      const page = searchParams.get('page') || '1';
      const pageSize = searchParams.get('page_size') || '50';
      const dateFilter = searchParams.get('date') || ''; // YYYY-MM-DD
      const statusFilter = searchParams.get('status') || ''; // In Transit, Delivered, Pending, etc.

      // Use Delhivery's Edit API to pull shipment listing
      let url = `${BASE_URL}/api/p/edit?token=${token}&page=${page}&page_size=${pageSize}`;
      if (dateFilter) url += `&d=${dateFilter}`;
      if (statusFilter) url += `&st=${statusFilter}`;

      const res = await fetch(url, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ success: true, action: 'recent_orders', data });
      }

      // Fallback: try the /api/cmu/create.json listing approach (some accounts use this)
      try {
        const fallbackUrl = `${BASE_URL}/api/v2/packages/json/?token=${token}&verbose=2&page=${page}&page_size=${pageSize}`;
        const fallbackRes = await fetch(fallbackUrl, { headers: headers() });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          return NextResponse.json({ success: true, action: 'recent_orders', data });
        }
      } catch {}

      // Second fallback: Packages API v1
      try {
        const v1Url = `${BASE_URL}/api/v1/packages/json/?token=${token}&verbose=2`;
        const v1Res = await fetch(v1Url, { headers: headers() });
        if (v1Res.ok) {
          const data = await v1Res.json();
          return NextResponse.json({ success: true, action: 'recent_orders', data });
        }
      } catch {}

      return NextResponse.json({ success: false, error: 'Unable to fetch recent orders from Delhivery. API may require waybill-based lookups only.' }, { status: 200 });
    }

    // ACTION: Check pickup request status
    if (action === 'pickup_status') {
      const pickupDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
      const warehouseName = searchParams.get('warehouse') || '';
      
      let url = `${BASE_URL}/fm/request/new/?token=${token}`;
      if (pickupDate) url += `&d=${pickupDate}`;
      if (warehouseName) url += `&wh=${warehouseName}`;

      const res = await fetch(url, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ success: true, action: 'pickup_status', data });
      }
      
      // Fallback: try the pickup listing endpoint
      try {
        const pickupUrl = `${BASE_URL}/fm/request/list/?token=${token}`;
        const pickupRes = await fetch(pickupUrl, { headers: headers() });
        if (pickupRes.ok) {
          const data = await pickupRes.json();
          return NextResponse.json({ success: true, action: 'pickup_status', data });
        }
      } catch {}

      return NextResponse.json({ success: false, error: 'Pickup status API not available for your account type.' }, { status: 200 });
    }

    // ACTION: Overview — gather all available account info
    if (action === 'overview') {
      const results: Record<string, any> = {
        apiKeyConfigured: true,
        apiKeyMasked: `${token.slice(0, 8)}...${token.slice(-4)}`,
        endpoints: {
          tracking: `${BASE_URL}/api/v1/packages/json/`,
          pincode: `${BASE_URL}/c/api/pin-codes/json/`,
          waybillFetch: `${BASE_URL}/waybill/api/fetch/json/`,
          waybillBulk: `${BASE_URL}/waybill/api/bulk/json/`,
          rateCalc: `${BASE_URL}/api/kinko/v1/invoice/charges/.json`,
          packingSlip: `${BASE_URL}/api/p/packing_slip`,
          recentOrders: `${BASE_URL}/api/p/edit`,
          pickupStatus: `${BASE_URL}/fm/request/new/`,
        },
      };

      // Test API key validity by fetching a waybill
      try {
        const testRes = await fetch(`${BASE_URL}/waybill/api/fetch/json/?token=${token}`, {
          headers: headers(),
        });
        if (testRes.ok) {
          const testData = await testRes.json();
          results.apiKeyValid = true;
          results.sampleWaybill = testData;
        } else {
          results.apiKeyValid = false;
          results.apiError = `HTTP ${testRes.status}: ${testRes.statusText}`;
        }
      } catch (err: any) {
        results.apiKeyValid = false;
        results.apiError = err.message;
      }

      // Also try to fetch recent orders count
      try {
        const recentRes = await fetch(`${BASE_URL}/api/p/edit?token=${token}&page=1&page_size=1`, {
          headers: headers(),
        });
        if (recentRes.ok) {
          const recentData = await recentRes.json();
          results.recentOrdersAvailable = true;
          results.totalPackages = recentData.package_count || recentData.count || (recentData.data?.length ?? 0);
        }
      } catch {
        results.recentOrdersAvailable = false;
      }

      return NextResponse.json({ success: true, action: 'overview', data: results });
    }

    return NextResponse.json({ error: 'Unknown action. Use: overview, track, track_bulk, pincode, fetch_waybill, fetch_waybills, calculate, label' }, { status: 400 });
  } catch (error: any) {
    console.error('Delhivery API error:', error);
    return NextResponse.json({ error: 'Failed to reach Delhivery API', detail: error.message }, { status: 500 });
  }
}
