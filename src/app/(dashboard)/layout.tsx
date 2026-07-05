'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { NAV_ITEMS, ATTENDANCE_LABELS } from '@/lib/constants';

interface User {
  id: number;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  role: string;
  managerId: number | null;
  tlId: number | null;
  managerName: string | null;
  tlName: string | null;
  dailyWage: number;
}

interface CallbackAlert {
  id: number;
  customerName: string;
  phone: string;
  callbackAt: string;
  productVariant: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const [statusDurationSecs, setStatusDurationSecs] = useState(0);
  const [callbackAlerts, setCallbackAlerts] = useState<CallbackAlert[]>([]);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [activeCallback, setActiveCallback] = useState<CallbackAlert | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      fetchAttendanceStatus();
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      setCurrentStatus(data.currentStatus);
      if (data.lastTimestamp) {
        setLastTimestamp(data.lastTimestamp);
      } else {
        setLastTimestamp(null);
      }
    } catch { /* ignore */ }
  };

  const checkCallbacks = useCallback(async () => {
    if (!user || user.role !== 'AGENT') return;
    try {
      const res = await fetch('/api/callbacks');
      const data = await res.json();
      if (data.callbacks && data.callbacks.length > 0) {
        setCallbackAlerts(data.callbacks);
        if (!showCallbackModal) {
          setActiveCallback(data.callbacks[0]);
          setShowCallbackModal(true);
          playAlertSound();
        }
      }
    } catch { /* ignore */ }
  }, [user, showCallbackModal]);

  // Poll for callbacks every 60 seconds
  useEffect(() => {
    if (!user || user.role !== 'AGENT') return;
    const interval = setInterval(checkCallbacks, 60000);
    checkCallbacks(); // Initial check
    return () => clearInterval(interval);
  }, [user, checkCallbacks]);

  // Update status duration every second
  useEffect(() => {
    if (!lastTimestamp || currentStatus === 'TIME_OUT') return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(lastTimestamp).getTime()) / 1000);
      setStatusDurationSecs(elapsed >= 0 ? elapsed : 0);
    }, 1000);
    
    // Initial calc
    const elapsed = Math.floor((Date.now() - new Date(lastTimestamp).getTime()) / 1000);
    setStatusDurationSecs(elapsed >= 0 ? elapsed : 0);
    
    return () => clearInterval(interval);
  }, [lastTimestamp, currentStatus]);

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const playAlertSound = () => {
    try {
      if (!audioRef.current) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.value = 0.3;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => { osc.frequency.value = 660; }, 200);
        setTimeout(() => { osc.frequency.value = 880; }, 400);
        setTimeout(() => { osc.stop(); ctx.close(); }, 600);
      }
    } catch { /* ignore audio errors */ }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setCurrentStatus(status);
      setLastTimestamp(new Date().toISOString());
      setStatusDurationSecs(0);
    } catch { /* ignore */ }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loader" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role] || [];
  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2);

  const getStatusColor = () => {
    if (!currentStatus || currentStatus === 'TIME_OUT') return 'offline';
    if (['BIO_BREAK', 'LUNCH_BREAK', 'TRAINING_BREAK', 'MEETING_BREAK'].includes(currentStatus)) return 'break';
    return 'online';
  };

  return (
    <div className="layout">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 200,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          color: 'var(--text-primary)',
          fontSize: '20px',
          cursor: 'pointer',
        }}
        className="mobile-menu-btn"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px' }}>
          <img src="/logo.png" alt="TeleExPro Icon" style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ height: '22px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <img src="/namelogo.png" alt="TeleExPro" style={{ height: '64px', objectFit: 'contain', filter: 'brightness(0) invert(1)', marginLeft: '-6px' }} />
            </div>
            <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sales Command Center</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            href="/profile"
            className="sidebar-user"
            style={{
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="sidebar-avatar" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="sidebar-avatar">{initials}</div>
            )}
            <div className="sidebar-user-info">
              <h4>{user.fullName}</h4>
              <p style={{ margin: 0 }}>
                {user.role === 'ADMIN' ? 'Director' : 
                 user.role === 'MANAGER' ? 'Sales Manager' : 
                 user.role === 'TL' ? 'Team Leader' : 
                 user.role === 'AGENT' ? 'Sales Executive' : 
                 user.role}
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm w-full"
            style={{ marginTop: '12px' }}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Agent Status Widget & Hierarchy */}
        {user.role === 'AGENT' && (
          <div style={{
            padding: '12px 32px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            {/* Hierarchy Widget */}
            <div className="hierarchy-widget flex items-center gap-8" style={{ fontSize: '13px' }}>
              <span title="Sales Manager" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{user.managerName || 'No Manager'}</span>
              <span className="text-muted">›</span>
              <span title="Team Leader" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{user.tlName || 'No TL'}</span>
              <span className="text-muted">›</span>
              <strong title="You (Agent)">{user.fullName}</strong>
            </div>

            {/* Status Widget */}
            <div className="status-widget">
              <div className={`status-dot ${getStatusColor()}`} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentStatus ? ATTENDANCE_LABELS[currentStatus] || currentStatus : 'Not Clocked In'}
              </span>
              {currentStatus && currentStatus !== 'TIME_OUT' && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {formatDuration(statusDurationSecs)}
                </span>
              )}

              <select
                className="select"
                style={{ width: 'auto', padding: '6px 32px 6px 10px', fontSize: '12px' }}
                value=""
                onChange={(e) => {
                  if (e.target.value) handleStatusChange(e.target.value);
                }}
              >
                <option value="">Change Status</option>
                <option value="TIME_IN">⏰ Time In</option>
                <option value="BIO_BREAK">🚻 Bio Break</option>
                <option value="LUNCH_BREAK">🍽️ Lunch Break</option>
                <option value="TRAINING_BREAK">📚 Training Break</option>
                <option value="MEETING_BREAK">🤝 Meeting Break</option>
                <option value="TIME_OUT">🔚 Time Out</option>
              </select>
            </div>
          </div>
        )}

        {children}
      </main>

      {/* Callback Modal */}
      {showCallbackModal && activeCallback && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal modal-callback">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '48px' }}>📞</span>
              <h2 style={{ color: 'var(--accent-amber)', marginTop: '12px' }}>Callback Due!</h2>
            </div>

            <div style={{
              background: 'var(--bg-input)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}>
              <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                {activeCallback.customerName}
              </p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '4px' }}>
                {activeCallback.phone}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {activeCallback.productVariant} · Scheduled: {new Date(activeCallback.callbackAt).toLocaleString('en-IN')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowCallbackModal(false);
                  router.push(`/leads?leadId=${activeCallback.id}`);
                }}
              >
                Go to Lead →
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowCallbackModal(false);
                  if (callbackAlerts.length > 1) {
                    const next = callbackAlerts.find(c => c.id !== activeCallback.id);
                    if (next) {
                      setActiveCallback(next);
                      setShowCallbackModal(true);
                    }
                  }
                }}
              >
                Dismiss
              </button>
            </div>

            {callbackAlerts.length > 1 && (
              <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                +{callbackAlerts.length - 1} more callback{callbackAlerts.length > 2 ? 's' : ''} pending
              </p>
            )}
          </div>
        </div>
      )}

      <audio ref={audioRef} />

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
