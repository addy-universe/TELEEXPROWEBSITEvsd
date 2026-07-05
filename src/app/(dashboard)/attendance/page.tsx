'use client';

import { useEffect, useState } from 'react';
import { ATTENDANCE_LABELS } from '@/lib/constants';

interface LogEntry {
  id: number;
  status: string;
  timestamp: string;
}

interface AttSummary {
  timeIn: string | null;
  timeOut: string | null;
  totalBreakMins: number;
  netProductiveHours: number;
  dayStatus: string;
}

export default function AttendancePage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<AttSummary | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [monthSummaries, setMonthSummaries] = useState<any[]>([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => { fetchAttendance(); fetchCalendar(); }, [month]);

  const fetchAttendance = async () => {
    const res = await fetch('/api/attendance');
    const data = await res.json();
    setLogs(data.todayLogs || []);
    setSummary(data.summary || null);
    setCurrentStatus(data.currentStatus);
  };

  const fetchCalendar = async () => {
    const res = await fetch(`/api/attendance/calendar?month=${month}`);
    if (res.ok) {
      const data = await res.json();
      setMonthSummaries(data.summaries || []);
    }
  };

  const handleStatusChange = async (status: string) => {
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAttendance();
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayStatus = (day: number) => {
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    return monthSummaries.find(s => s.date === dateStr);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'present';
      case 'HALF_DAY': return 'half-day';
      case 'ABSENT': return 'absent';
      case 'FLAG_FOR_REVIEW': return 'auto-timeout'; // Using purple for flag
      case 'AUTO_TIMEOUT': return 'auto-timeout';
      default: return '';
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Today&apos;s shift log</p>
        </div>
      </div>
      <div className="page-body">
        <div className="grid-3 mb-24">
          <div className="stat-card green">
            <span className="stat-label">Current Status</span>
            <div className="stat-value" style={{ fontSize: 22 }}>
              {currentStatus ? ATTENDANCE_LABELS[currentStatus] || currentStatus : 'Not Clocked In'}
            </div>
          </div>
          <div className="stat-card blue">
            <span className="stat-label">Net Productive Hours</span>
            <div className="stat-value">{summary?.netProductiveHours?.toFixed(1) || '0.0'}h</div>
          </div>
          <div className="stat-card amber">
            <span className="stat-label">Total Break</span>
            <div className="stat-value">{summary?.totalBreakMins || 0}m</div>
          </div>
        </div>

        <div className="card mb-24">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Quick Actions</h3>
          <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
            {Object.entries(ATTENDANCE_LABELS).map(([key, label]) => (
              <button key={key} className={`btn ${currentStatus === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => handleStatusChange(key)}>
                {key === 'TIME_IN' ? '⏰' : key === 'TIME_OUT' ? '🔚' : key === 'BIO_BREAK' ? '🚻' : key === 'LUNCH_BREAK' ? '🍽️' : key === 'TRAINING_BREAK' ? '📚' : '🤝'} {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-2 gap-24">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Today&apos;s Log</h3>
            {logs.length === 0 ? (
              <p className="text-muted">No activity logged today.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id}>
                        <td>{formatTime(l.timestamp)}</td>
                        <td><span className="badge badge-blue">{ATTENDANCE_LABELS[l.status] || l.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-16">
              <h3 className="card-title">My Calendar</h3>
              <input type="month" className="input" style={{ width: 'auto', padding: '4px 8px' }} value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            
            <div className="calendar-grid">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="calendar-cell header">{d}</div>
              ))}
              
              {/* Padding for first day of month */}
              {Array.from({ length: new Date(month + '-01').getDay() === 0 ? 6 : new Date(month + '-01').getDay() - 1 }).map((_, i) => (
                <div key={`pad-${i}`} className="calendar-cell" style={{ visibility: 'hidden' }}></div>
              ))}
              
              {days.map(d => {
                const s = getDayStatus(d);
                return (
                  <div 
                    key={d} 
                    className={`calendar-cell ${s ? statusColor(s.dayStatus) : ''}`}
                    style={!s ? { border: '1px dashed var(--border-color)' } : {}}
                    title={s ? `${s.dayStatus} - ${s.netProductiveHours}h` : 'No data'}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap', fontSize: 11 }}>
              <span className="badge badge-green">Present</span>
              <span className="badge badge-amber">Half Day</span>
              <span className="badge badge-red">Absent</span>
              <span className="badge badge-purple">Other</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
