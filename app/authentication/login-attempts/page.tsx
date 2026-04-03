'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, CheckCircle, XCircle, Lock, Search, Activity, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function LoginAttempts() {
  const [activeMenu, setActiveMenu] = useState('login-attempts');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const itemsPerPage = 5;
  const router = useRouter();

  const activityData = [
    { date: 'Jan 15, 14:32', empId: 'ADM001', user: 'Sarah Johnson',  ip: '192.168.1.45',    location: 'HQ, New York',     device: 'Chrome / Windows',  status: 'success' },
    { date: 'Jan 15, 14:28', empId: 'MGR001', user: 'Michael Chen',   ip: '10.0.12.88',      location: 'Downtown Branch',  device: 'Safari / macOS',    status: 'success' },
    { date: 'Jan 15, 14:15', empId: 'Unknown',user: 'Unknown',        ip: '203.45.67.89',    location: 'Moscow, Russia',   device: 'Firefox / Linux',   status: 'failed'  },
    { date: 'Jan 15, 14:10', empId: 'AUD001', user: 'Emily Davis',    ip: '10.0.12.34',      location: 'HQ, New York',     device: 'Firefox / Windows', status: 'success' },
    { date: 'Jan 15, 13:55', empId: 'TEL001', user: 'James Wilson',   ip: '10.0.8.15',       location: 'Main St Branch',   device: 'Chrome / Windows',  status: 'success' },
    { date: 'Jan 15, 13:50', empId: 'Unknown',user: 'Unknown',        ip: '185.220.101.42',  location: 'Tor Exit Node',    device: 'Unknown',           status: 'blocked' },
    { date: 'Jan 15, 13:45', empId: 'EMP042', user: 'Robert Lee',     ip: '10.0.0.45',       location: 'East Branch',      device: 'Chrome / Windows',  status: 'failed'  },
    { date: 'Jan 15, 13:40', empId: 'EMP042', user: 'Robert Lee',     ip: '10.0.0.45',       location: 'East Branch',      device: 'Chrome / Windows',  status: 'failed'  },
  ];

  const filtered = activityData.filter(row => {
    const matchSearch = !searchQuery ||
      row.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.ip.includes(searchQuery);
    const matchStatus = statusFilter === 'all' || row.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleLogout = () => router.push('/');

  const stats = [
    { label: 'Total Attempts',   value: activityData.length,                                   accent: '#6366f1', iconBg: 'rgba(99,102,241,0.1)',   icon: <Activity size={20} />,     trend: null },
    { label: 'Successful',       value: activityData.filter(r => r.status === 'success').length, accent: '#2db9a3', iconBg: 'rgba(45,185,163,0.1)',  icon: <CheckCircle size={20} />,  trend: 'up' },
    { label: 'Failed',           value: activityData.filter(r => r.status === 'failed').length,  accent: '#ef4444', iconBg: 'rgba(239,68,68,0.1)',   icon: <XCircle size={20} />,      trend: 'down' },
    { label: 'Blocked / Locked', value: activityData.filter(r => r.status === 'blocked').length, accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)', icon: <Lock size={20} />,         trend: 'down' },
  ];

  const statusMap = {
    success: { label: 'Success', color: '#059669', bg: '#dcfce7', dot: '#10b981' },
    failed:  { label: 'Failed',  color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
    blocked: { label: 'Blocked', color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  };

  const deviceColorMap = (d: string) => {
    if (d.startsWith('Chrome'))  return { color: '#2db9a3', bg: 'rgba(45,185,163,0.1)' };
    if (d.startsWith('Safari'))  return { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
    if (d.startsWith('Firefox')) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { color: '#94a3b8', bg: '#f1f5f9' };
  };

  const locationFlag = (loc: string) => {
    if (loc.includes('Russia'))   return '🇷🇺';
    if (loc.includes('Tor'))      return '⚠️';
    if (loc.includes('HQ'))       return '🏢';
    if (loc.includes('Branch'))   return '🏦';
    return '📍';
  };

  const userInitials = (name: string) =>
    name === 'Unknown' ? '?' : name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .la-root { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Plus Jakarta Sans', sans-serif; }
        .la-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* Topbar */
        .topbar { height: 66px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .topbar-title { font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .notif-btn { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.18s; position: relative; }
        .notif-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .notif-dot { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; background: #ef4444; border-radius: 50%; border: 1.5px solid #fff; }
        .profile-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 40px; padding: 5px 14px 5px 5px; cursor: pointer; transition: all 0.18s; }
        .profile-pill:hover { border-color: #2db9a3; background: #f0fdf9; }
        .profile-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #2db9a3 0%, #6366f1 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; }
        .profile-name { font-size: 13px; font-weight: 600; color: #1e293b; }

        /* Scroll */
        .main-content { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        /* Header */
        .page-header { margin-bottom: 28px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.03em; }
        .page-header p { font-size: 14px; color: #94a3b8; font-weight: 400; }

        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; transition: all 0.2s; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); border-radius: 16px 16px 0 0; transform: scaleX(0); transform-origin: left; transition: transform 0.25s; }
        .stat-card:hover { border-color: var(--accent); box-shadow: 0 6px 24px rgba(0,0,0,0.06); transform: translateY(-2px); }
        .stat-card:hover::before { transform: scaleX(1); }
        .stat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--icon-bg); color: var(--accent); flex-shrink: 0; }
        .stat-label { font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
        .stat-value { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; line-height: 1; margin-bottom: 10px; }
        .stat-trend { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
        .stat-trend.up { color: #059669; background: #dcfce7; }
        .stat-trend.down { color: #dc2626; background: #fee2e2; }

        /* Controls */
        .controls-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .search-wrap { position: relative; flex: 1; min-width: 220px; max-width: 380px; }
        .search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .search-input { width: 100%; padding: 10px 14px 10px 40px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 13.5px; color: #1e293b; background: #fff; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; transition: all 0.18s; }
        .search-input::placeholder { color: #94a3b8; }
        .search-input:focus { border-color: #2db9a3; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        .filter-group { display: flex; align-items: center; gap: 8px; }
        .filter-select { padding: 10px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; font-size: 13px; font-weight: 600; color: #1e293b; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; outline: none; -webkit-appearance: none; appearance: none; padding-right: 32px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M1.41 3.41L6 8l4.59-4.59L12 4l-6 6-6-6z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }
        .filter-select:hover { border-color: #2db9a3; box-shadow: 0 0 0 3px rgba(45,185,163,0.06); }
        .filter-select:focus { border-color: #2db9a3; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }
        .filter-select option { color: #1e293b; background: #fff; padding: 8px; }

        /* Table */
        .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
        .table-card-header { padding: 18px 28px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; }
        .table-card-header h2 { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
        .table-card-header p { font-size: 12.5px; color: #94a3b8; margin-top: 2px; }
        .table-count { font-size: 12px; font-weight: 700; color: #2db9a3; background: rgba(45,185,163,0.1); padding: 4px 12px; border-radius: 20px; }

        .attempts-table { width: 100%; border-collapse: collapse; }
        .attempts-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #f1f5f9; }
        .attempts-table thead th { padding: 11px 16px; text-align: center; font-size: 10.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.09em; white-space: nowrap; }
        .attempts-table tbody tr { border-bottom: 1px solid #f8fafc; transition: background 0.13s; }
        .attempts-table tbody tr:last-child { border-bottom: none; }
        .attempts-table tbody tr:hover { background: #fafbfd; }
        .attempts-table tbody td { padding: 13px 16px; font-size: 13px; color: #1e293b; font-weight: 500; vertical-align: middle; text-align: center; }

        .user-cell { display: block; }
        .user-avatar { width: 30px; height: 30px; border-radius: 50%; display: none; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 800; flex-shrink: 0; }
        .user-avatar.known { background: linear-gradient(135deg, #e0f2fe, #bae6fd); color: #0369a1; border: 1.5px solid #bae6fd; }
        .user-avatar.unknown { background: #f1f5f9; color: #94a3b8; border: 1.5px solid #e2e8f0; }
        .user-name { font-weight: 400; color: #0f172a; font-size: 13px; }

        .emp-chip { font-family: 'Menlo','Monaco',monospace; font-size: 11.5px; font-weight: 400; color: #475569; background: transparent; padding: 0; border-radius: 0; border: none; }
        .ip-mono { font-family: 'Menlo','Monaco',monospace; font-size: 11.5px; font-weight: 600; color: #475569; }
        .location-text { font-size: 12.5px; color: #64748b; display: block; }
        .device-tag { display: block; font-size: 12px; font-weight: 400; padding: 0; border-radius: 0; white-space: nowrap; color: #475569; background: none; }
        .device-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; display: none; }
        .date-text { font-size: 12px; color: #94a3b8; font-weight: 400; white-space: nowrap; }

        .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap; }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        /* Pagination */
        .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-top: 1px solid #f1f5f9; background: #fafbfc; }
        .pagination-info { font-size: 13px; color: #94a3b8; font-weight: 500; }
        .pagination-info strong { color: #475569; font-weight: 700; }
        .pagination-controls { display: flex; align-items: center; gap: 4px; }
        .pg-btn { width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #64748b; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.15s; }
        .pg-btn:hover:not(:disabled) { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pg-btn.active { background: #2db9a3; border-color: #2db9a3; color: #fff; box-shadow: 0 2px 10px rgba(45,185,163,0.35); }

        .empty-state { padding: 48px 24px; text-align: center; color: #94a3b8; font-size: 14px; font-weight: 500; }

        @media (max-width: 768px) { .topbar { padding: 0 18px; } .main-content { padding: 18px; } .stats-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div className="la-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />

        <div className="la-content">
          <div className="topbar">
            <span className="topbar-title">Login Attempts</span>
            <div className="topbar-right">
              <button className="notif-btn"><Bell size={17} /><div className="notif-dot" /></button>
              <button onClick={() => router.push('/my-profile')} className="profile-pill" style={{ border: 'none' }}>
                <div className="profile-avatar">SJ</div>
                <span className="profile-name">Sarah Johnson</span>
              </button>
            </div>
          </div>

          <div className="main-content">
            <div className="page-header">
              <div className="eyebrow"><span className="eyebrow-dot" />Monitoring</div>
              <h1>Login Attempts</h1>
              <p>Monitor and manage login attempt history across all users and devices.</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div key={i} className="stat-card" style={{ '--accent': s.accent, '--icon-bg': s.iconBg } as React.CSSProperties}>
                  <div className="stat-card-accent-bar" />
                  <div className="stat-top">
                    <div>
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value">{s.value}</div>
                    </div>
                    <div className="stat-icon">{s.icon}</div>
                  </div>
                  {s.trend && (
                    <div className={`stat-trend ${s.trend}`}>
                      {s.trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {s.trend === 'up' ? 'vs yesterday' : 'vs yesterday'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="controls-bar">
              <div className="search-wrap">
                <Search size={15} className="search-icon" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by user, ID, or IP..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="filter-group">
                <Filter size={13} style={{ color: '#94a3b8' }} />
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <h2>Attempt Log</h2>
                  <p>{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</p>
                </div>
                <span className="table-count">{filtered.length} entries</span>
              </div>

              <table className="attempts-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Emp ID</th>
                    <th>User</th>
                    <th>IP Address</th>
                    <th>Location</th>
                    <th>Device</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty-state">No records match your search or filter.</div></td></tr>
                  ) : paginatedData.map((row, idx) => {
                    const s = statusMap[row.status as keyof typeof statusMap];
                    const dc = deviceColorMap(row.device);
                    const isUnknown = row.user === 'Unknown';
                    return (
                      <tr key={idx}>
                        <td><span className="date-text">{row.date}</span></td>
                        <td><span className="emp-chip">{row.empId}</span></td>
                        <td>
                          <span className="user-name">{row.user}</span>
                        </td>
                        <td><span className="ip-mono">{row.ip}</span></td>
                        <td>
                          <span className="location-text">
                            {row.location}
                          </span>
                        </td>
                        <td>
                          <span className="device-tag">
                            {row.device}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge" style={{ background: s.bg, color: s.color }}>
                            <span className="status-dot" style={{ background: s.dot }} />
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing <strong>{filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> records
                </span>
                <div className="pagination-controls">
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft size={15} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} className={`pg-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                  ))}
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}