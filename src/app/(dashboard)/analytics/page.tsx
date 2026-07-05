'use client';

import { useEffect, useState } from 'react';

interface Analytics {
  totalGrossSales: number;
  totalPrepaidCollected: number;
  sunkDeliveryCost: number;
  netRevenue: number;
  orderSuccessRate: number;
  totalOrders: number;
  deliveredCount: number;
  cancelledCount: number;
  totalDeliveryCost: number;
  totalLeads: number;
  pendingLeads: number;
  followUpLeads: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [range, setRange] = useState('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (range !== 'custom' || (from && to)) {
      fetchAnalytics();
    }
  }, [range, from, to]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (range === 'custom' && from && to) {
      params.set('from', from);
      params.set('to', to);
    } else {
      params.set('range', range);
    }
    const res = await fetch(`/api/analytics?${params}`);
    if (res.ok) setAnalytics(await res.json());
    setLoading(false);
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="page-subtitle">Financial performance & operations metrics</p>
        </div>
      </div>
      <div className="page-body">
        <div className="filter-bar mb-24" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="flex gap-4">
            {['today', 'week', 'month', 'custom'].map((r) => (
              <button
                key={r}
                className={`filter-btn ${range === r ? 'active' : ''}`}
                onClick={() => setRange(r)}
              >
                {r === 'today' ? 'Today' : r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'Custom'}
              </button>
            ))}
          </div>

          {range === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.2s ease' }}>
              <input 
                type="date" 
                className="input" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)} 
                style={{ padding: '6px 12px', height: '36px', fontSize: '13px', width: '135px' }} 
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>to</span>
              <input 
                type="date" 
                className="input" 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
                style={{ padding: '6px 12px', height: '36px', fontSize: '13px', width: '135px' }} 
              />
            </div>
          )}
        </div>

        {loading ? <div className="loader" /> : analytics && (
          <>
            <div className="grid-3 mb-24">
              <div className="stat-card purple" style={{ gridColumn: '1 / -1', background: 'var(--accent-purple-glow)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <span className="stat-label">Net Revenue</span>
                <div className="stat-value" style={{ fontSize: '32px', color: 'var(--accent-purple)' }}>{fmt(analytics.netRevenue)}</div>
                <p className="text-sm text-muted">Prepaid + Advance - Sunk Delivery</p>
              </div>
            </div>

            <div className="grid-4 mb-24">
              <div className="stat-card green">
                <span className="stat-label">Total Gross Sales</span>
                <div className="stat-value">{fmt(analytics.totalGrossSales)}</div>
                <p className="text-sm text-muted">{analytics.totalOrders} total orders</p>
              </div>
              <div className="stat-card blue">
                <span className="stat-label">Prepaid + Advance</span>
                <div className="stat-value">{fmt(analytics.totalPrepaidCollected)}</div>
              </div>
              <div className="stat-card red">
                <span className="stat-label">Sunk Delivery Cost</span>
                <div className="stat-value">{fmt(analytics.sunkDeliveryCost)}</div>
                <p className="text-sm text-muted">From {analytics.cancelledCount} returns</p>
              </div>
              <div className="stat-card purple">
                <span className="stat-label">Success Rate</span>
                <div className="stat-value">{analytics.orderSuccessRate}%</div>
                <p className="text-sm text-muted">{analytics.deliveredCount} / {analytics.deliveredCount + analytics.cancelledCount}</p>
              </div>
            </div>

            <div className="grid-3 mb-24">
              <div className="stat-card amber">
                <span className="stat-label">Total Leads</span>
                <div className="stat-value">{analytics.totalLeads}</div>
              </div>
              <div className="stat-card blue">
                <span className="stat-label">Pending (Untouched)</span>
                <div className="stat-value">{analytics.pendingLeads}</div>
              </div>
              <div className="stat-card amber">
                <span className="stat-label">Follow Ups Active</span>
                <div className="stat-value">{analytics.followUpLeads}</div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 12 }}>Formulas Reference</h3>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2 }}>
                <p><strong>Total Gross Sales</strong> = Σ(Gross Order Amount) for all confirmed bookings</p>
                <p><strong>Prepaid Collected</strong> = Σ(Prepaid Amount) + Σ(Advance Amount Paid)</p>
                <p><strong>Sunk Delivery Cost</strong> = Σ(Delivery Cost) where Logistics = Cancelled/Returned</p>
                <p><strong>Order Success Rate</strong> = (Delivered / (Delivered + Cancelled)) × 100</p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
