'use client';

import { useEffect, useState } from 'react';
import { DAY_STATUS_LABELS } from '@/lib/constants';

interface Summary {
  id: number;
  userId: number;
  date: string;
  dayStatus: string;
  netProductiveHours: number;
  totalBreakMins: number;
  hrOverride: boolean;
  user: { fullName: string; role: string; dailyWage: number };
}

interface Agent {
  id: number;
  fullName: string;
  dailyWage: number;
}

export default function HRCalendarPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => { fetchCalendar(); }, [month, selectedAgent]);

  const fetchCalendar = async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (selectedAgent) params.set('userId', selectedAgent);
    const res = await fetch(`/api/attendance/calendar?${params}`);
    const data = await res.json();
    setSummaries(data.summaries || []);
    setAgents(data.agents || []);
    setLoading(false);
  };

  const handleOverride = async (summaryId: number, dayStatus: string) => {
    const res = await fetch('/api/attendance/calendar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summaryId, dayStatus }),
    });
    if (res.ok) {
      setToast({ msg: 'Override saved', type: 'success' });
      setTimeout(() => setToast(null), 2000);
      fetchCalendar();
    }
  };

  const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getAgentDayStatus = (agentId: number, day: number) => {
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    return summaries.find(s => s.userId === agentId && s.date === dateStr);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'present';
      case 'HALF_DAY': return 'half-day';
      case 'ABSENT': return 'absent';
      case 'FLAG_FOR_REVIEW': return 'flag-review';
      case 'AUTO_TIMEOUT': return 'auto-timeout';
      default: return '';
    }
  };

  const displayAgents = selectedAgent ? agents.filter(a => String(a.id) === selectedAgent) : agents;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">HR Calendar</h1>
          <p className="page-subtitle">Attendance overview & manual overrides</p>
        </div>
      </div>
      <div className="page-body">
        <div className="filter-bar mb-24">
          <input type="month" className="input" style={{ maxWidth: 200 }} value={month} onChange={e => setMonth(e.target.value)} />
          <select className="select" style={{ width: 'auto' }} value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
            <option value="">All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
          </select>
          <div className="flex gap-8" style={{ marginLeft: 'auto', flexWrap: 'wrap' }}>
            <span className="badge badge-green">Present</span>
            <span className="badge badge-amber">Half Day</span>
            <span className="badge badge-red">Absent</span>
            <span className="badge badge-purple" style={{ background: 'var(--accent-amber)', color: '#000' }}>Review Flag</span>
            <span className="badge badge-purple">Auto-Timeout</span>
          </div>
        </div>

        {loading ? <div className="loader" /> : displayAgents.length === 0 ? (
          <div className="empty-state"><h3>No agents found</h3></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 2 }}>Agent</th>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--bg-secondary)' }}>Wage</th>
                  {days.map(d => <th key={d} style={{ textAlign: 'center', minWidth: 36 }}>{d}</th>)}
                  <th>Present</th>
                  <th>Half</th>
                  <th>Absent</th>
                  <th>Earned</th>
                </tr>
              </thead>
              <tbody>
                {displayAgents.map(agent => {
                  let presentDays = 0, halfDays = 0, absentDays = 0;
                  return (
                    <tr key={agent.id}>
                      <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>{agent.fullName}</td>
                      <td style={{ position: 'sticky', left: 0, background: 'var(--bg-card)' }}>₹{agent.dailyWage}</td>
                      {days.map(d => {
                        const s = getAgentDayStatus(agent.id, d);
                        if (s) {
                          if (s.dayStatus === 'PRESENT') presentDays++;
                          else if (s.dayStatus === 'HALF_DAY') halfDays++;
                          else absentDays++;
                        }
                        return (
                          <td key={d} style={{ padding: 4, textAlign: 'center' }}>
                            {s ? (
                              <div
                                className={`calendar-cell ${statusColor(s.dayStatus)}`}
                                title={`${DAY_STATUS_LABELS[s.dayStatus]} - ${s.netProductiveHours}h${s.hrOverride ? ' (HR Override)' : ''}`}
                                onClick={() => {
                                  const next = s.dayStatus === 'PRESENT' ? 'HALF_DAY' : s.dayStatus === 'HALF_DAY' ? 'ABSENT' : s.dayStatus === 'ABSENT' ? 'FLAG_FOR_REVIEW' : 'PRESENT';
                                  handleOverride(s.id, next);
                                }}
                                style={{ width: 28, height: 28, fontSize: 11, cursor: 'pointer' }}
                              >
                                {d}
                              </div>
                            ) : (
                              <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)' }}>{d}</div>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{presentDays}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{halfDays}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{absentDays}</td>
                      <td style={{ fontWeight: 700 }}>₹{((presentDays + halfDays * 0.5) * agent.dailyWage).toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </>
  );
}
