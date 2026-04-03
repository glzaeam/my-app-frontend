'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, AlertTriangle, Shield, Lock, TrendingUp, TrendingDown, Bell, User } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const loginTrend = [
  { day: 'Mon', success: 145, failed: 8 },
  { day: 'Tue', success: 132, failed: 12 },
  { day: 'Wed', success: 164, failed: 5 },
  { day: 'Thu', success: 155, failed: 18 },
  { day: 'Fri', success: 170, failed: 7 },
  { day: 'Sat', success: 42,  failed: 3 },
  { day: 'Sun', success: 28,  failed: 2 },
];

const roleDistribution = [
  { name: 'Bank Teller', value: 45, color: 'hsl(174, 83%, 32%)' },
  { name: 'Branch Mgr',  value: 12, color: 'hsl(174, 83%, 50%)' },
  { name: 'Auditor',     value: 8,  color: 'hsl(174, 83%, 65%)' },
  { name: 'Admin',       value: 3,  color: 'hsl(174, 83%, 80%)' },
];

const mfaAdoption = [
  { month: 'Aug', rate: 62 },
  { month: 'Sep', rate: 68 },
  { month: 'Oct', rate: 74 },
  { month: 'Nov', rate: 81 },
  { month: 'Dec', rate: 85 },
  { month: 'Jan', rate: 89 },
];

const moduleColorMap: Record<string, string> = {
  'Authentication':  '#f59e0b',
  'Audit Logs':      '#2db9a3',
  'Security':        '#ef4444',
  'Role Management': '#6366f1',
  'Users':           '#06b6d4',
  'Permissions':     '#8b5cf6',
};

export default function Dashboard() {
  const [activeMenu,   setActiveMenu]   = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [currentPage,  setCurrentPage]  = useState(1);
  const router = useRouter();
  const { user } = useAuth();
  const itemsPerPage = 5;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const metrics = [
    { label: 'Active Sessions',    value: '1,247', icon: Activity,      change: '+12%', trend: 'up'   },
    { label: 'Failed Logins Today',value: '23',    icon: AlertTriangle,  change: '-8%',  trend: 'down' },
    { label: 'MFA Enrolled',       value: '89%',   icon: Shield,         change: '+3%',  trend: 'up'   },
    { label: 'Locked Accounts',    value: '7',     icon: Lock,           change: '+2',   trend: 'up'   },
  ];

  const recentActivity = [
    { time: '2 min ago',  user: 'John Smith',    role: 'Bank Teller',    action: 'Login',           module: 'Authentication',  status: 'success' },
    { time: '5 min ago',  user: 'Emily Davis',   role: 'Auditor',        action: 'Export Report',   module: 'Audit Logs',      status: 'success' },
    { time: '8 min ago',  user: 'Unknown',        role: '—',              action: 'Failed Login',    module: 'Authentication',  status: 'failed'  },
    { time: '12 min ago', user: 'Michael Chen',  role: 'Branch Manager', action: 'View Logs',       module: 'Security',        status: 'success' },
    { time: '15 min ago', user: 'Sarah Johnson', role: 'System Admin',   action: 'Role Update',     module: 'Role Management', status: 'success' },
    { time: '20 min ago', user: 'Unknown',        role: '—',              action: 'Failed Login',    module: 'Authentication',  status: 'failed'  },
    { time: '25 min ago', user: 'James Wilson',  role: 'Bank Teller',    action: 'Password Change', module: 'Authentication',  status: 'warning' },
  ];

  const totalPages  = Math.ceil(recentActivity.length / itemsPerPage);
  const paged       = recentActivity.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusCfg: Record<string, { color: string; bg: string; dot: string }> = {
    success: { color: '#059669', bg: '#ecfdf5', dot: '#10b981' },
    failed:  { color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
    warning: { color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .db-root, .db-root * { font-family: 'Open Sans', sans-serif; }

        .db-root    { display: flex; height: 100vh; background: #ffffff; overflow: hidden; }
        .db-content { flex: 1; display: flex; flex-direction: column; overflow: visible; background: #ffffff; position: relative; }

        /* ── Topbar ── */
        /* Moved to TopBar component */

        /* ── Scroll area ── */
        .main-scroll { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .main-scroll::-webkit-scrollbar { width: 6px; }
        .main-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        /* ── Greeting row ── */
        .greeting-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; }
        .greeting-row h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.02em; }
        .greeting-row p  { font-size: 13px; color: #94a3b8; }
        .role-badge { font-size: 13px; font-weight: 600; color: #2db9a3; background: rgba(45,185,163,0.1); padding: 6px 14px; border-radius: 20px; }

        /* ── Metric cards ── */
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .metric-card { background: #fff; border: 1px solid #e8ecf2; border-radius: 14px; padding: 22px; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .metric-card:hover { border-color: #2db9a3; box-shadow: 0 4px 16px rgba(45,185,163,0.12); }
        .metric-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .metric-icon { width: 42px; height: 42px; border-radius: 10px; background: #f0fdf9; display: flex; align-items: center; justify-content: center; color: #2db9a3; }
        .metric-trend { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .metric-trend.up   { color: #059669; background: #ecfdf5; }
        .metric-trend.down { color: #dc2626; background: #fef2f2; }
        .metric-value { font-size: 30px; font-weight: 700; color: #0f172a; letter-spacing: -0.03em; margin-bottom: 4px; }
        .metric-label { font-size: 12.5px; color: #94a3b8; font-weight: 500; }

        /* ── Charts grid ── */
        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .chart-card { background: #fff; border: 1px solid #e8ecf2; border-radius: 14px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .chart-card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
        .chart-card-sub   { font-size: 12px; color: #94a3b8; margin-bottom: 16px; }
        .chart-legend { display: flex; gap: 16px; margin-bottom: 16px; font-size: 12px; color: #64748b; }
        .chart-legend-item { display: flex; align-items: center; gap: 6px; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .role-legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
        .role-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
        .role-dot { width: 7px; height: 7px; border-radius: 50%; }

        /* ── Recent activity section ── */
        .activity-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; margin-top: 8px; }
        .activity-header h2 { font-size: 17px; font-weight: 700; color: #0f172a; }
        .activity-header p  { font-size: 13px; color: #94a3b8; margin-top: 3px; }
        .count-badge { font-size: 12px; font-weight: 600; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 5px 14px; border-radius: 20px; }

        /* ── Table card ── */
        .table-card { background: #fff; border: 1px solid #e8ecf2; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }

        .al-table { width: 100%; border-collapse: collapse; }

        .al-table thead tr { background: #f8fafc; border-bottom: 1px solid #edf0f5; }
        .al-table thead th {
          padding: 14px 20px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #9aa5b4;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
          font-family: 'Open Sans', sans-serif;
        }

        .al-table tbody tr { border-bottom: 1px solid #f0f3f7; transition: background 0.12s; }
        .al-table tbody tr:last-child { border-bottom: none; }
        .al-table tbody tr:hover { background: #fafbfc; }
        .al-table tbody td {
          padding: 16px 20px;
          font-size: 13.5px;
          color: #1e293b;
          font-weight: 400;
          vertical-align: middle;
          text-align: center;
          font-family: 'Open Sans', sans-serif;
        }

        .time-mono    { font-family: 'Menlo','Monaco','Courier New',monospace; font-size: 12px; color: #94a3b8; }
        .td-user      { font-weight: 400; color: #0f172a; font-size: 13.5px; }
        .td-role      { font-size: 13px; color: #64748b; }
        .td-action    { font-size: 13.5px; color: #1e293b; font-weight: 400; }
        .td-module    { font-size: 13.5px; color: #1e293b; font-weight: 400; }

        .module-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 6px; white-space: nowrap; }
        .module-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 600; white-space: nowrap; text-transform: capitalize; }
        .status-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── Pagination ── */
        .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-top: 1px solid #f0f3f7; background: #fff; }
        .pagination-info { font-size: 13px; color: #94a3b8; font-family: 'Open Sans', sans-serif; }
        .pagination-info strong { color: #475569; font-weight: 700; }
        .pagination-controls { display: flex; align-items: center; gap: 6px; }
        .pg-arrow { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.15s; }
        .pg-arrow:hover:not(:disabled) { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .pg-arrow:disabled { opacity: 0.35; cursor: not-allowed; }
        .pg-num { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: #475569; font-family: 'Open Sans', sans-serif; transition: all 0.15s; }
        .pg-num:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .pg-num.active { background: #2db9a3; border-color: #2db9a3; color: #fff; font-weight: 700; box-shadow: 0 2px 8px rgba(45,185,163,0.35); }

        @media (max-width: 768px) {
          .main-scroll  { padding: 18px; }
          .charts-grid  { grid-template-columns: 1fr; }
          .metrics-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="db-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={() => router.push('/')}
        />

        <div className="db-content">
          <TopBar title="Dashboard" />
          
          {/* Scroll area */}
          <div className="main-scroll">

            {/* Greeting */}
            <div className="greeting-row">
              <div>
                <h1>{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
                <p>Here's what's happening with your IAM system today</p>
              </div>
              <span className="role-badge">{user?.role?.replace('_', ' ') || 'User'}</span>
            </div>

            {/* Metric Cards */}
            <div className="metrics-grid">
              {metrics.map((m, i) => (
                <div key={i} className="metric-card">
                  <div className="metric-card-top">
                    <div className="metric-icon"><m.icon size={22} /></div>
                    <span className={`metric-trend ${m.trend}`}>
                      {m.trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {m.change}
                    </span>
                  </div>
                  <div className="metric-value">{m.value}</div>
                  <div className="metric-label">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="charts-grid">
              {/* Login Activity */}
              <div className="chart-card">
                <div className="chart-card-title">Login Activity</div>
                <p className="chart-card-sub">Successful vs failed logins this week</p>
                <div className="chart-legend">
                  <div className="chart-legend-item">
                    <span className="legend-dot" style={{ background: 'hsl(174,83%,32%)' }} />Success
                  </div>
                  <div className="chart-legend-item">
                    <span className="legend-dot" style={{ background: 'hsl(0,84%,60%)' }} />Failed
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={loginTrend}>
                    <defs>
                      <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(174,83%,32%)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(174,83%,32%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(0,84%,60%)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf0f5" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Open Sans' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Open Sans' }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e8ecf2', fontSize: '12px', fontFamily: 'Open Sans' }} />
                    <Area type="monotone" dataKey="success" stroke="hsl(174,83%,32%)" strokeWidth={2} fill="url(#gSuccess)" />
                    <Area type="monotone" dataKey="failed"  stroke="hsl(0,84%,60%)"   strokeWidth={2} fill="url(#gFailed)"  />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* User Distribution */}
              <div className="chart-card">
                <div className="chart-card-title">User Distribution</div>
                <p className="chart-card-sub">By role assignment</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {roleDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e8ecf2', fontSize: '12px', fontFamily: 'Open Sans' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="role-legend">
                  {roleDistribution.map(r => (
                    <span key={r.name} className="role-legend-item">
                      <span className="role-dot" style={{ background: r.color }} />
                      {r.name} ({r.value})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* MFA Adoption */}
            <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', marginBottom: '28px' }}>
              <div className="chart-card">
                <div className="chart-card-title">MFA Adoption</div>
                <p className="chart-card-sub">6-month enrollment trend</p>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={mfaAdoption}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf0f5" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Open Sans' }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Open Sans' }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e8ecf2', fontSize: '12px', fontFamily: 'Open Sans' }} />
                    <Bar dataKey="rate" fill="hsl(174,83%,32%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="activity-header">
              <div>
                <h2>Recent Activity</h2>
                <p>Latest system events and user actions</p>
              </div>
              <span className="count-badge">{recentActivity.length} events</span>
            </div>

            <div className="table-card">
              <table className="al-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((a, i) => {
                    const s  = statusCfg[a.status] || statusCfg.success;
                    const mc = moduleColorMap[a.module] || '#94a3b8';
                    return (
                      <tr key={i}>
                        <td><span className="time-mono">{a.time}</span></td>
                        <td><span className="td-user">{a.user}</span></td>
                        <td><span className="td-role">{a.role}</span></td>
                        <td><span className="td-action">{a.action}</span></td>
                        <td><span className="td-module">{a.module}</span></td>
                        <td>
                          <span className="status-badge" style={{ background: s.bg, color: s.color }}>
                            <span className="status-dot" style={{ background: s.dot }} />
                            {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, recentActivity.length)}</strong> of <strong>{recentActivity.length}</strong> events
                </span>
                <div className="pagination-controls">
                  <button className="pg-arrow" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} className={`pg-num ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  ))}
                  <button className="pg-arrow" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    ›
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}