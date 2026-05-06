'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, AlertTriangle, Shield, Lock, TrendingUp, TrendingDown, Eye, FileText, Users } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { auth } from '@/lib/api';
import DashboardLayout from '@/app/components/DashboardLayout';

const API = process.env.NEXT_PUBLIC_API_URL;

const ROLE_COLORS = [
  'hsl(174,83%,32%)',
  'hsl(174,83%,50%)',
  'hsl(174,83%,65%)',
  'hsl(174,83%,80%)',
  'hsl(200,83%,50%)',
  'hsl(220,83%,60%)',
];

async function apiFetch(url: string, token: string | null) {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn(`[dashboard] ${res.status} ${url}`);
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })
  );
  const { user, loading } = useAuth();
  const itemsPerPage = 10;

  const [metrics, setMetrics] = useState([
    { label: 'Total Events',        value: '—', icon: Activity,      trend: 'up'   as const },
    { label: 'Failed Logins Today', value: '—', icon: AlertTriangle, trend: 'down' as const },
    { label: 'Success Today',       value: '—', icon: Shield,        trend: 'up'   as const },
    { label: 'Events Today',        value: '—', icon: Lock,          trend: 'up'   as const },
  ]);
  const [recentActivity,   setRecentActivity]   = useState<any[]>([]);
  const [loginTrend,       setLoginTrend]       = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [mfaAdoption,      setMfaAdoption]      = useState<any[]>([]);

  const [securityMetrics, setSecurityMetrics] = useState([
    { label: 'Live Alerts',         value: '—', icon: AlertTriangle, trend: 'down' as const },
    { label: 'Failed Logins Today', value: '—', icon: Lock,          trend: 'down' as const },
    { label: 'Suspicious Events',   value: '—', icon: Eye,           trend: 'down' as const },
    { label: 'Devices Tracked',     value: '—', icon: Shield,        trend: 'up'   as const },
  ]);
  const [failedLoginTrend,   setFailedLoginTrend]   = useState<any[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([]);

  const [auditorMetrics, setAuditorMetrics] = useState([
    { label: 'Total Log Entries', value: '—', icon: FileText,      trend: 'up'   as const },
    { label: 'Success Events',    value: '—', icon: Shield,        trend: 'up'   as const },
    { label: 'Failed Events',     value: '—', icon: AlertTriangle, trend: 'down' as const },
    { label: 'Events Today',      value: '—', icon: Activity,      trend: 'up'   as const },
  ]);
  const [auditLogs,      setAuditLogs]      = useState<any[]>([]);
  const [tellerActivity, setTellerActivity] = useState<any[]>([]);

  const formatTime = (iso: string) => {
    if (!iso) return '—';
    const utcString = iso.endsWith('Z') ? iso : iso + 'Z';
    return new Date(utcString).toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const extractItems = (data: any): any[] => {
    if (Array.isArray(data))               return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data))  return data.data;
    return [];
  };

  const fetchAdminDashboard = useCallback(async () => {
    try {
      const token = auth.getToken();

      const [summary, logsRaw, trend, roles, mfa] = await Promise.allSettled([
        apiFetch(`${API}/audit/summary`,                     token),
        apiFetch(`${API}/audit?page=1&pageSize=50`,          token),
        apiFetch(`${API}/audit/dashboard/login-trend`,       token),
        apiFetch(`${API}/audit/dashboard/role-distribution`, token),
        apiFetch(`${API}/audit/dashboard/mfa-adoption`,      token),
      ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

      if (!summary) return;

      setMetrics([
        { label: 'Total Events',        value: String(summary.total   ?? 0), icon: Activity,      trend: 'up'   as const },
        { label: 'Failed Logins Today', value: String(summary.failed  ?? 0), icon: AlertTriangle, trend: 'down' as const },
        { label: 'Success Today',       value: String(summary.success ?? 0), icon: Shield,        trend: 'up'   as const },
        { label: 'Events Today',        value: String(summary.today   ?? 0), icon: Lock,          trend: 'up'   as const },
      ]);

      if (Array.isArray(trend)) {
        setLoginTrend(trend.map((t: any) => ({
          day:     t.day     ?? t.Day     ?? '',
          success: t.success ?? t.Success ?? 0,
          failed:  t.failed  ?? t.Failed  ?? 0,
        })));
      }

      if (Array.isArray(roles)) {
        setRoleDistribution(
          roles.map((r: any, i: number) => ({
            name:  r.name  ?? r.Name  ?? `Role ${i + 1}`,
            value: r.value ?? r.Value ?? 0,
            color: ROLE_COLORS[i % ROLE_COLORS.length],
          }))
        );
      }

      if (Array.isArray(mfa)) {
        setMfaAdoption(mfa.map((m: any) => ({
          month: m.month ?? m.Month ?? '',
          rate:  m.rate  ?? m.Rate  ?? 0,
        })));
      }

      const logs = extractItems(logsRaw);
      const filtered = logs
        .filter((log: any) =>
          !log.action?.startsWith('GET ')    &&
          !log.action?.startsWith('POST ')   &&
          !log.action?.startsWith('PUT ')    &&
          !log.action?.startsWith('DELETE ') &&
          !log.action?.startsWith('PATCH ')
        )
        .slice(0, 10);

      setRecentActivity(filtered.map((l: any) => ({
        time:   formatTime(l.createdAt),
        user:   l.userName   ?? l.userEmail ?? '—',
        role:   l.userEmpId  ?? '—',
        action: l.action     ?? '—',
        module: l.module     ?? '—',
        status: l.status === 'Success' ? 'success' : l.status === 'Failed' ? 'failed' : 'warning',
      })));
    } catch (err) { console.error('Admin dashboard error:', err); }
  }, []);

  const fetchBranchManagerDashboard = useCallback(async () => {
    try {
      const token = auth.getToken();

      const [summary, trend, logsRaw] = await Promise.allSettled([
        apiFetch(`${API}/audit/summary`,               token),
        apiFetch(`${API}/audit/dashboard/login-trend`, token),
        apiFetch(`${API}/audit?page=1&pageSize=50`,    token),
      ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

      if (!summary) return;

      setSecurityMetrics([
        { label: 'Live Alerts',         value: String(summary.failed ?? 0), icon: AlertTriangle, trend: 'down' as const },
        { label: 'Failed Logins Today', value: String(summary.failed ?? 0), icon: Lock,          trend: 'down' as const },
        { label: 'Suspicious Events',   value: String(summary.today  ?? 0), icon: Eye,           trend: 'down' as const },
        { label: 'Total Events',        value: String(summary.total  ?? 0), icon: Shield,        trend: 'up'   as const },
      ]);

      if (Array.isArray(trend)) {
        setFailedLoginTrend(trend.map((t: any) => ({
          day:     t.day     ?? t.Day     ?? '',
          success: t.success ?? t.Success ?? 0,
          failed:  t.failed  ?? t.Failed  ?? 0,
        })));
      }

      const allLogs = extractItems(logsRaw);
      const suspicious = allLogs
        .filter((log: any) => log.status === 'Failed' || log.action?.toLowerCase().includes('fail'))
        .slice(0, 10);

      setSuspiciousActivity(suspicious.map((l: any) => ({
        time:   formatTime(l.createdAt),
        user:   l.userName  ?? '—',
        empId:  l.userEmpId ?? '—',
        action: l.action    ?? '—',
        status: l.status === 'Success' ? 'success' : l.status === 'Failed' ? 'failed' : 'warning',
      })));
    } catch (err) { console.error('Branch manager dashboard error:', err); }
  }, []);

  const fetchAuditorDashboard = useCallback(async () => {
    try {
      const token = auth.getToken();

      const [summary, logsRaw] = await Promise.allSettled([
        apiFetch(`${API}/audit/summary`,            token),
        apiFetch(`${API}/audit?page=1&pageSize=50`, token),
      ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

      if (!summary) return;

      setAuditorMetrics([
        { label: 'Total Log Entries', value: String(summary.total   ?? 0), icon: FileText,      trend: 'up'   as const },
        { label: 'Success Events',    value: String(summary.success ?? 0), icon: Shield,        trend: 'up'   as const },
        { label: 'Failed Events',     value: String(summary.failed  ?? 0), icon: AlertTriangle, trend: 'down' as const },
        { label: 'Events Today',      value: String(summary.today   ?? 0), icon: Activity,      trend: 'up'   as const },
      ]);

      const logs = extractItems(logsRaw);
      setAuditLogs(logs.slice(0, 10).map((l: any) => ({
        time:   formatTime(l.createdAt),
        user:   l.userName  ?? '—',
        empId:  l.userEmpId ?? '—',
        action: l.action    ?? '—',
        module: l.module    ?? '—',
        status: l.status === 'Success' ? 'success' : l.status === 'Failed' ? 'failed' : 'warning',
      })));
    } catch (err) { console.error('Auditor dashboard error:', err); }
  }, []);

  const fetchTellerDashboard = useCallback(async () => {
    try {
      const token = auth.getToken();
      const data  = await apiFetch(`${API}/audit/my-activity?limit=20`, token);
      if (!data) return;
      const activities = Array.isArray(data.activities) ? data.activities : [];
      setTellerActivity(activities.slice(0, 10).map((l: any) => ({
        time:   formatTime(l.createdAt),
        action: l.action ?? '—',
        module: l.module ?? '—',
        status: l.status === 'Success' ? 'success' : l.status === 'Failed' ? 'failed' : 'warning',
      })));
    } catch (err) { console.error('Teller dashboard error:', err); }
  }, []);

  const fetchDashboard = useCallback(() => {
    if (!user || loading) return;
    if      (user.role === 'System Admin')   fetchAdminDashboard();
    else if (user.role === 'Branch Manager') fetchBranchManagerDashboard();
    else if (user.role === 'Auditor')        fetchAuditorDashboard();
    else                                     fetchTellerDashboard();
  }, [user, loading, fetchAdminDashboard, fetchBranchManagerDashboard, fetchAuditorDashboard, fetchTellerDashboard]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard();
      setCurrentTime(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  useEffect(() => {
    const timer = setInterval(() =>
      setCurrentTime(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }))
    , 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const totalPages = Math.max(1, Math.ceil(recentActivity.length / itemsPerPage));
  const paged      = recentActivity.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusCfg: Record<string, { color: string; bg: string; dot: string }> = {
    success: { color: '#059669', bg: '#ecfdf5', dot: '#10b981' },
    failed:  { color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
    warning: { color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  };

  const styles = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .main-scroll { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
    .main-scroll::-webkit-scrollbar { width: 6px; }
    .main-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
    .greeting-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .greeting-row h1 { font-size: 24px; font-weight: 600; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.02em; }
    .greeting-row p  { font-size: 13px; color: #94a3b8; }
    .role-badge { font-size: 13px; font-weight: 500; color: #2db9a3; background: rgba(45,185,163,0.1); padding: 6px 14px; border-radius: 20px; white-space: nowrap; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .metric-card { background: #fff; border: 1px solid #e8ecf2; border-radius: 14px; padding: 22px; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .metric-card:hover { border-color: #2db9a3; box-shadow: 0 4px 16px rgba(45,185,163,0.12); }
    .metric-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .metric-icon { width: 42px; height: 42px; border-radius: 10px; background: #f0fdf9; display: flex; align-items: center; justify-content: center; color: #2db9a3; }
    .metric-icon.alert { background: #fef2f2; color: #ef4444; }
    .metric-icon.info  { background: #eff6ff; color: #3b82f6; }
    .metric-trend { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 20px; }
    .metric-trend.up   { color: #059669; background: #ecfdf5; }
    .metric-trend.down { color: #dc2626; background: #fef2f2; }
    .metric-value { font-size: 30px; font-weight: 600; color: #0f172a; letter-spacing: -0.03em; margin-bottom: 4px; }
    .metric-label { font-size: 12.5px; color: #94a3b8; font-weight: 500; }
    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .chart-card { background: #fff; border: 1px solid #e8ecf2; border-radius: 14px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); min-width: 0; }
    .chart-card-title { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 3px; }
    .chart-card-sub   { font-size: 12px; color: #94a3b8; margin-bottom: 16px; }
    .chart-legend { display: flex; gap: 16px; margin-bottom: 16px; font-size: 12px; color: #64748b; flex-wrap: wrap; }
    .chart-legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .role-legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
    .role-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
    .role-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .activity-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; margin-top: 8px; flex-wrap: wrap; gap: 8px; }
    .activity-header h2 { font-size: 17px; font-weight: 600; color: #0f172a; }
    .activity-header p  { font-size: 13px; color: #94a3b8; margin-top: 3px; }
    .count-badge { font-size: 12px; font-weight: 500; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 5px 14px; border-radius: 20px; white-space: nowrap; }
    .table-card { background: #fff; border: 1px solid #e8ecf2; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
    .table-scroll::-webkit-scrollbar { height: 5px; }
    .table-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
    .al-table { width: 100%; border-collapse: collapse; min-width: 600px; }
    .al-table thead tr { background: #f8fafc; border-bottom: 1px solid #edf0f5; }
    .al-table thead th { padding: 14px 20px; text-align: center; font-size: 11px; font-weight: 600; color: #9aa5b4; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }
    .al-table tbody tr { border-bottom: 1px solid #f0f3f7; transition: background 0.12s; }
    .al-table tbody tr:last-child { border-bottom: none; }
    .al-table tbody tr:hover { background: #fafbfc; }
    .al-table tbody td { padding: 16px 20px; font-size: 13.5px; color: #1e293b; vertical-align: middle; text-align: center; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 500; white-space: nowrap; text-transform: capitalize; }
    .status-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-top: 1px solid #f0f3f7; flex-wrap: wrap; gap: 10px; }
    .pagination-info { font-size: 13px; color: #94a3b8; }
    .pagination-info strong { color: #475569; font-weight: 600; }
    .pagination-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .pg-arrow { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.15s; }
    .pg-arrow:hover:not(:disabled) { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
    .pg-arrow:disabled { opacity: 0.35; cursor: not-allowed; }
    .pg-num { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: #475569; transition: all 0.15s; }
    .pg-num:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
    .pg-num.active { background: #2db9a3; border-color: #2db9a3; color: #fff; font-weight: 600; }
    .empty-chart { display: flex; align-items: center; justify-content: center; height: 220px; color: #94a3b8; font-size: 13px; flex-direction: column; gap: 8px; }
    .info-banner { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #1d4ed8; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .loading-wrap { display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; gap: 16px; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top: 3px solid #2db9a3; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 900px) {
      .charts-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .main-scroll { padding: 18px 16px; }
      .metrics-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
      .greeting-row h1 { font-size: 20px; }
      .al-table tbody td { padding: 12px 14px; font-size: 12px; }
      .al-table thead th { padding: 10px 12px; font-size: 10px; }
      .chart-card { padding: 18px; }
      .metric-card { padding: 16px; }
      .metric-value { font-size: 24px; }
    }
    @media (max-width: 480px) {
      .main-scroll { padding: 14px 12px; }
      .greeting-row h1 { font-size: 18px; }
      .metrics-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .metric-card { padding: 14px; }
      .metric-value { font-size: 22px; }
      .metric-label { font-size: 11px; }
      .chart-card-title { font-size: 14px; }
      .pagination-bar { padding: 12px 16px; justify-content: center; }
    }
  `;

  const renderGreeting = (subtitle: string) => (
    <div className="greeting-row">
      <div>
        <h1>{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>{currentTime}</span>
        <span className="role-badge">{user?.role || 'User'}</span>
      </div>
    </div>
  );

  const renderStatusBadge = (status: string) => {
    const s = statusCfg[status] || statusCfg.success;
    return (
      <span className="status-badge" style={{ background: s.bg, color: s.color }}>
        <span className="status-dot" style={{ background: s.dot }} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderAdminDashboard = () => (
    <>
      {renderGreeting("Here's what's happening with your IAM system today")}
      <div className="metrics-grid">
        {metrics.map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-card-top">
              <div className="metric-icon"><m.icon size={22} /></div>
              <span className={`metric-trend ${m.trend}`}>
                {m.trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              </span>
            </div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title">Login Activity</div>
          <p className="chart-card-sub">Successful vs failed logins — last 7 days</p>
          <div className="chart-legend">
            <div className="chart-legend-item"><span className="legend-dot" style={{ background: 'hsl(174,83%,32%)' }} />Success</div>
            <div className="chart-legend-item"><span className="legend-dot" style={{ background: 'hsl(0,84%,60%)' }} />Failed</div>
          </div>
          {loginTrend.length === 0 ? (
            <div className="empty-chart">
              <AlertTriangle size={24} style={{ opacity: 0.3 }} />
              No login data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={loginTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
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
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e8ecf2', fontSize: '12px' }} />
                <Area type="monotone" dataKey="success" stroke="hsl(174,83%,32%)" strokeWidth={2} fill="url(#gSuccess)" name="Success" />
                <Area type="monotone" dataKey="failed"  stroke="hsl(0,84%,60%)"   strokeWidth={2} fill="url(#gFailed)"  name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-title">User Distribution</div>
          <p className="chart-card-sub">Active users by role assignment</p>
          {roleDistribution.length === 0 ? (
            <div className="empty-chart">
              <Users size={24} style={{ opacity: 0.3 }} />
              No role data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {roleDistribution.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e8ecf2', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [value, name]}
                  />
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
            </>
          )}
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: 28 }}>
        <div className="chart-card">
          <div className="chart-card-title">MFA Adoption</div>
          <p className="chart-card-sub">6-month enrollment trend (%)</p>
          {mfaAdoption.length === 0 ? (
            <div className="empty-chart">
              <Shield size={24} style={{ opacity: 0.3 }} />
              No MFA data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={mfaAdoption} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#edf0f5" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(v: any) => [`${v}%`, 'MFA Rate']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e8ecf2', fontSize: '12px' }}
                />
                <Bar dataKey="rate" fill="hsl(174,83%,32%)" radius={[6, 6, 0, 0]} name="MFA Rate" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="activity-header">
        <div><h2>Recent Activity</h2><p>Latest system events and user actions</p></div>
        <span className="count-badge">{recentActivity.length} events</span>
      </div>
      <div className="table-card">
        <div className="table-scroll">
          <table className="al-table">
            <thead>
              <tr><th>Time</th><th>User</th><th>Emp ID</th><th>Action</th><th>Module</th><th>Status</th></tr>
            </thead>
            <tbody>
              {paged.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>No activity yet</td></tr>
                : paged.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{a.time}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{a.user}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{a.role}</td>
                      <td>{a.action}</td>
                      <td style={{ color: '#64748b' }}>{a.module}</td>
                      <td>{renderStatusBadge(a.status)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="pagination-bar">
          <span className="pagination-info">
            Showing <strong>{recentActivity.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, recentActivity.length)}</strong> of <strong>{recentActivity.length}</strong>
          </span>
          <div className="pagination-controls">
            <button className="pg-arrow" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} className={`pg-num ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
            ))}
            <button className="pg-arrow" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
          </div>
        </div>
      </div>
    </>
  );

  const renderBranchManagerDashboard = () => (
    <>
      {renderGreeting('Security overview — monitoring alerts, failed logins & suspicious activity')}
      <div className="metrics-grid">
        {securityMetrics.map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-card-top">
              <div className={`metric-icon ${i === 0 || i === 2 ? 'alert' : i === 3 ? 'info' : ''}`}>
                <m.icon size={22} />
              </div>
              <span className={`metric-trend ${m.trend}`}>
                {m.trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              </span>
            </div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title">Failed Login Trend</div>
          <p className="chart-card-sub">Failed vs successful logins — last 7 days</p>
          <div className="chart-legend">
            <div className="chart-legend-item"><span className="legend-dot" style={{ background: 'hsl(0,84%,60%)' }} />Failed</div>
            <div className="chart-legend-item"><span className="legend-dot" style={{ background: 'hsl(174,83%,32%)' }} />Success</div>
          </div>
          {failedLoginTrend.length === 0 ? (
            <div className="empty-chart">
              <AlertTriangle size={24} style={{ opacity: 0.3 }} />
              No login data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={failedLoginTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gFail2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(0,84%,60%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSuc2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(174,83%,32%)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(174,83%,32%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#edf0f5" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e8ecf2', fontSize: '12px' }} />
                <Area type="monotone" dataKey="failed"  stroke="hsl(0,84%,60%)"   strokeWidth={2} fill="url(#gFail2)" name="Failed" />
                <Area type="monotone" dataKey="success" stroke="hsl(174,83%,32%)" strokeWidth={2} fill="url(#gSuc2)"  name="Success" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="activity-header">
        <div><h2>Suspicious & Failed Activity</h2><p>Failed login attempts and flagged events</p></div>
        <span className="count-badge">{suspiciousActivity.length} events</span>
      </div>
      <div className="table-card">
        <div className="table-scroll">
          <table className="al-table">
            <thead><tr><th>Time</th><th>User</th><th>Emp ID</th><th>Action</th><th>Status</th></tr></thead>
            <tbody>
              {suspiciousActivity.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>No suspicious activity detected</td></tr>
                : suspiciousActivity.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{a.time}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{a.user}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{a.empId}</td>
                      <td>{a.action}</td>
                      <td>{renderStatusBadge(a.status)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderAuditorDashboard = () => (
    <>
      {renderGreeting('Audit overview — read-only view of all system activity logs')}
      <div className="info-banner">
        <Shield size={15} />
        Read-only access — tamper-proof log records. You cannot modify any entries.
      </div>
      <div className="metrics-grid">
        {auditorMetrics.map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-card-top">
              <div className={`metric-icon ${i === 2 ? 'alert' : ''}`}><m.icon size={22} /></div>
              <span className={`metric-trend ${m.trend}`}>
                {m.trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              </span>
            </div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="activity-header">
        <div><h2>All Activity Logs</h2><p>Complete tamper-proof system audit trail</p></div>
        <span className="count-badge">{auditLogs.length} records</span>
      </div>
      <div className="table-card">
        <div className="table-scroll">
          <table className="al-table">
            <thead><tr><th>Time</th><th>User</th><th>Emp ID</th><th>Action</th><th>Module</th><th>Status</th></tr></thead>
            <tbody>
              {auditLogs.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>No log entries yet</td></tr>
                : auditLogs.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{a.time}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{a.user}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{a.empId}</td>
                      <td>{a.action}</td>
                      <td style={{ color: '#64748b' }}>{a.module}</td>
                      <td>{renderStatusBadge(a.status)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderTellerDashboard = () => (
    <>
      {renderGreeting('Welcome — view your own recent activity and profile')}
      <div className="info-banner">
        <Users size={15} />
        You can only view your own activity logs. Contact your System Admin for access changes.
      </div>
      <div className="activity-header">
        <div><h2>My Activity</h2><p>Your personal session and login history</p></div>
        <span className="count-badge">{tellerActivity.length} records</span>
      </div>
      <div className="table-card">
        <div className="table-scroll">
          <table className="al-table">
            <thead><tr><th>Time</th><th>Action</th><th>Module</th><th>Status</th></tr></thead>
            <tbody>
              {tellerActivity.length === 0
                ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>No activity yet</td></tr>
                : tellerActivity.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{a.time}</td>
                      <td>{a.action}</td>
                      <td style={{ color: '#64748b' }}>{a.module}</td>
                      <td>{renderStatusBadge(a.status)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <DashboardLayout title="Dashboard" activeMenu="dashboard">
      <style>{styles}</style>
      <div className="main-scroll">
        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {user?.role === 'System Admin'   && renderAdminDashboard()}
            {user?.role === 'Branch Manager' && renderBranchManagerDashboard()}
            {user?.role === 'Auditor'        && renderAuditorDashboard()}
            {user?.role === 'Bank Teller'    && renderTellerDashboard()}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}