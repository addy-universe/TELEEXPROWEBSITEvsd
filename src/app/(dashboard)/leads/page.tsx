'use client';

import { useEffect, useState, useCallback } from 'react';
import { DISPOSITION_LABELS, LOGISTICS_LABELS } from '@/lib/constants';

interface Lead {
  id: number;
  customerName: string;
  phone: string;
  stateCity: string;
  productVariant: string;
  disposition: string | null;
  callbackAt: string | null;
  assignedAgentId: number | null;
  assignedTlId: number | null;
  batchId: string;
  assignedAgent: { fullName: string } | null;
  assignedTl: { fullName: string } | null;
  saleRecord: SaleRecord | null;
  remarks: Remark[];
}

interface Remark {
  id: number;
  disposition: string;
  note: string;
  callbackAt: string | null;
  createdAt: string;
  agent: { fullName: string };
}

interface SaleRecord {
  id: number;
  grossAmount: number;
  paymentType: string;
  advanceAmount: number;
  deliveryCost: number;
  logisticsStatus: string;
}

interface UserInfo {
  id: number;
  fullName: string;
  role: string;
}

interface TeamMember {
  id: number;
  fullName: string;
  role: string;
}

export default function LeadsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterDisp, setFilterDisp] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data.user);
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '50',
    });
    if (search) params.set('search', search);
    if (filterDisp) params.set('disposition', filterDisp);

    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, filterDisp]);

  useEffect(() => {
    if (user) fetchLeads();
  }, [user, fetchLeads]);

  const fetchTeamMembers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setTeamMembers(data.users || []);
  };

  const handleExport = () => {
    window.location.href = '/api/leads/export';
  };

  const handleAssign = async (assignToId: number, assignType: string) => {
    const res = await fetch('/api/leads/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds: selectedLeads, assignToId, assignType }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
      setSelectedLeads([]);
      setShowAssignModal(false);
      fetchLeads();
    } else {
      showToast(data.error, 'error');
    }
  };

  const showToast = (msg: string, type: string) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((l) => l.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getDispositionBadge = (disp: string | null) => {
    if (!disp) return <span className="badge badge-blue">Pending</span>;
    const colorMap: Record<string, string> = {
      FOLLOW_UP: 'badge-amber',
      SALE_DONE: 'badge-green',
      DELIVERED: 'badge-blue',
      NOT_RECEIVED: 'badge-purple',
      CANCELLED: 'badge-red',
    };
    return (
      <span className={`badge ${colorMap[disp] || 'badge-blue'}`}>
        {DISPOSITION_LABELS[disp] || disp}
      </span>
    );
  };

  if (!user) return <div className="loader" />;

  const canAssign = ['ADMIN', 'MANAGER', 'TL'].includes(user.role);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{user.role === 'AGENT' ? 'My Leads' : 'Lead Management'}</h1>
          <p className="page-subtitle">{total} leads total</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-success" onClick={handleExport}>
            📥 Download Excel
          </button>
          {canAssign && selectedLeads.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => {
                fetchTeamMembers();
                setShowAssignModal(true);
              }}
            >
              🎯 Assign ({selectedLeads.length})
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filter-bar mb-24">
          <input
            className="input"
            style={{ maxWidth: '300px' }}
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="select"
            style={{ width: 'auto' }}
            value={filterDisp}
            onChange={(e) => { setFilterDisp(e.target.value); setPage(1); }}
          >
            <option value="">All Dispositions</option>
            {Object.entries(DISPOSITION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loader" />
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No Leads Found</h3>
            <p>
              {user.role === 'AGENT'
                ? 'No leads have been assigned to you yet.'
                : 'Upload leads to get started.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {canAssign && (
                      <th>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={selectedLeads.length === leads.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>City/State</th>
                    <th>Product</th>
                    <th>Status</th>
                    {user.role !== 'AGENT' && <th>Agent</th>}
                    <th>Last Interaction</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      {canAssign && (
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => toggleSelect(lead.id)}
                          />
                        </td>
                      )}
                      <td style={{ fontWeight: 600 }}>{lead.customerName}</td>
                      <td>
                        <div className="flex items-center gap-8">
                          {lead.phone}
                          <a
                            href={`https://wa.me/91${lead.phone.replace(/\D/g, '').slice(-10)}?text=Hi%20${encodeURIComponent(lead.customerName)},%20this%20is%20${encodeURIComponent(user.fullName)}%20from%20TeleExPro%20Wellness.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-ghost"
                            style={{ padding: '2px 6px', color: '#25D366' }}
                            title="Message on WhatsApp"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                            </svg>
                          </a>
                        </div>
                      </td>
                      <td>{lead.stateCity}</td>
                      <td>{lead.productVariant}</td>
                      <td>{getDispositionBadge(lead.disposition)}</td>
                      {user.role !== 'AGENT' && (
                        <td style={{ fontSize: '13px' }}>
                          {lead.assignedAgent?.fullName || <span className="text-muted">Unassigned</span>}
                        </td>
                      )}
                      <td style={{ fontSize: '12px', maxWidth: '240px' }}>
                        {lead.remarks[0] ? (
                          <div>
                            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lead.remarks[0].note}>
                              {lead.remarks[0].note || <span className="text-muted" style={{ fontStyle: 'italic' }}>No note</span>}
                            </div>
                            <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                              {new Date(lead.remarks[0].createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })} by {lead.remarks[0].agent.fullName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">Never Talked</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setActiveLead(lead); setShowDetailModal(true); }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-24">
              <p className="text-sm text-muted">
                Showing {(page - 1) * 50 + 1} - {Math.min(page * 50, total)} of {total}
              </p>
              <div className="flex gap-8">
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  ← Previous
                </button>
                <button className="btn btn-ghost btn-sm" disabled={page * 50 >= total} onClick={() => setPage(page + 1)}>
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Lead Detail Modal */}
      {showDetailModal && activeLead && (
        <LeadDetailModal
          lead={activeLead}
          user={user}
          onClose={() => { setShowDetailModal(false); setActiveLead(null); }}
          onUpdate={() => { fetchLeads(); }}
          showToast={showToast}
        />
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Assign {selectedLeads.length} Leads</h2>

            {user.role === 'TL' ? (
              <>
                <p className="text-sm text-muted mb-16">Assign to Agent:</p>
                {teamMembers.filter(m => m.role === 'AGENT').map((m) => (
                  <button
                    key={m.id}
                    className="btn btn-ghost w-full"
                    style={{ justifyContent: 'flex-start', marginBottom: '8px' }}
                    onClick={() => handleAssign(m.id, 'agent')}
                  >
                    👤 {m.fullName}
                  </button>
                ))}
              </>
            ) : (
              <>
                <p className="text-sm text-muted mb-16">Assign to Team Leader:</p>
                {teamMembers.filter(m => m.role === 'TL').map((m) => (
                  <button
                    key={m.id}
                    className="btn btn-ghost w-full"
                    style={{ justifyContent: 'flex-start', marginBottom: '8px' }}
                    onClick={() => handleAssign(m.id, 'tl')}
                  >
                    👤 {m.fullName}
                  </button>
                ))}
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />
                <p className="text-sm text-muted mb-16">Or assign directly to Agent:</p>
                {teamMembers.filter(m => m.role === 'AGENT').map((m) => (
                  <button
                    key={m.id}
                    className="btn btn-ghost w-full"
                    style={{ justifyContent: 'flex-start', marginBottom: '8px' }}
                    onClick={() => handleAssign(m.id, 'agent')}
                  >
                    👤 {m.fullName}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
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

/* Lead Detail Modal Component */
function LeadDetailModal({
  lead,
  user,
  onClose,
  onUpdate,
  showToast,
}: {
  lead: Lead;
  user: UserInfo;
  onClose: () => void;
  onUpdate: () => void;
  showToast: (msg: string, type: string) => void;
}) {
  const [fullLead, setFullLead] = useState<Lead>(lead);
  const [disposition, setDisposition] = useState('');
  const [note, setNote] = useState('');
  const [callbackAt, setCallbackAt] = useState('');
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleData, setSaleData] = useState({
    grossAmount: '',
    paymentType: 'COD',
    advanceAmount: '0',
    deliveryCost: '0',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLeadDetail();
  }, []);

  const fetchLeadDetail = async () => {
    const res = await fetch(`/api/leads/${lead.id}`);
    const data = await res.json();
    if (data.lead) setFullLead(data.lead);
  };

  const handleSubmitRemark = async () => {
    if (!disposition) {
      showToast('Please select a disposition', 'error');
      return;
    }

    if (disposition === 'FOLLOW_UP' && !callbackAt) {
      showToast('Callback date/time is required for Follow Up', 'error');
      return;
    }

    if (disposition === 'SALE_DONE') {
      setShowSaleForm(true);
      return;
    }

    setSaving(true);
    const res = await fetch('/api/remarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        disposition,
        note,
        callbackAt: callbackAt || null,
      }),
    });

    if (res.ok) {
      showToast('Remark saved successfully', 'success');
      setDisposition('');
      setNote('');
      setCallbackAt('');
      fetchLeadDetail();
      onUpdate();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to save', 'error');
    }
    setSaving(false);
  };

  const handleSubmitSale = async () => {
    if (!saleData.grossAmount || parseFloat(saleData.grossAmount) <= 0) {
      showToast('Enter valid gross amount', 'error');
      return;
    }

    setSaving(true);

    // First save the remark
    await fetch('/api/remarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        disposition: 'SALE_DONE',
        note,
      }),
    });

    // Then create sale record
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        ...saleData,
      }),
    });

    if (res.ok) {
      showToast('Sale recorded! 🎉', 'success');
      setShowSaleForm(false);
      fetchLeadDetail();
      onUpdate();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to record sale', 'error');
    }
    setSaving(false);
  };

  const handleUpdateLogistics = async (saleId: number, logisticsStatus: string) => {
    const res = await fetch('/api/sales', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saleId, logisticsStatus }),
    });

    if (res.ok) {
      showToast('Logistics updated', 'success');
      fetchLeadDetail();
      onUpdate();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-16">
          <h2 style={{ margin: 0 }}>{fullLead.customerName}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Lead Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          padding: '16px',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
        }}>
          <div>
            <span className="text-sm text-muted">Phone</span>
            <div className="flex items-center gap-8">
              <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--accent-blue)' }}>{fullLead.phone}</p>
              <a
                href={`https://wa.me/91${fullLead.phone.replace(/\D/g, '').slice(-10)}?text=Hi%20${encodeURIComponent(fullLead.customerName)},%20this%20is%20${encodeURIComponent(user.fullName)}%20from%20TeleExPro%20Wellness.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-ghost"
                style={{ padding: '2px 6px', color: '#25D366', background: 'rgba(37, 211, 102, 0.1)' }}
                title="Message on WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
          <div>
            <span className="text-sm text-muted">City/State</span>
            <p style={{ fontWeight: 600 }}>{fullLead.stateCity}</p>
          </div>
          <div>
            <span className="text-sm text-muted">Product</span>
            <p style={{ fontWeight: 600 }}>{fullLead.productVariant}</p>
          </div>
          <div>
            <span className="text-sm text-muted">Assigned Agent</span>
            <p style={{ fontWeight: 600 }}>{fullLead.assignedAgent?.fullName || 'Unassigned'}</p>
          </div>
        </div>

        {/* Sale Record */}
        {fullLead.saleRecord && (
          <div style={{
            padding: '16px',
            background: 'var(--accent-green-glow)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}>
            <h4 style={{ color: 'var(--accent-green)', marginBottom: '12px' }}>💰 Sale Record</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div>
                <span className="text-muted">Gross Amount:</span>{' '}
                <strong>₹{fullLead.saleRecord.grossAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-muted">Payment:</span>{' '}
                <strong>{fullLead.saleRecord.paymentType}</strong>
              </div>
              <div>
                <span className="text-muted">Advance:</span>{' '}
                <strong>₹{fullLead.saleRecord.advanceAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-muted">Delivery Cost:</span>{' '}
                <strong>₹{fullLead.saleRecord.deliveryCost.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span className="text-muted">Logistics:</span>{' '}
                <span className={`badge ${
                  fullLead.saleRecord.logisticsStatus === 'DELIVERED' ? 'badge-green' :
                  fullLead.saleRecord.logisticsStatus === 'CANCELLED_RETURNED' ? 'badge-red' :
                  'badge-amber'
                }`}>
                  {LOGISTICS_LABELS[fullLead.saleRecord.logisticsStatus] || fullLead.saleRecord.logisticsStatus}
                </span>

                {['ADMIN', 'MANAGER', 'TL'].includes(user.role) && fullLead.saleRecord.logisticsStatus === 'DISPATCHED' && (
                  <span style={{ marginLeft: '12px' }}>
                    <button className="btn btn-sm btn-success" onClick={() => handleUpdateLogistics(fullLead.saleRecord!.id, 'DELIVERED')}>
                      ✅ Delivered
                    </button>
                    <button className="btn btn-sm btn-danger" style={{ marginLeft: '8px' }} onClick={() => handleUpdateLogistics(fullLead.saleRecord!.id, 'CANCELLED_RETURNED')}>
                      ❌ Cancelled
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Disposition & Remark Form */}
        {user.role !== 'HR' && !showSaleForm && (
          <div style={{
            padding: '16px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}>
            <h4 style={{ marginBottom: '12px' }}>Add Remark</h4>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Disposition *</label>
              <select className="select" value={disposition} onChange={(e) => setDisposition(e.target.value)}>
                <option value="">Select disposition...</option>
                {Object.entries(DISPOSITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {disposition === 'FOLLOW_UP' && (
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Callback Date & Time *</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={callbackAt}
                  onChange={(e) => setCallbackAt(e.target.value)}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Note</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Enter your remark..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button className="btn btn-primary" onClick={handleSubmitRemark} disabled={saving}>
              {saving ? 'Saving...' : 'Save Remark'}
            </button>
          </div>
        )}

        {/* Sale Form */}
        {showSaleForm && (
          <div style={{
            padding: '16px',
            background: 'var(--accent-green-glow)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}>
            <h4 style={{ color: 'var(--accent-green)', marginBottom: '16px' }}>💰 Record Sale</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Gross Order Amount (₹) *</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={saleData.grossAmount}
                  onChange={(e) => setSaleData({ ...saleData, grossAmount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Type *</label>
                <select
                  className="select"
                  value={saleData.paymentType}
                  onChange={(e) => setSaleData({ ...saleData, paymentType: e.target.value })}
                >
                  <option value="COD">COD (Cash on Delivery)</option>
                  <option value="PREPAID">Prepaid</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Advance Amount (₹)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={saleData.advanceAmount}
                  onChange={(e) => setSaleData({ ...saleData, advanceAmount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Cost (₹)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={saleData.deliveryCost}
                  onChange={(e) => setSaleData({ ...saleData, deliveryCost: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-12 mt-16">
              <button className="btn btn-success" onClick={handleSubmitSale} disabled={saving}>
                {saving ? 'Recording...' : '✅ Confirm Sale'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowSaleForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Remarks History */}
        <div>
          <h4 style={{ marginBottom: '12px' }}>Remarks History</h4>
          {fullLead.remarks && fullLead.remarks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fullLead.remarks.map((r) => (
                <div key={r.id} style={{
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid ${
                    r.disposition === 'SALE_DONE' ? 'var(--accent-green)' :
                    r.disposition === 'FOLLOW_UP' ? 'var(--accent-amber)' :
                    r.disposition === 'CANCELLED' ? 'var(--accent-red)' :
                    'var(--accent-blue)'
                  }`,
                }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                    <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                      {DISPOSITION_LABELS[r.disposition] || r.disposition}
                    </span>
                    <span className="text-sm text-muted">
                      {new Date(r.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>{r.note || 'No note'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    — {r.agent.fullName}
                    {r.callbackAt && ` · Callback: ${new Date(r.callbackAt).toLocaleString('en-IN')}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No remarks yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
