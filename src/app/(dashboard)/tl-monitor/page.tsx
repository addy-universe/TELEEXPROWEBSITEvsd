'use client';

import { useEffect, useState, useCallback } from 'react';
import { ATTENDANCE_LABELS } from '@/lib/constants';

interface AgentData {
  id: number;
  name: string;
  tlName: string;
  currentStatus: string;
  statusDuration: number;
  callsToday: number;
  pendingCallbacks: number;
  totalRevenue: number;
  isUnderperforming: boolean;
}

export default function TLMonitorPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/tl-monitor');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getStatusBadge = (status: string) => {
    if (status === 'OFFLINE') return <span className="badge badge-red">Offline</span>;
    if (['BIO_BREAK', 'LUNCH_BREAK', 'TRAINING_BREAK', 'MEETING_BREAK'].includes(status))
      return <span className="badge badge-amber">{ATTENDANCE_LABELS[status] || status}</span>;
    if (status === 'TIME_IN') return <span className="badge badge-green">Available</span>;
    if (status === 'TIME_OUT') return <span className="badge badge-red">Clocked Out</span>;
    return <span className="badge badge-blue">{status}</span>;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">TL Performance Monitor</h1>
          <p className="page-subtitle">Live agent activity — auto-refreshes every 30s</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchData}>🔄 Refresh</button>
      </div>
      <div className="page-body">
        {loading ? <div className="loader" /> : agents.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🎯</div>
            <h3>No Agents Found</h3>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Agent</th><th>TL</th><th>Status</th><th>Calls</th><th>Callbacks</th><th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className={a.isUnderperforming ? 'flag-red' : ''}>
                    <td style={{ fontWeight: 600 }}>{a.name}{a.isUnderperforming && <span style={{ color: 'var(--accent-red)', marginLeft: 8 }}>⚠️</span>}</td>
                    <td>{a.tlName}</td>
                    <td>{getStatusBadge(a.currentStatus)} {a.statusDuration > 0 && <span className="text-sm text-muted">{a.statusDuration}m</span>}</td>
                    <td style={{ fontWeight: 700, fontSize: 18 }}>{a.callsToday}</td>
                    <td>{a.pendingCallbacks > 0 ? <span className="badge badge-amber">{a.pendingCallbacks}</span> : '0'}</td>
                    <td style={{ fontWeight: 700, color: a.totalRevenue > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>₹{a.totalRevenue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
