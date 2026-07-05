'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  fullName: string;
  employeeId?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  managerId: number | null;
  tlId: number | null;
  managerName: string | null;
  tlName: string | null;
  dailyWage: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    avatarUrl: '',
    password: '',
  });
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setFormData({
          fullName: data.user.fullName || '',
          phone: data.user.phone || '',
          avatarUrl: data.user.avatarUrl || '',
          password: '',
        });
      } else {
        showToast('Failed to load profile', 'error');
      }
    } catch {
      showToast('Error loading profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: string) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uFormData = new FormData();
    uFormData.append('file', file);

    try {
      const res = await fetch('/api/users/upload', {
        method: 'POST',
        body: uFormData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, avatarUrl: data.url }));
        showToast('Image uploaded successfully', 'success');
      } else {
        showToast(data.error || 'Failed to upload image', 'error');
      }
    } catch {
      showToast('Error uploading image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Profile updated successfully', 'success');
        fetchProfile();
        // Reload page to reflect avatar/name changes immediately in the sidebar
        window.location.reload();
      } else {
        showToast(data.error || 'Failed to update profile', 'error');
      }
    } catch {
      showToast('Error saving profile', 'error');
    }
  };

  const getRoleLabel = (role: string) => {
    const labelMap: Record<string, string> = {
      ADMIN: 'Director',
      MANAGER: 'Sales Manager',
      TL: 'Team Leader',
      AGENT: 'Sales Executive',
      HR: 'HR Department',
    };
    return labelMap[role] || role;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div className="loader" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h2>User profile not found.</h2>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View and update your personal settings</p>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          {/* Left card: Avatar & Role Summary */}
          <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={user.fullName}
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-blue)', boxShadow: 'var(--shadow-md)' }}
                />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 'bold' }}>
                  {user.fullName.charAt(0)}
                </div>
              )}
              
              <label
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: 'var(--accent-blue)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  border: '2px solid white',
                  boxShadow: 'var(--shadow-sm)'
                }}
                title="Upload profile image"
              >
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </label>
            </div>

            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-heading)' }}>{user.fullName}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', marginTop: '4px' }}>
                @{user.username}
              </p>
              <span className="badge badge-blue" style={{ marginTop: '10px' }}>
                {getRoleLabel(user.role)}
              </span>
            </div>

            <hr style={{ width: '100%', border: '0', borderTop: '1px solid var(--border-color)' }} />

            <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Employee ID:</span>
                <span style={{ fontWeight: 600 }}>{user.employeeId || 'Not Assigned'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Daily Wage:</span>
                <span style={{ fontWeight: 600 }}>₹{user.dailyWage}</span>
              </div>
              {user.managerName && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Sales Manager:</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{user.managerName}</span>
                </div>
              )}
              {user.tlName && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Team Leader:</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{user.tlName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right card: Form Fields */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-heading)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Profile Details
            </h3>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="input"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="input"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Image URL (or upload on the left)</label>
              <input
                className="input"
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Change Password (leave blank to keep current)</label>
              <input
                className="input"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Save Changes'}
              </button>
              <button className="btn btn-ghost" onClick={() => fetchProfile()}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
          </div>
        </div>
      )}
    </>
  );
}
