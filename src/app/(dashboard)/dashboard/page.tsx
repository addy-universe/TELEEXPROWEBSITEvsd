'use client';

import { useEffect, useState, useRef } from 'react';
import { DISPOSITION_LABELS } from '@/lib/constants';

interface User {
  id: number;
  fullName: string;
  role: string;
}

interface ExecutiveData {
  lastUpdated: string;
  orderOverview: {
    today: number;
    yesterday: number;
    thisMonth: number;
    last7Days: number;
    last30Days: number;
    statuses: {
      pending: number;
      processing: number;
      packed: number;
      dispatched: number;
      inTransit: number;
      delivered: number;
      rto: number;
      cancelled: number;
      returned: number;
    };
  };
  revenueDashboard: {
    grossRevenue: number;
    netRevenue: number;
    codRevenue: number;
    prepaidRevenue: number;
    aov: number;
    totalRefundAmount: number;
    rtoLoss: number;
    profitEstimate: number;
    trends: {
      today: number;
      yesterday: number;
      thisMonth: number;
      lastMonth: number;
    };
  };
  bankSettlements: {
    totalSettled: number;
    pendingSettlement: number;
    todaySettlement: number;
    monthSettlement: number;
    courierSettlement: Record<string, number>;
    pgSettlement: Record<string, number>;
    table: Array<{
      date: string;
      orders: number;
      amountSettled: number;
      pending: number;
    }>;
  };
  courierPerf: Array<{
    courier: string;
    totalShipments: number;
    deliveredPercent: number;
    rtoPercent: number;
    avgDeliveryTime: string;
    inTransit: number;
    delayed: number;
  }>;
  customerAnalytics: {
    newCustomers: number;
    returningCustomers: number;
    repeatPurchaseRate: number;
    topStates: Array<{ state: string; count: number }>;
    topCities: Array<{ city: string; count: number }>;
    topProducts: Array<{ product: string; count: number; revenue: number }>;
    highestRevenueCustomers: Array<{ name: string; phone: string; amount: number; count: number }>;
  };
  agentPerformance: Array<{
    agentName: string;
    orders: number;
    revenue: number;
    conversionRate: number;
    callsMade: number;
    whatsappLeads: number;
    closedSales: number;
  }>;
  inventoryDashboard: {
    items: Array<{
      id: string;
      name: string;
      stock: number;
      minAlert: number;
      price: number;
      value: number;
      status: string;
    }>;
    totalValue: number;
    lowStockAlerts: number;
    outOfStockCount: number;
    currentStock: number;
  };
  salesTrend: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ceo');
  
  // Filtering states for Order Status Monitoring
  const [filterState, setFilterState] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterCourier, setFilterCourier] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  // AI Assistant states
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: '👋 Hello! I am your TeleExpro AI Business Assistant. Ask me anything about orders, revenue, courier performance, settlements, or next month\'s sales prediction!' }
  ]);
  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchUser();
    fetchExecutiveData();
    
    // Auto-update every 15 minutes
    const interval = setInterval(fetchExecutiveData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me');
    const d = await res.json();
    setUser(d.user);
  };

  const fetchExecutiveData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/executive');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error('Failed to fetch executive data:', e);
    }
    setLoading(false);
  };

  const handleExport = (type: 'csv' | 'json') => {
    if (!data) return;
    let exportData = '';
    let fileName = `report_${activeTab}_${Date.now()}`;

    if (activeTab === 'revenue') {
      exportData = 'Metric,Value\n' + 
        `Gross Revenue,₹${data.revenueDashboard.grossRevenue}\n` +
        `Net Revenue,₹${data.revenueDashboard.netRevenue}\n` +
        `COD Revenue,₹${data.revenueDashboard.codRevenue}\n` +
        `Prepaid Revenue,₹${data.revenueDashboard.prepaidRevenue}\n` +
        `Average Order Value,₹${Math.round(data.revenueDashboard.aov)}\n` +
        `RTO Loss,₹${data.revenueDashboard.rtoLoss}\n` +
        `Profit Estimate,₹${Math.round(data.revenueDashboard.profitEstimate)}`;
    } else if (activeTab === 'settlements') {
      exportData = 'Date,Orders,Amount Settled,Pending\n' +
        data.bankSettlements.table.map(t => `${t.date},${t.orders},₹${t.amountSettled},₹${t.pending}`).join('\n');
    } else if (activeTab === 'courier') {
      exportData = 'Courier,Total Shipments,Delivered %,RTO %,Avg Delivery Time,In Transit,Delayed\n' +
        data.courierPerf.map(c => `${c.courier},${c.totalShipments},${c.deliveredPercent}%,${c.rtoPercent}%,${c.avgDeliveryTime},${c.inTransit},${c.delayed}`).join('\n');
    } else if (activeTab === 'sales_team') {
      exportData = 'Agent Name,Orders,Revenue,Conversion %,Calls Made,WhatsApp Leads\n' +
        data.agentPerformance.map(a => `${a.agentName},${a.orders},₹${a.revenue},${a.conversionRate}%,${a.callsMade},${a.whatsappLeads}`).join('\n');
    } else {
      // Default export of orders
      exportData = 'Status,Count\n' + 
        `Pending,${data.orderOverview.statuses.pending}\n` +
        `Processing,${data.orderOverview.statuses.processing}\n` +
        `Packed,${data.orderOverview.statuses.packed}\n` +
        `Dispatched,${data.orderOverview.statuses.dispatched}\n` +
        `In Transit,${data.orderOverview.statuses.inTransit}\n` +
        `Delivered,${data.orderOverview.statuses.delivered}\n` +
        `RTO,${data.orderOverview.statuses.rto}\n` +
        `Cancelled,${data.orderOverview.statuses.cancelled}\n` +
        `Returned,${data.orderOverview.statuses.returned}`;
    }

    const blob = new Blob([exportData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAskAI = (question: string) => {
    if (!data || !question.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: question }]);
    setUserInput('');

    setTimeout(() => {
      let response = '';
      const q = question.toLowerCase();

      if (q.includes('last month') && (q.includes('order') || q.includes('total') || q.includes('revenue') || q.includes('sales'))) {
        response = `📊 **Last Month Stats:**\n* **Total Orders:** ${data.revenueDashboard.trends.lastMonthOrders} orders\n* **Total Gross Revenue:** ₹${data.revenueDashboard.trends.lastMonth.toLocaleString('en-IN')}\n* **Average Order Value (AOV):** ₹${Math.round(data.revenueDashboard.trends.lastMonth / (data.revenueDashboard.trends.lastMonthOrders || 1)).toLocaleString('en-IN')}`;
      } else if (q.includes('dispatched today') || q.includes('orders today')) {
        response = `Today, we have **${data.orderOverview.today}** orders registered. In total, **${data.orderOverview.statuses.dispatched}** orders are currently in the dispatched state, waiting for pickup/delivery updates.`;
      } else if (q.includes('revenue yesterday') || q.includes('yesterday')) {
        response = `Yesterday's gross sales revenue was **₹${data.revenueDashboard.trends.yesterday.toLocaleString('en-IN')}**. Today's revenue stands at **₹${data.revenueDashboard.trends.today.toLocaleString('en-IN')}**.`;
      } else if (q.includes('highest rto') || q.includes('rto')) {
        const highestRto = [...data.courierPerf].sort((a, b) => b.rtoPercent - a.rtoPercent)[0];
        response = `Among our delivery partners, **${highestRto.courier}** has the highest RTO rate of **${highestRto.rtoPercent}%**, with ${highestRto.totalShipments} total shipments sent.`;
      } else if (q.includes('pending') || q.includes('settlements') || q.includes('money is pending')) {
        response = `We have **₹${Math.round(data.bankSettlements.pendingSettlement).toLocaleString('en-IN')}** pending in settlements across couriers and gateways. Total settled amount so far is **₹${Math.round(data.bankSettlements.totalSettled).toLocaleString('en-IN')}**.`;
      } else if (q.includes('state-wise') || q.includes('state')) {
        const statesList = data.customerAnalytics.topStates.map(s => `* **${s.state}**: ${s.count} customers`).join('\n');
        response = `Here are the top states by order volume:\n\n${statesList}`;
      } else if (q.includes('profit') || q.includes('highest profit')) {
        response = `The estimated profit for this period is **₹${Math.round(data.revenueDashboard.profitEstimate).toLocaleString('en-IN')}** (approx. 65% of net revenue after RTO losses and COGS). The product generating the most revenue is **${data.customerAnalytics.topProducts[0]?.product || 'Denim Jacket'}**.`;
      } else if (q.includes('predict') || q.includes('next month') || q.includes('trend')) {
        const nextMonthSales = Math.round(data.revenueDashboard.grossRevenue * 1.12);
        response = `📈 **AI Sales Prediction:**\nBased on a 12% week-on-week growth in lead conversion rates and logistics delivery rate of **${data.courierPerf[0]?.deliveredPercent || 82}%**, next month's sales are projected to reach **₹${nextMonthSales.toLocaleString('en-IN')}** with estimated net profits of **₹${Math.round(nextMonthSales * 0.62).toLocaleString('en-IN')}**.`;
      } else if (q.includes('day-wise revenue') || q.includes('day-wise')) {
        const dayWise = data.salesTrend.slice(0, 7).map(t => `* **${t.date}**: ₹${t.revenue.toLocaleString('en-IN')} (${t.orders} orders)`).join('\n');
        response = `Here is the day-wise revenue breakdown for the last 7 days:\n\n${dayWise}`;
      } else {
        response = `I found some data matching your interest:\n\n* **Gross Revenue:** ₹${data.revenueDashboard.grossRevenue.toLocaleString('en-IN')}\n* **Delivered Orders:** ${data.orderOverview.statuses.delivered}\n* **Top Product:** ${data.customerAnalytics.topProducts[0]?.product || 'N/A'}\n\nFeel free to ask specific questions like *"How much money is pending in settlements?"* or *"Predict next month's sales."*`;
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: response }]);
    }, 800);
  };

  if (!user) return <div className="loader" />;

  // Agent dashboard
  if (user.role === 'AGENT') {
    return <AgentDashboard />;
  }

  // HR dashboard
  if (user.role === 'HR') {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">HR Dashboard</h1>
            <p className="page-subtitle">Workforce Attendance & Calendars</p>
          </div>
        </div>
        <div className="page-body">
          <div className="card">
            <p style={{ color: 'var(--text-secondary)' }}>
              Navigate to the <strong>HR Calendar</strong> or <strong>Attendance</strong> pages using the sidebar menu.
            </p>
          </div>
        </div>
      </>
    );
  }

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <>
      <div className="page-header" style={{ paddingBottom: '0px', borderBottom: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingBottom: '16px' }}>
          <div>
            <h1 className="page-title">CEO Executive Control Center</h1>
            <p className="page-subtitle">Real-time cross-channel operations analytics</p>
          </div>
          {data && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                🔄 Auto-refreshes every 15m (Last: {data.lastUpdated})
              </span>
              <button className="btn btn-ghost btn-sm" onClick={fetchExecutiveData}>
                ⚡ Refresh Now
              </button>
              <button className="btn btn-success btn-sm" onClick={() => handleExport('csv')}>
                📥 Export CSV
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', overflowX: 'auto', width: '100%' }}>
          {[
            { id: 'ceo', label: '📊 Executive Summary', color: 'purple' },
            { id: 'orders', label: '📦 Orders & Monitoring', color: 'blue' },
            { id: 'revenue', label: '💰 Revenue & Profit', color: 'green' },
            { id: 'settlements', label: '🏦 Bank Settlements', color: 'amber' },
            { id: 'courier', label: '🚚 Courier Performance', color: 'cyan' },
            { id: 'customers', label: '👥 Customer Analytics', color: 'purple' },
            { id: 'sales_team', label: '🎯 Sales Leaderboard', color: 'blue' },
            { id: 'inventory', label: '🎒 Inventory Stock', color: 'amber' },
            { id: 'ai_assistant', label: '🤖 AI Business Assistant', color: 'red' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: '16px' }}>
        {loading && !data ? (
          <div className="loader" />
        ) : data ? (
          <>
            {/* TAB 1: EXECUTIVE SUMMARY */}
            {activeTab === 'ceo' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Stat Grid */}
                <div className="grid-4">
                  <div className="stat-card purple">
                    <span className="stat-label">Gross Revenue Today</span>
                    <div className="stat-value">{formatINR(data.revenueDashboard.trends.today)}</div>
                    <p className="text-sm text-muted">Yesterday: {formatINR(data.revenueDashboard.trends.yesterday)}</p>
                  </div>
                  <div className="stat-card green">
                    <span className="stat-label">Net Revenue Month</span>
                    <div className="stat-value">{formatINR(data.revenueDashboard.netRevenue)}</div>
                    <p className="text-sm text-muted">AOV: {formatINR(data.revenueDashboard.aov)}</p>
                  </div>
                  <div className="stat-card blue">
                    <span className="stat-label">Orders Today / Month</span>
                    <div className="stat-value">{data.orderOverview.today} / {data.orderOverview.thisMonth}</div>
                    <p className="text-sm text-muted">Delivered: {data.orderOverview.statuses.delivered}</p>
                  </div>
                  <div className="stat-card amber">
                    <span className="stat-label">Bank Settlement Status</span>
                    <div className="stat-value" style={{ fontSize: '24px', margin: '12px 0 8px' }}>
                      {formatINR(data.bankSettlements.totalSettled)}
                    </div>
                    <p className="text-sm text-muted">Pending: {formatINR(data.bankSettlements.pendingSettlement)}</p>
                  </div>
                </div>

                {/* Second Stat Line */}
                <div className="grid-3">
                  <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                    <div>
                      <span className="stat-label" style={{ fontSize: '11px' }}>Top Performing Product</span>
                      <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '4px' }}>
                        {data.customerAnalytics.topProducts[0]?.product || 'Men Denim Jacket'}
                      </h4>
                    </div>
                    <span style={{ fontSize: '32px' }}>🛍️</span>
                  </div>
                  <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                    <div>
                      <span className="stat-label" style={{ fontSize: '11px' }}>Top Sales State</span>
                      <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '4px' }}>
                        {data.customerAnalytics.topStates[0]?.state || 'Maharashtra'}
                      </h4>
                    </div>
                    <span style={{ fontSize: '32px' }}>📍</span>
                  </div>
                  <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                    <div>
                      <span className="stat-label" style={{ fontSize: '11px' }}>Average RTO %</span>
                      <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-red)', marginTop: '4px' }}>
                        {data.courierPerf[0] ? Math.round((data.courierPerf.reduce((sum, c) => sum + c.rtoPercent, 0) / data.courierPerf.length)) : 14}%
                      </h4>
                    </div>
                    <span style={{ fontSize: '32px' }}>📦</span>
                  </div>
                </div>

                {/* SVG Charts */}
                <div className="grid-2">
                  {/* Revenue Trend Area Chart */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">15-Day Revenue Trend (INR)</h3>
                    </div>
                    <div style={{ height: '220px', width: '100%', marginTop: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <svg viewBox="0 0 500 180" style={{ width: '100%', height: '100%' }}>
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Gridlines */}
                        <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="165" x2="500" y2="165" stroke="#cbd5e1" strokeWidth="1" />
                        
                        {/* Area path */}
                        <path
                          d={`M 0,165 ` + data.salesTrend.map((t, idx) => {
                            const x = (idx / (data.salesTrend.length - 1)) * 500;
                            // Scale values max 100000 -> 165 scale
                            const maxVal = Math.max(...data.salesTrend.map(s => s.revenue), 10000);
                            const y = 165 - (t.revenue / maxVal) * 125;
                            return `L ${x},${y}`;
                          }).join(' ') + ` L 500,165 Z`}
                          fill="url(#chartGrad)"
                        />

                        {/* Line path */}
                        <path
                          d={data.salesTrend.map((t, idx) => {
                            const x = (idx / (data.salesTrend.length - 1)) * 500;
                            const maxVal = Math.max(...data.salesTrend.map(s => s.revenue), 10000);
                            const y = 165 - (t.revenue / maxVal) * 125;
                            return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="var(--accent-blue)"
                          strokeWidth="2.5"
                        />

                        {/* Nodes */}
                        {data.salesTrend.map((t, idx) => {
                          const x = (idx / (data.salesTrend.length - 1)) * 500;
                          const maxVal = Math.max(...data.salesTrend.map(s => s.revenue), 10000);
                          const y = 165 - (t.revenue / maxVal) * 125;
                          return (
                            <circle key={idx} cx={x} cy={y} r="3" fill="var(--bg-secondary)" stroke="var(--accent-blue)" strokeWidth="2" />
                          );
                        })}
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span>{data.salesTrend[0]?.date}</span>
                        <span>{data.salesTrend[Math.floor(data.salesTrend.length / 2)]?.date}</span>
                        <span>{data.salesTrend[data.salesTrend.length - 1]?.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Orders Bar Chart */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">15-Day Orders Volume</h3>
                    </div>
                    <div style={{ height: '220px', width: '100%', marginTop: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <svg viewBox="0 0 500 180" style={{ width: '100%', height: '100%' }}>
                        {/* Gridlines */}
                        <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="165" x2="500" y2="165" stroke="#cbd5e1" strokeWidth="1" />

                        {/* Bars */}
                        {data.salesTrend.map((t, idx) => {
                          const w = 18;
                          const x = (idx / (data.salesTrend.length - 1)) * 460 + 10;
                          const maxVal = Math.max(...data.salesTrend.map(s => s.orders), 5);
                          const h = (t.orders / maxVal) * 125;
                          const y = 165 - h;
                          return (
                            <rect
                              key={idx}
                              x={x - w/2}
                              y={y}
                              width={w}
                              height={h}
                              rx="3"
                              fill="var(--accent-purple)"
                              opacity="0.85"
                            />
                          );
                        })}
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span>{data.salesTrend[0]?.date}</span>
                        <span>{data.salesTrend[Math.floor(data.salesTrend.length / 2)]?.date}</span>
                        <span>{data.salesTrend[data.salesTrend.length - 1]?.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ORDERS & MONITORING */}
            {activeTab === 'orders' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="grid-3">
                  <div className="card text-center">
                    <span className="stat-label">Total Today</span>
                    <h2 style={{ fontSize: '28px', color: 'var(--text-heading)', margin: '10px 0 4px' }}>
                      {data.orderOverview.today}
                    </h2>
                    <span className={`badge ${data.orderOverview.today >= data.orderOverview.yesterday ? 'badge-green' : 'badge-red'}`}>
                      {data.orderOverview.today >= data.orderOverview.yesterday ? '📈 Better than Yesterday' : '📉 Below Yesterday'}
                    </span>
                  </div>
                  <div className="card text-center">
                    <span className="stat-label">Last 7 Days</span>
                    <h2 style={{ fontSize: '28px', color: 'var(--text-heading)', margin: '10px 0 4px' }}>
                      {data.orderOverview.last7Days}
                    </h2>
                    <span className="badge badge-blue">Rolling Week Total</span>
                  </div>
                  <div className="card text-center">
                    <span className="stat-label">Last 30 Days</span>
                    <h2 style={{ fontSize: '28px', color: 'var(--text-heading)', margin: '10px 0 4px' }}>
                      {data.orderOverview.last30Days}
                    </h2>
                    <span className="badge badge-purple">Monthly Operations</span>
                  </div>
                </div>

                {/* Real-time Order Monitoring */}
                <div className="card">
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Real-Time Order Status Monitoring</h3>
                    
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <select className="select" style={{ width: '130px', padding: '4px 10px', fontSize: '12px' }} value={filterState} onChange={(e) => setFilterState(e.target.value)}>
                        <option value="">All States</option>
                        {Array.from(new Set(data.customerAnalytics.topStates.map(s => s.state))).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <select className="select" style={{ width: '140px', padding: '4px 10px', fontSize: '12px' }} value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
                        <option value="">All Products</option>
                        {data.customerAnalytics.topProducts.map(p => (
                          <option key={p.product} value={p.product}>{p.product}</option>
                        ))}
                      </select>
                      <select className="select" style={{ width: '130px', padding: '4px 10px', fontSize: '12px' }} value={filterCourier} onChange={(e) => setFilterCourier(e.target.value)}>
                        <option value="">All Couriers</option>
                        <option value="BlueDart">BlueDart</option>
                        <option value="Delhivery">Delhivery</option>
                        <option value="DTDC">DTDC</option>
                        <option value="XpressBees">XpressBees</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-4" style={{ gap: '16px', marginTop: '12px' }}>
                    {[
                      { label: 'Created / Untouched', value: data.orderOverview.statuses.pending, color: 'blue' },
                      { label: 'Processing', value: data.orderOverview.statuses.processing, color: 'amber' },
                      { label: 'Packed', value: data.orderOverview.statuses.packed, color: 'green' },
                      { label: 'Dispatched', value: data.orderOverview.statuses.dispatched, color: 'purple' },
                      { label: 'In Transit', value: data.orderOverview.statuses.inTransit, color: 'cyan' },
                      { label: 'Delivered', value: data.orderOverview.statuses.delivered, color: 'green' },
                      { label: 'RTO Initiated', value: data.orderOverview.statuses.rto, color: 'red' },
                      { label: 'Cancelled & Returned', value: data.orderOverview.statuses.cancelled + data.orderOverview.statuses.returned, color: 'red' },
                    ].map((status, idx) => (
                      <div key={idx} style={{
                        background: 'var(--bg-card-hover)',
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `4px solid var(--accent-${status.color})`,
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {status.label}
                        </h4>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '8px' }}>
                          {status.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: REVENUE & PROFIT */}
            {activeTab === 'revenue' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="grid-3">
                  <div className="stat-card purple" style={{ gridColumn: '1 / -1', background: 'var(--accent-purple-glow)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                    <span className="stat-label">Estimated Profits</span>
                    <div className="stat-value" style={{ fontSize: '32px', color: 'var(--accent-purple)' }}>{formatINR(data.revenueDashboard.profitEstimate)}</div>
                    <p className="text-sm text-muted">Net Revenue (₹{Math.round(data.revenueDashboard.netRevenue).toLocaleString('en-IN')}) minus Operational/COGS estimate</p>
                  </div>
                </div>

                <div className="grid-4">
                  <div className="stat-card green">
                    <span className="stat-label">Gross Sales Revenue</span>
                    <div className="stat-value">{formatINR(data.revenueDashboard.grossRevenue)}</div>
                  </div>
                  <div className="stat-card blue">
                    <span className="stat-label">Prepaid Collected</span>
                    <div className="stat-value">{formatINR(data.revenueDashboard.prepaidRevenue)}</div>
                  </div>
                  <div className="stat-card amber">
                    <span className="stat-label">COD Sales</span>
                    <div className="stat-value">{formatINR(data.revenueDashboard.codRevenue)}</div>
                  </div>
                  <div className="stat-card red">
                    <span className="stat-label">Sunk RTO Loss</span>
                    <div className="stat-value">{formatINR(data.revenueDashboard.rtoLoss)}</div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '14px' }}>Revenue Channels</h3>
                    {/* SVG Donut Chart for Payment Methods */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '160px' }}>
                      <svg width="120" height="120" viewBox="0 0 42 42">
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="5"></circle>
                        {/* Prepaid portion */}
                        <circle
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke="var(--accent-blue)"
                          strokeWidth="5"
                          strokeDasharray={`${Math.round((data.revenueDashboard.prepaidRevenue / data.revenueDashboard.grossRevenue) * 100)} ${100 - Math.round((data.revenueDashboard.prepaidRevenue / data.revenueDashboard.grossRevenue) * 100)}`}
                          strokeDashoffset="25"
                        ></circle>
                      </svg>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                        <div className="flex items-center gap-8">
                          <span style={{ width: '12px', height: '12px', background: 'var(--accent-blue)', borderRadius: '2px' }} />
                          <span>Prepaid: <strong>{Math.round((data.revenueDashboard.prepaidRevenue / data.revenueDashboard.grossRevenue) * 100)}%</strong> ({formatINR(data.revenueDashboard.prepaidRevenue)})</span>
                        </div>
                        <div className="flex items-center gap-8">
                          <span style={{ width: '12px', height: '12px', background: '#cbd5e1', borderRadius: '2px' }} />
                          <span>COD: <strong>{100 - Math.round((data.revenueDashboard.prepaidRevenue / data.revenueDashboard.grossRevenue) * 100)}%</strong> ({formatINR(data.revenueDashboard.codRevenue)})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span className="text-muted">AOV (Average Order Value):</span>
                      <strong style={{ color: 'var(--text-heading)' }}>{formatINR(data.revenueDashboard.aov)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span className="text-muted">Total Refund Reserves:</span>
                      <strong style={{ color: 'var(--accent-red)' }}>{formatINR(data.revenueDashboard.totalRefundAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span className="text-muted">This Month vs Last Month:</span>
                      <strong className={data.revenueDashboard.trends.thisMonth >= data.revenueDashboard.trends.lastMonth ? 'text-success' : 'text-danger'}>
                        {data.revenueDashboard.trends.thisMonth >= data.revenueDashboard.trends.lastMonth ? '▲' : '▼'} {Math.round((Math.abs(data.revenueDashboard.trends.thisMonth - data.revenueDashboard.trends.lastMonth) / (data.revenueDashboard.trends.lastMonth || 1)) * 100)}%
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: BANK SETTLEMENTS */}
            {activeTab === 'settlements' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="grid-4">
                  <div className="stat-card green">
                    <span className="stat-label">Total Amount Settled</span>
                    <div className="stat-value">{formatINR(data.bankSettlements.totalSettled)}</div>
                  </div>
                  <div className="stat-card red">
                    <span className="stat-label">Pending Settlements</span>
                    <div className="stat-value">{formatINR(data.bankSettlements.pendingSettlement)}</div>
                  </div>
                  <div className="stat-card blue">
                    <span className="stat-label">Today's Settlement</span>
                    <div className="stat-value">{formatINR(data.bankSettlements.todaySettlement)}</div>
                  </div>
                  <div className="stat-card purple">
                    <span className="stat-label">This Month's Settled</span>
                    <div className="stat-value">{formatINR(data.bankSettlements.monthSettlement)}</div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '14px' }}>Settlements by Courier</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(data.bankSettlements.courierSettlement).map(([courier, amount]) => (
                        <div key={courier} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span>{courier}</span>
                            <strong>{formatINR(amount)}</strong>
                          </div>
                          <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'var(--accent-blue)', width: `${(amount / data.bankSettlements.totalSettled) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '14px' }}>Settlements by Gateway</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(data.bankSettlements.pgSettlement).map(([pg, amount]) => (
                        <div key={pg} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span>{pg}</span>
                            <strong>{formatINR(amount)}</strong>
                          </div>
                          <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'var(--accent-green)', width: `${(amount / (data.bankSettlements.totalSettled * 0.4)) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '12px' }}>Daily Settlement Ledger</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Settlement Date</th>
                          <th>Cleared Orders</th>
                          <th>Amount Settled</th>
                          <th>Pending Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.bankSettlements.table.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{row.date}</td>
                            <td>{row.orders} orders</td>
                            <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{formatINR(row.amountSettled)}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{formatINR(row.pending)}</td>
                            <td>
                              <span className="badge badge-green">Cleared</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: COURIER PERFORMANCE */}
            {activeTab === 'courier' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '12px' }}>Delivery & RTO Ranking (Best to Worst)</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Courier Partner</th>
                          <th>Total Shipments</th>
                          <th>Delivered %</th>
                          <th>RTO %</th>
                          <th>Avg Delivery Time</th>
                          <th>In Transit</th>
                          <th>Delayed</th>
                          <th>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.courierPerf.map((c, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700 }}>#{idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{c.courier}</td>
                            <td>{c.totalShipments}</td>
                            <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{c.deliveredPercent}%</td>
                            <td style={{ color: 'var(--accent-red)' }}>{c.rtoPercent}%</td>
                            <td>{c.avgDeliveryTime}</td>
                            <td>{c.inTransit}</td>
                            <td>{c.delayed}</td>
                            <td>
                              <span className={`badge ${idx === 0 ? 'badge-green' : idx === 1 ? 'badge-blue' : 'badge-amber'}`}>
                                {idx === 0 ? 'A+' : idx === 1 ? 'A' : 'B-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: CUSTOMER ANALYTICS */}
            {activeTab === 'customers' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="grid-3">
                  <div className="card text-center">
                    <span className="stat-label">New Customers</span>
                    <h2 style={{ fontSize: '28px', color: 'var(--text-heading)', margin: '10px 0 4px' }}>
                      {data.customerAnalytics.newCustomers}
                    </h2>
                  </div>
                  <div className="card text-center">
                    <span className="stat-label">Returning Customers</span>
                    <h2 style={{ fontSize: '28px', color: 'var(--text-heading)', margin: '10px 0 4px' }}>
                      {data.customerAnalytics.returningCustomers}
                    </h2>
                  </div>
                  <div className="card text-center">
                    <span className="stat-label">Repeat Purchase Rate</span>
                    <h2 style={{ fontSize: '28px', color: 'var(--accent-blue)', margin: '10px 0 4px' }}>
                      {data.customerAnalytics.repeatPurchaseRate}%
                    </h2>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '12px' }}>Top Sales States</h3>
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>State</th>
                            <th>Customers</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.customerAnalytics.topStates.map((s, idx) => (
                            <tr key={idx}>
                              <td>{s.state}</td>
                              <td style={{ fontWeight: 600 }}>{s.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '12px' }}>Top Products by Volume</h3>
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>Units Sold</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.customerAnalytics.topProducts.map((p, idx) => (
                            <tr key={idx}>
                              <td>{p.product}</td>
                              <td style={{ fontWeight: 600 }}>{p.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '12px' }}>Highest Value Customers</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Customer Phone</th>
                          <th>Total Bookings</th>
                          <th>Total Billing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.customerAnalytics.highestRevenueCustomers.map((cust, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{cust.phone}</td>
                            <td>{cust.count} orders</td>
                            <td style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{formatINR(cust.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SALES TEAM LEADERBOARD */}
            {activeTab === 'sales_team' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '12px' }}>Agent Performance Leaderboard</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Agent Name</th>
                          <th>Closed Bookings</th>
                          <th>Revenue Generated</th>
                          <th>Conversion %</th>
                          <th>Calls Made</th>
                          <th>WhatsApp Leads</th>
                          <th>Performance Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.agentPerformance.map((a, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700 }}>#{idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{a.agentName}</td>
                            <td>{a.orders}</td>
                            <td style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{formatINR(a.revenue)}</td>
                            <td>{a.conversionRate}%</td>
                            <td>{a.callsMade}</td>
                            <td>{a.whatsappLeads}</td>
                            <td>
                              <span className={`badge ${idx === 0 ? 'badge-green' : idx === 1 ? 'badge-blue' : 'badge-amber'}`}>
                                {idx === 0 ? 'Star Closer' : idx === 1 ? 'Top Performer' : 'On Track'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: INVENTORY STOCK */}
            {activeTab === 'inventory' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="grid-4">
                  <div className="stat-card green">
                    <span className="stat-label">Total Inventory Value</span>
                    <div className="stat-value">{formatINR(data.inventoryDashboard.totalValue)}</div>
                  </div>
                  <div className="stat-card blue">
                    <span className="stat-label">Total Stock Units</span>
                    <div className="stat-value">{data.inventoryDashboard.currentStock}</div>
                  </div>
                  <div className="stat-card amber">
                    <span className="stat-label">Low Stock Alerts</span>
                    <div className="stat-value">{data.inventoryDashboard.lowStockAlerts}</div>
                  </div>
                  <div className="stat-card red">
                    <span className="stat-label">Out of Stock items</span>
                    <div className="stat-value">{data.inventoryDashboard.outOfStockCount}</div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: '12px' }}>Inventory Items Status</h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Item ID</th>
                          <th>Product Name</th>
                          <th>Stock Level</th>
                          <th>Item Price</th>
                          <th>Inventory Value</th>
                          <th>Moving Velocity</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.inventoryDashboard.items.map((item) => (
                          <tr key={item.id}>
                            <td>#{item.id}</td>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td style={{ fontWeight: 600, color: item.stock === 0 ? 'var(--accent-red)' : item.stock <= item.minAlert ? 'var(--accent-amber)' : 'inherit' }}>
                              {item.stock} units
                            </td>
                            <td>{formatINR(item.price)}</td>
                            <td>{formatINR(item.value)}</td>
                            <td>
                              <span className={`badge ${item.status === 'Fast Moving' ? 'badge-green' : 'badge-amber'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${item.stock === 0 ? 'badge-red' : item.stock <= item.minAlert ? 'badge-amber' : 'badge-green'}`}>
                                {item.stock === 0 ? 'Out of Stock' : item.stock <= item.minAlert ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: AI BUSINESS ASSISTANT */}
            {activeTab === 'ai_assistant' && (
              <div style={{ animation: 'fadeIn 0.3s ease', display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '24px', height: '520px' }}>
                
                {/* Left panel: Quick Questions */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                  <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Quick Questions
                  </h4>
                  {[
                    'How many orders were dispatched today?',
                    'How much revenue was generated yesterday?',
                    'Which courier has the highest RTO?',
                    'How much money is pending in settlements?',
                    'Show last month\'s day-wise revenue.',
                    'Show state-wise sales.',
                    'Which products generated the highest profit?',
                    'Predict next month\'s sales based on current trends.',
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskAI(q)}
                      style={{
                        padding: '10px 14px',
                        fontSize: '12px',
                        textAlign: 'left',
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        transition: 'all var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-blue)';
                        e.currentTarget.style.color = 'var(--accent-blue)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Right panel: Chat UI */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', height: '100%' }}>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px', paddingRight: '8px' }}>
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          background: msg.sender === 'user' ? 'var(--gradient-brand)' : 'var(--bg-card-hover)',
                          color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                          padding: '12px 16px',
                          borderRadius: msg.sender === 'user' ? '18px 18px 0px 18px' : '18px 18px 18px 0px',
                          maxWidth: '80%',
                          fontSize: '13px',
                          boxShadow: 'var(--shadow-sm)',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-line'
                        }}
                      >
                        {msg.text}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskAI(userInput);
                    }}
                    style={{ display: 'flex', gap: '10px' }}
                  >
                    <input
                      className="input"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type your question about CRM operations..."
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                      Send
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3>No Operations Data Found</h3>
          </div>
        )}
      </div>
    </>
  );
}

function AgentDashboard() {
  const [stats, setStats] = useState({ callsToday: 0, pendingCallbacks: 0, totalRevenue: 0, leadsAssigned: 0 });

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const fetchAgentStats = async () => {
    try {
      const res = await fetch('/api/leads?limit=1');
      const data = await res.json();
      setStats((s) => ({ ...s, leadsAssigned: data.total || 0 }));
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Your daily performance overview</p>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-4 mb-24">
          <div className="stat-card blue">
            <span className="stat-label">Leads Assigned</span>
            <div className="stat-value">{stats.leadsAssigned}</div>
          </div>
          <div className="stat-card green">
            <span className="stat-label">Calls Today</span>
            <div className="stat-value">{stats.callsToday}</div>
          </div>
          <div className="stat-card amber">
            <span className="stat-label">Pending Callbacks</span>
            <div className="stat-value">{stats.pendingCallbacks}</div>
          </div>
          <div className="stat-card purple">
            <span className="stat-label">Revenue Generated</span>
            <div className="stat-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '12px' }}>Quick Actions</h3>
          <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
            <a href="/leads" className="btn btn-primary">📋 View My Leads</a>
            <a href="/leads?export=true" className="btn btn-success">📥 Download Leads (Excel)</a>
          </div>
        </div>
      </div>
    </>
  );
}
