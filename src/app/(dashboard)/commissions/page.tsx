'use client';

import { useEffect, useState } from 'react';

interface CommissionData {
  id: number;
  fullName: string;
  employeeId: string | null;
  dailyWage: number;
  deliveredOrders: number;
  totalRevenue: number;
  commission: number;
}

export default function CommissionsPage() {
  const [data, setData] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (range !== 'custom' || (startDate && endDate)) {
      fetchCommissions();
    }
  }, [range, startDate, endDate]);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      let url = `/api/commissions?range=${range}`;
      if (range === 'custom' && startDate && endDate) {
        url = `/api/commissions?from=${startDate}&to=${endDate}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalCommission = data.reduce((acc, curr) => acc + curr.commission, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Commission Calculator</h1>
          <p className="page-subtitle">Track agent incentives based on delivered sales (5% flat rate)</p>
        </div>

        <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                style={{ padding: '6px 12px', height: '36px', fontSize: '13px', width: '135px' }} 
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>to</span>
              <input 
                type="date" 
                className="input" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                style={{ padding: '6px 12px', height: '36px', fontSize: '13px', width: '135px' }} 
              />
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loader" />
        ) : (
          <>
            <div className="grid-3 mb-24">
              <div className="stat-card green" style={{ gridColumn: '1 / -1', background: 'var(--accent-green-glow)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <div className="flex items-center justify-between">
                  <span className="stat-label">Total Commission Payout</span>
                  <span className="stat-icon">💸</span>
                </div>
                <div className="stat-value" style={{ fontSize: '32px', color: 'var(--accent-green)' }}>
                  {formatINR(totalCommission)}
                </div>
                <p className="text-sm text-muted">Total incentives earned by all agents {range === 'today' ? 'today' : range === 'week' ? 'this week' : range === 'month' ? 'this month' : 'in selected period'}</p>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Agent Name</th>
                    <th>Delivered Orders</th>
                    <th>Revenue Generated</th>
                    <th style={{ color: 'var(--accent-green)' }}>Commission Earned (5%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>No agents found.</td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.id}>
                        <td>{row.employeeId || '-'}</td>
                        <td style={{ fontWeight: 600 }}>{row.fullName}</td>
                        <td>{row.deliveredOrders}</td>
                        <td>{formatINR(row.totalRevenue)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatINR(row.commission)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
