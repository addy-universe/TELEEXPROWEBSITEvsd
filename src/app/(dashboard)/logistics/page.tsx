'use client';

import { useEffect, useState } from 'react';

interface SaleRecord {
  id: number;
  leadId: number;
  agentId: number;
  grossAmount: number;
  paymentType: string;
  advanceAmount: number;
  deliveryCost: number;
  logisticsStatus: string;
  trackingId: string | null;
  courierName: string | null;
  createdAt: string;
  lead: {
    customerName: string;
    phone: string;
    stateCity: string;
    productVariant: string;
  };
  agent: {
    fullName: string;
  };
}

interface TrackingStep {
  status: string;
  location: string;
  time: string;
  detail: string;
  completed: boolean;
}

interface TrackingData {
  trackingId: string;
  courier: string;
  destination: string;
  currentStatus: string;
  estimatedDelivery: string;
  steps: TrackingStep[];
}

export default function LogisticsPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Modal State
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editCourier, setEditCourier] = useState('');
  const [editTrackingId, setEditTrackingId] = useState('');
  const [editDeliveryCost, setEditDeliveryCost] = useState('0');
  const [saving, setSaving] = useState(false);

  // Tracking Modal State
  const [trackingSale, setTrackingSale] = useState<SaleRecord | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchSales();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch { /* ignore */ }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales');
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleOpenEdit = (sale: SaleRecord) => {
    setEditingSale(sale);
    setEditStatus(sale.logisticsStatus);
    setEditCourier(sale.courierName || '');
    setEditTrackingId(sale.trackingId || '');
    setEditDeliveryCost(sale.deliveryCost.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingSale) return;
    setSaving(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: editingSale.id,
          logisticsStatus: editStatus,
          deliveryCost: parseFloat(editDeliveryCost || '0'),
          courierName: editCourier || null,
          trackingId: editTrackingId || null,
        }),
      });
      if (res.ok) {
        await fetchSales();
        setEditingSale(null);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleTrackOrder = async (sale: SaleRecord) => {
    setTrackingSale(sale);
    setTrackingLoading(true);
    setTrackingData(null);
    try {
      const courier = sale.courierName || 'Delhivery';
      const trackingId = sale.trackingId || `TEL-${sale.id}-${Date.now().toString().slice(-4)}`;
      const destination = sale.lead.stateCity;
      
      const res = await fetch(`/api/logistics/track?trackingId=${trackingId}&courier=${courier}&destination=${destination}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingData(data);
      }
    } catch { /* ignore */ }
    setTrackingLoading(false);
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'DELIVERED') return 'badge badge-green';
    if (status === 'CANCELLED_RETURNED') return 'badge badge-red';
    return 'badge badge-orange';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'DELIVERED') return 'Delivered';
    if (status === 'CANCELLED_RETURNED') return 'Returned';
    return 'Dispatched';
  };

  // Filter sales
  const filteredSales = sales.filter((s) => {
    const query = searchQuery.toLowerCase();
    return (
      s.lead.customerName.toLowerCase().includes(query) ||
      s.lead.phone.includes(query) ||
      (s.trackingId && s.trackingId.toLowerCase().includes(query)) ||
      (s.courierName && s.courierName.toLowerCase().includes(query)) ||
      s.lead.stateCity.toLowerCase().includes(query)
    );
  });

  // Calculate counts for stats
  const totalCount = sales.length;
  const dispatchedCount = sales.filter((s) => s.logisticsStatus === 'DISPATCHED').length;
  const deliveredCount = sales.filter((s) => s.logisticsStatus === 'DELIVERED').length;
  const returnedCount = sales.filter((s) => s.logisticsStatus === 'CANCELLED_RETURNED').length;

  const isEditableRole = user && ['ADMIN', 'MANAGER', 'TL'].includes(user.role);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Tracking & Logistics</h1>
          <p className="page-subtitle">Track and update customer order deliveries in real time.</p>
        </div>
      </div>

      <div className="page-body">
        {/* Statistics Cards */}
        <div className="grid-4 mb-24">
          <div className="stat-card blue">
            <span className="stat-label">Total Orders</span>
            <div className="stat-value">{totalCount}</div>
            <p className="text-sm text-muted">All booked sales</p>
          </div>
          <div className="stat-card amber">
            <span className="stat-label">Dispatched</span>
            <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{dispatchedCount}</div>
            <p className="text-sm text-muted">In-transit/Pending</p>
          </div>
          <div className="stat-card green">
            <span className="stat-label">Delivered</span>
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{deliveredCount}</div>
            <p className="text-sm text-muted">Successful orders</p>
          </div>
          <div className="stat-card red">
            <span className="stat-label">Returned / Cancelled</span>
            <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{returnedCount}</div>
            <p className="text-sm text-muted">Failed shipments</p>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="card mb-24" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Search by customer name, phone, city, courier or tracking ID..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product Variant</th>
                <th>Price (INR)</th>
                <th>Courier & Tracking ID</th>
                <th>Status</th>
                <th>Agent</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="loader" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <strong style={{ color: 'var(--accent-blue)' }}>#ORD-{sale.id}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {new Date(sale.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    </td>
                    <td>
                      <strong>{sale.lead.customerName}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {sale.lead.phone} • {sale.lead.stateCity}
                      </div>
                    </td>
                    <td>{sale.lead.productVariant}</td>
                    <td>
                      <strong>{formatINR(sale.grossAmount)}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {sale.paymentType} {sale.advanceAmount > 0 && `(Adv: ${formatINR(sale.advanceAmount)})`}
                      </div>
                    </td>
                    <td>
                      {sale.trackingId ? (
                        <>
                          <div style={{ fontWeight: 600 }}>{sale.courierName}</div>
                          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--accent-blue)' }}>
                            {sale.trackingId}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          No tracking details
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(sale.logisticsStatus)}>
                        {getStatusLabel(sale.logisticsStatus)}
                      </span>
                    </td>
                    <td>{sale.agent.fullName}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleTrackOrder(sale)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            color: 'var(--accent-blue)',
                            border: '1px solid var(--accent-blue)',
                            borderRadius: '4px',
                          }}
                        >
                          🔍 Track
                        </button>
                        
                        {isEditableRole && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenEdit(sale)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                            }}
                          >
                            ✏️ Update
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPDATE MODAL */}
      {editingSale && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal" style={{ width: '450px', animation: 'scaleUp 0.2s ease' }}>
            <div className="modal-header">
              <h3>Update Logistics Details</h3>
              <button className="close-btn" onClick={() => setEditingSale(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group mb-16">
                <label className="label">LOGISTICS STATUS</label>
                <select
                  className="select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED_RETURNED">Cancelled / Returned</option>
                </select>
              </div>

              <div className="form-group mb-16">
                <label className="label">COURIER SERVICE</label>
                <select
                  className="select"
                  value={editCourier}
                  onChange={(e) => setEditCourier(e.target.value)}
                >
                  <option value="">Select Courier</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="Blue Dart">Blue Dart</option>
                  <option value="Shiprocket">Shiprocket</option>
                  <option value="DTDC">DTDC</option>
                  <option value="ExpressBees">ExpressBees</option>
                </select>
              </div>

              <div className="form-group mb-16">
                <label className="label">TRACKING ID / WAYBILL</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 1234567890"
                  value={editTrackingId}
                  onChange={(e) => setEditTrackingId(e.target.value)}
                />
              </div>

              <div className="form-group mb-16">
                <label className="label">DELIVERY COST (₹)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={editDeliveryCost}
                  onChange={(e) => setEditDeliveryCost(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setEditingSale(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Updates'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRACKING DETAILS MODAL */}
      {trackingSale && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal" style={{ width: '550px', animation: 'scaleUp 0.2s ease' }}>
            <div className="modal-header">
              <h3>Live Shipping Status</h3>
              <button className="close-btn" onClick={() => setTrackingSale(null)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Order ID:</span>
                  <strong>#ORD-{trackingSale.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Customer Name:</span>
                  <strong>{trackingSale.lead.customerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Destination:</span>
                  <strong>{trackingSale.lead.stateCity}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Courier Name:</span>
                  <strong>{trackingSale.courierName || 'Delhivery (Default)'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Tracking Number:</span>
                  <strong style={{ color: 'var(--accent-blue)', fontFamily: 'monospace' }}>
                    {trackingSale.trackingId || 'N/A'}
                  </strong>
                </div>
              </div>

              {trackingLoading ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <div className="loader" style={{ margin: '0 auto' }} />
                  <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Querying Logistics API Portal...
                  </p>
                </div>
              ) : trackingData ? (
                <div>
                  <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Shipping Progress Timeline</h4>
                  <div style={{ position: 'relative', paddingLeft: '32px' }}>
                    {/* Timeline Line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '11px',
                        top: '12px',
                        bottom: '12px',
                        width: '2px',
                        background: 'var(--border-color)',
                        zIndex: 1,
                      }}
                    />

                    {trackingData.steps.map((step, index) => (
                      <div key={index} style={{ position: 'relative', marginBottom: '24px' }}>
                        {/* Status Checkpoint Node */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '-28px',
                            top: '2px',
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: step.completed ? 'var(--accent-green)' : 'var(--border-color)',
                            border: '3px solid var(--bg-card)',
                            boxShadow: step.completed ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none',
                            zIndex: 2,
                          }}
                        />

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: step.completed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                              {step.status}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                              {step.time}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Location: {step.location}
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--accent-red)' }}>
                  ⚠️ Failed to retrieve live logistics details. Please check the tracking number.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setTrackingSale(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
