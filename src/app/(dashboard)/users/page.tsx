'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  plainPassword?: string;
  fullName: string;
  avatarUrl?: string | null;
  employeeId?: string | null;
  role: string;
  managerId: number | null;
  tlId: number | null;
  dailyWage: number;
  phone?: string;
  status: string;
  createdAt: string;
  manager: { fullName: string } | null;
  teamLeader: { fullName: string } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    avatarUrl: '',
    employeeId: '',
    role: 'AGENT',
    managerId: '',
    tlId: '',
    dailyWage: '0',
    phone: '',
    status: 'ACTIVE',
  });
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        managerId: formData.managerId ? parseInt(formData.managerId) : null,
        tlId: formData.tlId ? parseInt(formData.tlId) : null,
        dailyWage: parseFloat(formData.dailyWage),
      }),
    });

    const data = await res.json();
    if (res.ok) {
      showToast('User created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } else {
      showToast(data.error, 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;

    const updateData: Record<string, unknown> = {};
    if (formData.fullName) updateData.fullName = formData.fullName;
    if (formData.avatarUrl !== undefined) updateData.avatarUrl = formData.avatarUrl;
    if (formData.employeeId !== undefined) updateData.employeeId = formData.employeeId;
    if (formData.role) updateData.role = formData.role;
    if (formData.password) updateData.password = formData.password;
    updateData.managerId = formData.managerId ? parseInt(formData.managerId) : null;
    updateData.tlId = formData.tlId ? parseInt(formData.tlId) : null;
    updateData.dailyWage = parseFloat(formData.dailyWage);
    updateData.phone = formData.phone;
    updateData.status = formData.status;

    const res = await fetch(`/api/users/${editUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    if (res.ok) {
      showToast('User updated', 'success');
      setShowEditModal(false);
      setEditUser(null);
      resetForm();
      fetchUsers();
    } else {
      const data = await res.json();
      showToast(data.error, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('User deleted', 'success');
      fetchUsers();
    }
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

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      avatarUrl: '',
      employeeId: '',
      role: 'AGENT',
      managerId: '',
      tlId: '',
      dailyWage: '0',
      phone: '',
      status: 'ACTIVE',
    });
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setFormData({
      username: u.username,
      password: '',
      fullName: u.fullName,
      avatarUrl: u.avatarUrl || '',
      employeeId: u.employeeId || '',
      role: u.role,
      managerId: u.managerId ? String(u.managerId) : '',
      tlId: u.tlId ? String(u.tlId) : '',
      dailyWage: String(u.dailyWage),
      phone: u.phone || '',
      status: u.status || 'ACTIVE',
    });
    setShowEditModal(true);
  };

  const showToast = (msg: string, type: string) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getRoleBadge = (role: string) => {
    const colorMap: Record<string, string> = {
      ADMIN: 'badge-red',
      HR: 'badge-amber',
      MANAGER: 'badge-blue',
      TL: 'badge-green',
      AGENT: 'badge-blue',
    };
    
    const labelMap: Record<string, string> = {
      ADMIN: 'Director',
      MANAGER: 'Sales Manager',
      TL: 'Team Leader',
      AGENT: 'Sales Executive',
      HR: 'HR',
    };
    
    return <span className={`badge ${colorMap[role] || 'badge-blue'}`}>{labelMap[role] || role}</span>;
  };

  const getStatusBadge = (status: string) => {
    return status === 'ACTIVE' 
      ? <span className="badge badge-green">Active</span> 
      : <span className="badge badge-red">Inactive</span>;
  };

  const managers = users.filter((u) => u.role === 'MANAGER');
  const tls = users.filter((u) => u.role === 'TL');

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} users registered</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-ghost" onClick={() => setShowPasswords(!showPasswords)}>
            {showPasswords ? '🔒 Hide Passwords' : '👁️ Show Passwords'}
          </button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            + Create User
          </button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loader" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>ID</th>
                  <th>Emp ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Manager</th>
                  <th>Team Leader</th>
                  <th>Daily Wage</th>
                  <th>Password</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {u.fullName.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td>{u.id}</td>
                    <td>{u.employeeId || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                    <td>{u.fullName}</td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>{u.phone || '-'}</td>
                    <td>{getStatusBadge(u.status)}</td>
                    <td>{u.manager?.fullName || '-'}</td>
                    <td>{u.teamLeader?.fullName || '-'}</td>
                    <td>₹{u.dailyWage}</td>
                    <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      {showPasswords ? u.plainPassword : '••••••'}
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{showEditModal ? 'Edit User' : 'Create New User'}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!showEditModal && (
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="input" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{showEditModal ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input className="input" type="text" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="input" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Profile Image (Upload or URL)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-blue)' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--text-secondary)' }}>
                      👤
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        className="input" 
                        type="url" 
                        placeholder="Or paste image URL" 
                        value={formData.avatarUrl} 
                        onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })} 
                        style={{ flex: 1 }}
                      />
                      <label className="btn btn-ghost" style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                        {uploading ? 'Uploading...' : '📁 Upload'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleAvatarUpload} 
                          style={{ display: 'none' }} 
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input className="input" type="text" placeholder="e.g. EMP-001" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="input" type="text" placeholder="e.g. 9876543210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="ADMIN">Director</option>
                  <option value="MANAGER">Sales Manager</option>
                  <option value="TL">Team Leader</option>
                  <option value="AGENT">Sales Executive</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Manager</label>
                <select className="select" value={formData.managerId} onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}>
                  <option value="">None</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Team Leader</label>
                <select className="select" value={formData.tlId} onChange={(e) => setFormData({ ...formData, tlId: e.target.value })}>
                  <option value="">None</option>
                  {tls.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Daily Wage (₹)</label>
                <input className="input" type="number" value={formData.dailyWage} onChange={(e) => setFormData({ ...formData, dailyWage: e.target.value })} />
              </div>

              <div className="flex gap-12 mt-8">
                <button className="btn btn-primary" onClick={showEditModal ? handleUpdate : handleCreate}>
                  {showEditModal ? 'Save Changes' : 'Create User'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
