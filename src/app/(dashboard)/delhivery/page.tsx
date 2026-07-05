'use client';
import { useEffect, useState } from 'react';

export default function DelhiveryPortal() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  // Daily Orders (CRM + Delhivery Live Sync)
  const [dailyOrders, setDailyOrders] = useState<any>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Track
  const [trackWaybill, setTrackWaybill] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  // Pincode
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<any>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Waybill
  const [waybillResult, setWaybillResult] = useState<any>(null);
  const [waybillLoading, setWaybillLoading] = useState(false);
  const [bulkCount, setBulkCount] = useState('5');
  const [bulkResult, setBulkResult] = useState<any>(null);

  // Rate Calculator
  const [originPin, setOriginPin] = useState('');
  const [destPin, setDestPin] = useState('');
  const [weight, setWeight] = useState('500');
  const [rateResult, setRateResult] = useState<any>(null);
  const [rateLoading, setRateLoading] = useState(false);

  // Label
  const [labelWaybill, setLabelWaybill] = useState('');
  const [labelUrl, setLabelUrl] = useState('');

  // Bulk Import
  const [importWaybills, setImportWaybills] = useState('');
  const [importResults, setImportResults] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  // Recent Orders
  const [recentOrders, setRecentOrders] = useState<any>(null);
  const [recentLoading, setRecentLoading] = useState(false);

  // Pickup Status
  const [pickupData, setPickupData] = useState<any>(null);
  const [pickupLoading, setPickupLoading] = useState(false);

  useEffect(() => { fetchOverview(); fetchDailyOrders(); }, []);

  const fetchDailyOrders = async () => {
    setDailyLoading(true);
    try {
      const res = await fetch('/api/delhivery/daily-sync');
      if (res.ok) { const d = await res.json(); setDailyOrders(d); }
    } catch {}
    setDailyLoading(false);
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delhivery?action=overview');
      if (res.ok) { const d = await res.json(); setOverview(d.data); }
    } catch {}
    setLoading(false);
  };

  const handleTrack = async () => {
    if (!trackWaybill.trim()) return;
    setTrackLoading(true); setTrackResult(null);
    try {
      const res = await fetch(`/api/delhivery?action=track&waybill=${trackWaybill.trim()}`);
      const d = await res.json(); setTrackResult(d.data);
    } catch {}
    setTrackLoading(false);
  };

  const handlePincode = async () => {
    if (!pincode.trim()) return;
    setPincodeLoading(true); setPincodeResult(null);
    try {
      const res = await fetch(`/api/delhivery?action=pincode&pincode=${pincode.trim()}`);
      const d = await res.json(); setPincodeResult(d.data);
    } catch {}
    setPincodeLoading(false);
  };

  const handleFetchWaybill = async () => {
    setWaybillLoading(true); setWaybillResult(null);
    try {
      const res = await fetch('/api/delhivery?action=fetch_waybill');
      const d = await res.json(); setWaybillResult(d.data);
    } catch {}
    setWaybillLoading(false);
  };

  const handleBulkWaybill = async () => {
    setWaybillLoading(true); setBulkResult(null);
    try {
      const res = await fetch(`/api/delhivery?action=fetch_waybills&count=${bulkCount}`);
      const d = await res.json(); setBulkResult(d.data);
    } catch {}
    setWaybillLoading(false);
  };

  const handleRate = async () => {
    if (!originPin || !destPin) return;
    setRateLoading(true); setRateResult(null);
    try {
      const res = await fetch(`/api/delhivery?action=calculate&origin_pin=${originPin}&dest_pin=${destPin}&weight=${weight}`);
      const d = await res.json(); setRateResult(d.data);
    } catch {}
    setRateLoading(false);
  };

  const handleLabel = async () => {
    if (!labelWaybill.trim()) return;
    try {
      const res = await fetch(`/api/delhivery?action=label&waybill=${labelWaybill.trim()}`);
      const d = await res.json(); if (d.labelUrl) setLabelUrl(d.labelUrl);
    } catch {}
  };

  const handleBulkImport = async () => {
    const wbs = importWaybills.split(/[,\n\s]+/).map(w => w.trim()).filter(Boolean);
    if (wbs.length === 0) { setImportError('Please enter at least one waybill number.'); return; }
    setImportLoading(true); setImportResults([]); setImportError('');
    try {
      // Delhivery supports comma-separated waybills in one call
      const batchSize = 25;
      const allResults: any[] = [];
      for (let i = 0; i < wbs.length; i += batchSize) {
        const batch = wbs.slice(i, i + batchSize).join(',');
        const res = await fetch(`/api/delhivery?action=track_bulk&waybills=${batch}`);
        const d = await res.json();
        if (d.data?.ShipmentData) {
          d.data.ShipmentData.forEach((sd: any) => allResults.push(sd));
        }
      }
      setImportResults(allResults);
      if (allResults.length === 0) setImportError('No shipment data found for the given waybills.');
    } catch { setImportError('Failed to fetch from Delhivery API.'); }
    setImportLoading(false);
  };

  const handleRecentOrders = async () => {
    setRecentLoading(true); setRecentOrders(null);
    try {
      const res = await fetch('/api/delhivery?action=recent_orders&page_size=50');
      const d = await res.json(); setRecentOrders(d);
    } catch {}
    setRecentLoading(false);
  };

  const handlePickupStatus = async () => {
    setPickupLoading(true); setPickupData(null);
    try {
      const res = await fetch('/api/delhivery?action=pickup_status');
      const d = await res.json(); setPickupData(d);
    } catch {}
    setPickupLoading(false);
  };

  const tabs = [
    { id: 'daily', label: '📊 Daily Orders' },
    { id: 'recent', label: '🚚 Quick Track' },
    { id: 'track', label: '📦 Track Shipment' },
    { id: 'overview', label: '⚙️ API Overview' },
    { id: 'pincode', label: '📍 Pincode Check' },
    { id: 'waybill', label: '🔢 Fetch Waybills' },
    { id: 'rate', label: '💰 Rate Calculator' },
    { id: 'label', label: '🏷️ Shipping Label' },
  ];

  const JsonBlock = ({ data }: { data: any }) => (
    <pre style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  return (
    <>
      <div className="page-header" style={{ paddingBottom: 0, borderBottom: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingBottom: '16px' }}>
          <div>
            <h1 className="page-title">🚚 Delhivery Integration Portal</h1>
            <p className="page-subtitle">Live API connection to your Delhivery account</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchOverview}>⚡ Refresh</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', overflowX: 'auto', width: '100%' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '8px 16px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : 'none',
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: '16px' }}>
        {loading && !overview && !dailyOrders ? <div className="loader" /> : (
          <>
            {/* DAILY ORDERS TAB */}
            {activeTab === 'daily' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="card-title">CRM Orders × Delhivery Live Tracking</h3>
                  <button className="btn btn-primary btn-sm" onClick={fetchDailyOrders} disabled={dailyLoading}>
                    {dailyLoading ? '⏳ Syncing...' : '🔄 Sync with Delhivery'}
                  </button>
                </div>

                {dailyLoading && <div className="loader" />}

                {dailyOrders && dailyOrders.success && (
                  <>
                    <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="stat-card blue">
                        <span className="stat-label">Total Orders</span>
                        <div className="stat-value">{dailyOrders.stats?.total || 0}</div>
                        <p className="text-sm text-muted">With Delhivery waybills</p>
                      </div>
                      <div className="stat-card yellow">
                        <span className="stat-label">Dispatched</span>
                        <div className="stat-value">{dailyOrders.stats?.dispatched || 0}</div>
                        <p className="text-sm text-muted">In transit / Pending</p>
                      </div>
                      <div className="stat-card green">
                        <span className="stat-label">Delivered</span>
                        <div className="stat-value">{dailyOrders.stats?.delivered || 0}</div>
                        <p className="text-sm text-muted">Successfully delivered</p>
                      </div>
                      <div className="stat-card red">
                        <span className="stat-label">Returned / RTO</span>
                        <div className="stat-value">{dailyOrders.stats?.returned || 0}</div>
                        <p className="text-sm text-muted">Cancelled / Returned</p>
                      </div>
                    </div>

                    {dailyOrders.orders && dailyOrders.orders.length > 0 ? (
                      <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 className="card-title">📦 All Delhivery Shipments ({dailyOrders.orders.length})</h3>
                          <span className="text-sm text-muted">Last synced: {dailyOrders.syncedAt ? new Date(dailyOrders.syncedAt).toLocaleString('en-IN') : '-'}</span>
                        </div>
                        <div className="table-container" style={{ marginTop: '12px' }}>
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Amount</th>
                                <th>Waybill</th>
                                <th>CRM Status</th>
                                <th>Delhivery Live Status</th>
                                <th>Last Scan</th>
                                <th>Agent</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dailyOrders.orders.map((o: any, i: number) => {
                                const st = o.liveTracking?.statusType;
                                const badgeClass = st === 'DL' ? 'badge-green' : st === 'RT' ? 'badge-red' : st ? 'badge-blue' : 'badge-yellow';
                                return (
                                  <tr key={i}>
                                    <td style={{ fontWeight: 700 }}>{o.orderId}</td>
                                    <td>
                                      <strong>{o.customer?.name}</strong>
                                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{o.customer?.phone} • {o.customer?.city}</div>
                                    </td>
                                    <td>{o.product}</td>
                                    <td style={{ fontWeight: 600 }}>₹{o.amount} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{o.paymentType}</span></td>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-blue)', cursor: 'pointer' }}
                                        onClick={() => { setTrackWaybill(o.waybill); setActiveTab('track'); }}>
                                      {o.waybill || '-'}
                                    </td>
                                    <td><span className={`badge ${o.crmStatus === 'DELIVERED' ? 'badge-green' : o.crmStatus === 'CANCELLED_RETURNED' ? 'badge-red' : 'badge-yellow'}`}>{o.crmStatus}</span></td>
                                    <td><span className={`badge ${badgeClass}`}>{o.liveTracking?.status || 'No data'}</span></td>
                                    <td style={{ fontSize: '11px' }}>
                                      {o.liveTracking?.lastScan ? (
                                        <div>
                                          <div style={{ fontWeight: 600 }}>{o.liveTracking.lastScan.status}</div>
                                          <div style={{ color: 'var(--text-secondary)' }}>{o.liveTracking.lastScan.location}</div>
                                          <div style={{ fontFamily: 'monospace', fontSize: '10px' }}>{o.liveTracking.lastScan.dateTime}</div>
                                        </div>
                                      ) : <span className="text-muted">-</span>}
                                    </td>
                                    <td>{o.agent}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                        <h3 style={{ marginBottom: '8px', color: 'var(--text-heading)' }}>No Delhivery Orders Yet</h3>
                        <p className="text-sm text-muted" style={{ marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                          Orders need to have a Delhivery waybill (tracking ID) and courier set to "Delhivery" in the CRM to appear here.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', maxWidth: '500px', margin: '0 auto', fontSize: '13px' }}>
                          <p><strong>Option 1:</strong> Go to <strong>Order Tracking</strong> → click <strong>Update</strong> on an order → set courier to "Delhivery" and add the waybill number</p>
                          <p><strong>Option 2:</strong> Use the <strong>Quick Track</strong> tab to directly track waybill numbers from your Delhivery portal</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {dailyOrders && !dailyOrders.success && (
                  <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: '4px solid var(--accent-red)' }}>
                    <p style={{ fontWeight: 600 }}>⚠️ {dailyOrders.error || dailyOrders.message}</p>
                  </div>
                )}
              </div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && overview && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="grid-3">
                  <div className="stat-card green">
                    <span className="stat-label">API Key Status</span>
                    <div className="stat-value" style={{ fontSize: '20px' }}>{overview.apiKeyValid ? '✅ Active' : '❌ Invalid'}</div>
                    <p className="text-sm text-muted">Key: {overview.apiKeyMasked}</p>
                  </div>
                  <div className="stat-card blue">
                    <span className="stat-label">Available Endpoints</span>
                    <div className="stat-value">{overview.endpoints ? Object.keys(overview.endpoints).length : 0}</div>
                    <p className="text-sm text-muted">Live Delhivery APIs</p>
                  </div>
                  <div className="stat-card purple">
                    <span className="stat-label">Sample Waybill</span>
                    <div className="stat-value" style={{ fontSize: '16px', wordBreak: 'break-all' }}>{overview.sampleWaybill || 'N/A'}</div>
                    <p className="text-sm text-muted">Auto-generated test waybill</p>
                  </div>
                </div>
                {overview.endpoints && (
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '12px' }}>Connected API Endpoints</h3>
                    <div className="table-container">
                      <table className="table">
                        <thead><tr><th>Service</th><th>Endpoint URL</th><th>Status</th></tr></thead>
                        <tbody>
                          {Object.entries(overview.endpoints).map(([key, url]) => (
                            <tr key={key}>
                              <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--accent-blue)' }}>{url as string}</td>
                              <td><span className="badge badge-green">Connected</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {overview.apiError && (
                  <div className="card" style={{ borderLeft: '4px solid var(--accent-red)', padding: '16px' }}>
                    <strong style={{ color: 'var(--accent-red)' }}>⚠️ API Error:</strong>
                    <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>{overview.apiError}</p>
                  </div>
                )}
              </div>
            )}

            {/* TRACK TAB */}
            {activeTab === 'track' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px' }}>Track Shipment by Waybill</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input className="input" placeholder="Enter Delhivery Waybill Number..." value={trackWaybill} onChange={e => setTrackWaybill(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleTrack()} />
                    <button className="btn btn-primary" onClick={handleTrack} disabled={trackLoading}>{trackLoading ? 'Tracking...' : '🔍 Track'}</button>
                  </div>
                </div>
                {trackResult && (
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '12px' }}>Tracking Result</h3>
                    {trackResult.ShipmentData && trackResult.ShipmentData.length > 0 ? (
                      <div>
                        {trackResult.ShipmentData.map((sd: any, i: number) => {
                          const s = sd.Shipment;
                          return (
                            <div key={i} style={{ marginBottom: '16px' }}>
                              <div className="grid-3" style={{ marginBottom: '16px' }}>
                                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                                  <span className="stat-label">Status</span>
                                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: 'var(--text-heading)' }}>{s?.Status?.Status || 'Unknown'}</div>
                                </div>
                                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                                  <span className="stat-label">Origin → Destination</span>
                                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>{s?.Origin || '?'} → {s?.Destination || '?'}</div>
                                </div>
                                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                                  <span className="stat-label">Charges</span>
                                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: 'var(--accent-green)' }}>₹{s?.ChargedAmount || 0}</div>
                                </div>
                              </div>
                              {s?.Scans && s.Scans.length > 0 && (
                                <div>
                                  <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Scan History ({s.Scans.length} events)</h4>
                                  <div className="table-container">
                                    <table className="table">
                                      <thead><tr><th>Status</th><th>Location</th><th>Date/Time</th><th>Instructions</th></tr></thead>
                                      <tbody>
                                        {[...s.Scans].reverse().map((scan: any, j: number) => (
                                          <tr key={j}>
                                            <td style={{ fontWeight: 600 }}>{scan.ScanDetail?.Scan || scan.ScanDetail?.ScanType || '-'}</td>
                                            <td>{scan.ScanDetail?.ScannedLocation || '-'}</td>
                                            <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{scan.ScanDetail?.ScanDateTime || '-'}</td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{scan.ScanDetail?.Instructions || '-'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>No shipment data found for this waybill. Raw response:</p>
                        <JsonBlock data={trackResult} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PINCODE TAB */}
            {activeTab === 'pincode' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px' }}>Check Pincode Serviceability</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input className="input" placeholder="Enter Pincode (e.g. 110001)" value={pincode} onChange={e => setPincode(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && handlePincode()} />
                    <button className="btn btn-primary" onClick={handlePincode} disabled={pincodeLoading}>{pincodeLoading ? 'Checking...' : '📍 Check'}</button>
                  </div>
                </div>
                {pincodeResult && (
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '12px' }}>Pincode Serviceability Result</h3>
                    {pincodeResult.delivery_codes && pincodeResult.delivery_codes.length > 0 ? (
                      <div className="table-container">
                        <table className="table">
                          <thead><tr><th>Pincode</th><th>City</th><th>State</th><th>District</th><th>COD</th><th>Prepaid</th><th>Pickup</th><th>Repl</th></tr></thead>
                          <tbody>
                            {pincodeResult.delivery_codes.map((dc: any, i: number) => {
                              const p = dc.postal_code;
                              return (
                                <tr key={i}>
                                  <td style={{ fontWeight: 700 }}>{p?.pin}</td>
                                  <td>{p?.city}</td>
                                  <td>{p?.state_code}</td>
                                  <td>{p?.district}</td>
                                  <td><span className={`badge ${p?.cod === 'Y' ? 'badge-green' : 'badge-red'}`}>{p?.cod}</span></td>
                                  <td><span className={`badge ${p?.pre_paid === 'Y' ? 'badge-green' : 'badge-red'}`}>{p?.pre_paid}</span></td>
                                  <td><span className={`badge ${p?.pickup === 'Y' ? 'badge-green' : 'badge-red'}`}>{p?.pickup}</span></td>
                                  <td><span className={`badge ${p?.repl === 'Y' ? 'badge-green' : 'badge-red'}`}>{p?.repl}</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : <JsonBlock data={pincodeResult} />}
                  </div>
                )}
              </div>
            )}

            {/* WAYBILL TAB */}
            {activeTab === 'waybill' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="grid-2">
                  <div className="card" style={{ padding: '24px' }}>
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>Fetch Single Waybill</h3>
                    <p className="text-sm text-muted" style={{ marginBottom: '12px' }}>Generate one fresh waybill number from your Delhivery account.</p>
                    <button className="btn btn-primary" onClick={handleFetchWaybill} disabled={waybillLoading}>{waybillLoading ? 'Fetching...' : '🔢 Generate Waybill'}</button>
                    {waybillResult && (
                      <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: 'var(--accent-blue)', textAlign: 'center' }}>
                        {typeof waybillResult === 'string' ? waybillResult : JSON.stringify(waybillResult)}
                      </div>
                    )}
                  </div>
                  <div className="card" style={{ padding: '24px' }}>
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>Fetch Bulk Waybills</h3>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <input className="input" type="number" placeholder="Count" value={bulkCount} onChange={e => setBulkCount(e.target.value)} style={{ width: '100px' }} />
                      <button className="btn btn-primary" onClick={handleBulkWaybill} disabled={waybillLoading}>{waybillLoading ? 'Fetching...' : '📦 Generate Bulk'}</button>
                    </div>
                    {bulkResult && <JsonBlock data={bulkResult} />}
                  </div>
                </div>
              </div>
            )}

            {/* RATE CALCULATOR TAB */}
            {activeTab === 'rate' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px' }}>Shipping Cost Calculator</h3>
                  <div className="grid-3" style={{ marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="label">Origin Pincode</label>
                      <input className="input" placeholder="e.g. 110001" value={originPin} onChange={e => setOriginPin(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="label">Destination Pincode</label>
                      <input className="input" placeholder="e.g. 400001" value={destPin} onChange={e => setDestPin(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="label">Weight (grams)</label>
                      <input className="input" type="number" placeholder="500" value={weight} onChange={e => setWeight(e.target.value)} />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handleRate} disabled={rateLoading}>{rateLoading ? 'Calculating...' : '💰 Calculate Charges'}</button>
                </div>
                {rateResult && (
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '12px' }}>Estimated Shipping Charges</h3>
                    <JsonBlock data={rateResult} />
                  </div>
                )}
              </div>
            )}

            {/* LABEL TAB */}
            {activeTab === 'label' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="card-title" style={{ marginBottom: '16px' }}>Generate Shipping Label / Packing Slip</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input className="input" placeholder="Enter Waybill Number" value={labelWaybill} onChange={e => setLabelWaybill(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={handleLabel}>🏷️ Generate Label</button>
                  </div>
                </div>
                {labelUrl && (
                  <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '12px' }}>Your shipping label is ready:</p>
                    <a href={labelUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success">📄 Download / View Packing Slip</a>
                    <p className="text-sm text-muted" style={{ marginTop: '12px' }}>Link: <code style={{ fontSize: '11px' }}>{labelUrl}</code></p>
                  </div>
                )}
              </div>
            )}

            {/* IMPORT ORDERS TAB */}
            {activeTab === 'import' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="card-title" style={{ marginBottom: '8px' }}>Bulk Import Orders from Delhivery</h3>
                  <p className="text-sm text-muted" style={{ marginBottom: '16px' }}>Paste your Delhivery waybill numbers below (comma-separated or one per line). We will fetch all shipment details from your Delhivery account.</p>
                  <textarea
                    className="input"
                    rows={5}
                    placeholder={`Paste waybill numbers here, e.g.:\n1234567890001\n1234567890002\n1234567890003`}
                    value={importWaybills}
                    onChange={e => setImportWaybills(e.target.value)}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                    <button className="btn btn-primary" onClick={handleBulkImport} disabled={importLoading}>
                      {importLoading ? 'Fetching from Delhivery...' : '📋 Import All Orders'}
                    </button>
                    <span className="text-sm text-muted">
                      {importWaybills.split(/[,\n\s]+/).filter(Boolean).length} waybills entered
                    </span>
                  </div>
                  {importError && <p style={{ color: 'var(--accent-red)', marginTop: '12px', fontSize: '13px' }}>⚠️ {importError}</p>}
                </div>

                {importResults.length > 0 && (
                  <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className="card-title">Imported Shipments ({importResults.length})</h3>
                    </div>
                    <div className="table-container" style={{ marginTop: '12px' }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Waybill</th>
                            <th>Consignee</th>
                            <th>Origin</th>
                            <th>Destination</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Amount</th>
                            <th>Weight</th>
                            <th>Scans</th>
                            <th>Last Update</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResults.map((sd: any, i: number) => {
                            const s = sd.Shipment;
                            const lastScan = s?.Scans?.[s.Scans.length - 1]?.ScanDetail;
                            const statusType = s?.Status?.StatusType || '';
                            const badgeClass = statusType === 'DL' ? 'badge-green' : statusType === 'RT' ? 'badge-red' : 'badge-blue';
                            return (
                              <tr key={i}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-blue)' }}>{s?.AWB || 'N/A'}</td>
                                <td>
                                  <strong>{s?.Consignee?.Name || 'N/A'}</strong>
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s?.Consignee?.Phone || ''}</div>
                                </td>
                                <td>{s?.Origin || '-'}</td>
                                <td>{s?.Destination || '-'}</td>
                                <td>
                                  <span className={`badge ${badgeClass}`}>
                                    {s?.Status?.Status || statusType || 'Unknown'}
                                  </span>
                                </td>
                                <td>{s?.OrderType || '-'}</td>
                                <td style={{ fontWeight: 600 }}>₹{s?.ChargedAmount || s?.CODAmount || 0}</td>
                                <td>{s?.ChargedWeight ? `${s.ChargedWeight}g` : '-'}</td>
                                <td>{s?.Scans?.length || 0}</td>
                                <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>{lastScan?.ScanDateTime || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RECENT ORDERS / QUICK TRACK TAB */}
            {activeTab === 'recent' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: '4px solid var(--accent-blue)' }}>
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>💡 How to check your orders</p>
                  <p className="text-sm text-muted">Delhivery API requires waybill numbers to track orders. Copy the waybill numbers from your Delhivery portal (the ones shown when you created the pickup) and paste them below.</p>
                </div>
                <div className="card" style={{ padding: '24px' }}>
                  <h3 className="card-title" style={{ marginBottom: '8px' }}>🚚 Quick Track — Paste Your Waybills</h3>
                  <p className="text-sm text-muted" style={{ marginBottom: '16px' }}>Paste the waybill numbers from your Delhivery portal pickup (comma-separated or one per line). We will fetch live tracking for all of them.</p>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder={`Paste waybill numbers here, e.g.:\n1234567890001\n1234567890002`}
                    value={importWaybills}
                    onChange={e => setImportWaybills(e.target.value)}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                    <button className="btn btn-primary" onClick={handleBulkImport} disabled={importLoading}>
                      {importLoading ? '⏳ Fetching from Delhivery...' : '🔍 Track All Orders'}
                    </button>
                    <span className="text-sm text-muted">
                      {importWaybills.split(/[,\n\s]+/).filter(Boolean).length} waybills entered
                    </span>
                  </div>
                  {importError && <p style={{ color: 'var(--accent-red)', marginTop: '12px', fontSize: '13px' }}>⚠️ {importError}</p>}
                </div>

                {importResults.length > 0 && (
                  <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className="card-title">✅ Live Order Status ({importResults.length} shipments)</h3>
                      <span className="badge badge-green">From Delhivery API</span>
                    </div>
                    <div className="table-container" style={{ marginTop: '12px' }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Waybill</th>
                            <th>Consignee</th>
                            <th>Origin</th>
                            <th>Destination</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Amount</th>
                            <th>Weight</th>
                            <th>Scans</th>
                            <th>Last Update</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResults.map((sd: any, i: number) => {
                            const s = sd.Shipment;
                            const lastScan = s?.Scans?.[s.Scans.length - 1]?.ScanDetail;
                            const statusType = s?.Status?.StatusType || '';
                            const badgeClass = statusType === 'DL' ? 'badge-green' : statusType === 'RT' ? 'badge-red' : 'badge-blue';
                            return (
                              <tr key={i}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-blue)' }}>{s?.AWB || 'N/A'}</td>
                                <td>
                                  <strong>{s?.Consignee?.Name || 'N/A'}</strong>
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s?.Consignee?.Phone || ''}</div>
                                </td>
                                <td>{s?.Origin || '-'}</td>
                                <td>{s?.Destination || '-'}</td>
                                <td>
                                  <span className={`badge ${badgeClass}`}>
                                    {s?.Status?.Status || statusType || 'Unknown'}
                                  </span>
                                </td>
                                <td>{s?.OrderType || '-'}</td>
                                <td style={{ fontWeight: 600 }}>₹{s?.ChargedAmount || s?.CODAmount || 0}</td>
                                <td>{s?.ChargedWeight ? `${s.ChargedWeight}g` : '-'}</td>
                                <td>{s?.Scans?.length || 0}</td>
                                <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>{lastScan?.ScanDateTime || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="card" style={{ padding: '24px', background: 'var(--bg-primary)' }}>
                  <h3 className="card-title" style={{ marginBottom: '12px' }}>📌 Where to find your waybill numbers</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <p>1. Log in to your <a href="https://ucp.delhivery.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Delhivery Portal →</a></p>
                    <p>2. Go to <strong>Shipments</strong> or <strong>Orders</strong> section</p>
                    <p>3. Copy the <strong>Waybill / AWB numbers</strong> for your pickup orders</p>
                    <p>4. Paste them above and click <strong>"Track All Orders"</strong></p>
                  </div>
                </div>
              </div>
            )}

            {/* PICKUP STATUS TAB */}
            {activeTab === 'pickup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 className="card-title">Pickup Request Status</h3>
                      <p className="text-sm text-muted">Check today's pickup requests and their current status</p>
                    </div>
                    <button className="btn btn-primary" onClick={handlePickupStatus} disabled={pickupLoading}>
                      {pickupLoading ? '⏳ Loading...' : '📋 Check Pickup Status'}
                    </button>
                  </div>
                  {pickupData && (
                    <div>
                      {pickupData.success && pickupData.data ? (
                        <div>
                          <div className="stat-card green" style={{ marginBottom: '16px' }}>
                            <span className="stat-label">Pickup Data Retrieved</span>
                            <div className="stat-value" style={{ fontSize: '16px' }}>✅ Success</div>
                            <p className="text-sm text-muted">Date: {new Date().toLocaleDateString('en-IN')}</p>
                          </div>
                          <JsonBlock data={pickupData.data} />
                        </div>
                      ) : (
                        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: '4px solid var(--accent-yellow)' }}>
                          <p style={{ fontWeight: 600, marginBottom: '8px' }}>⚠️ {pickupData.error || 'Could not fetch pickup status'}</p>
                          <p className="text-sm text-muted">Pickup API may not be available for your Delhivery account type. Check the Delhivery portal directly.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
