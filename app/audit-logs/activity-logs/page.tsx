'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Download, Filter, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';

const logs = [
  { date:'Jan 15, 14:32', user:'Sarah Johnson',  role:'System Admin',   action:'Role Updated',           module:'Role Management', ip:'192.168.1.45',   status:'Monitoring' },
  { date:'Jan 15, 14:28', user:'Michael Chen',   role:'Branch Manager', action:'Viewed Logs',            module:'Audit Logs',      ip:'10.0.12.88',     status:'Monitoring' },
  { date:'Jan 15, 14:15', user:'Unknown',         role:'—',              action:'Failed Login (3x)',       module:'Authentication',  ip:'203.45.67.89',   status:'Blocked'  },
  { date:'Jan 15, 14:10', user:'Emily Davis',    role:'Auditor',        action:'Exported Report',         module:'Audit Logs',      ip:'10.0.12.34',     status:'Monitoring' },
  { date:'Jan 15, 13:55', user:'James Wilson',   role:'Bank Teller',    action:'Password Changed',        module:'Authentication',  ip:'10.0.8.15',      status:'Locked' },
  { date:'Jan 15, 13:45', user:'Sarah Johnson',  role:'System Admin',   action:'User Deactivated',        module:'Users',           ip:'192.168.1.45',   status:'Monitoring' },
  { date:'Jan 15, 13:30', user:'Unknown',         role:'—',              action:'Suspicious IP Detected',  module:'Security',        ip:'185.220.101.42', status:'Blocked'  },
  { date:'Jan 15, 13:20', user:'Michael Chen',   role:'Branch Manager', action:'MFA Enabled',             module:'Authentication',  ip:'10.0.12.88',     status:'Monitoring' },
];

const statusCfg: Record<string, { color: string; bg: string; dot: string }> = {
  Blocked:   { color: '#dc2626', bg: '#fecaca', dot: '#ef4444' },
  Locked:    { color: '#d97706', bg: '#fed7aa', dot: '#f59e0b' },
  Monitoring: { color: '#2563eb', bg: '#bfdbfe', dot: '#3b82f6' },
};

const moduleColorMap: Record<string, string> = {
  'Role Management': '#6366f1',
  'Audit Logs':      '#2db9a3',
  'Authentication':  '#f59e0b',
  'Users':           '#06b6d4',
  'Security':        '#ef4444',
  'Permissions':     '#8b5cf6',
};

export default function ActivityLogs() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [activeMenu,   setActiveMenu]   = useState('activity-logs');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const itemsPerPage = 5;
  const router = useRouter();

  const modules = [...new Set(logs.map(l => l.module))];

  const filtered = logs.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;
    if (searchTerm && !l.user.toLowerCase().includes(searchTerm.toLowerCase()) && !l.action.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paged      = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .al-root    { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Open Sans', sans-serif; }
        .al-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* ── Topbar ── */
        .topbar { height: 66px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .topbar-title { font-size: 16px; font-weight: 600; color: #0f172a; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .notif-btn { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.18s; position: relative; }
        .notif-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .notif-dot { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; background: #ef4444; border-radius: 50%; border: 1.5px solid #fff; }
        .profile-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 40px; padding: 5px 14px 5px 5px; cursor: pointer; transition: all 0.18s; }
        .profile-pill:hover { border-color: #2db9a3; background: #f0fdf9; }
        .profile-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #2db9a3, #6366f1); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; }
        .profile-name { font-size: 13px; font-weight: 500; color: #1e293b; }

        /* ── Main scroll area ── */
        .main-content { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        /* ── Page header ── */
        .page-header-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header-row h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.02em; }
        .page-header-row p  { font-size: 13px; color: #94a3b8; font-weight: 400; }
        .export-btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 10px; border: none; background: #2db9a3; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Open Sans', sans-serif; transition: all 0.18s; box-shadow: 0 2px 10px rgba(45,185,163,0.3); white-space: nowrap; }
        .export-btn:hover { background: #28a593; transform: translateY(-1px); }

        /* ── Controls bar ── */
        .controls-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }

        .search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
        .search-input { width: 100%; padding: 10px 14px 10px 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 13px; color: #1e293b; background: #fff; font-family: 'Open Sans', sans-serif; outline: none; transition: all 0.18s; }
        .search-input::placeholder { color: #94a3b8; }
        .search-input:focus { border-color: #2db9a3; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        /* Filter select wrapper — icon lives inside */
        .filter-wrap { position: relative; display: inline-flex; align-items: center; }
        .filter-icon { position: absolute; left: 12px; color: #94a3b8; pointer-events: none; display: flex; align-items: center; z-index: 1; }

        .field-select {
          padding: 10px 36px 10px 34px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 13px;
          color: #1e293b;
          background: #fff;
          cursor: pointer;
          font-family: 'Open Sans', sans-serif;
          font-weight: 500;
          outline: none;
          transition: all 0.18s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
        .field-select:focus { border-color: #2db9a3; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        /* Module select — no icon inside, normal left padding */
        .field-select.no-icon { padding-left: 14px; }

        /* ── Table card ── */
        .table-card { background: #fff; border: 1px solid #e8ecf2; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }

        .table-card-header { padding: 22px 28px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f3f7; }
        .table-card-header h2 { font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
        .table-card-header p  { font-size: 13px; color: #94a3b8; margin-top: 4px; font-weight: 400; }

        .terminate-all-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 10px; border: 1.5px solid #fecaca; background: #fff5f5; color: #ef4444; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Open Sans', sans-serif; transition: all 0.18s; white-space: nowrap; }
        .terminate-all-btn:hover { background: #fef2f2; border-color: #ef4444; }

        /* ── Table ── */
        .al-table { width: 100%; border-collapse: collapse; }
        .al-table thead tr { background: #f8fafc; border-bottom: 1px solid #edf0f5; }
        .al-table thead th { padding: 14px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #9aa5b4; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; font-family: 'Open Sans', sans-serif; }
        .al-table tbody tr { border-bottom: 1px solid #f0f3f7; transition: background 0.12s; }
        .al-table tbody tr:last-child { border-bottom: none; }
        .al-table tbody tr:hover { background: #fafbfc; }
        .al-table tbody td { padding: 16px 16px; font-size: 13px; color: #1e293b; font-weight: 400; vertical-align: middle; text-align: center; font-family: 'Open Sans', sans-serif; }

        .user-name       { font-weight: 400; color: #0f172a; font-size: 13px; }
        .role-text       { font-size: 13.5px; color: #64748b; font-weight: 400; }
        .action-text     { font-size: 13px; color: #1e293b; font-weight: 400; }
        .module-text     { font-size: 13px; color: #1e293b; font-weight: 400; }
        .date-text       { font-size: 13px; color: #94a3b8; font-weight: 400; }
        .device-text     { font-size: 13.5px; color: #374151; font-weight: 400; }
        .ip-mono         { font-family: 'Menlo','Monaco','Courier New',monospace; font-size: 13px; color: #374151; font-weight: 400; letter-spacing: 0.02em; }
        .started-text    { font-size: 13.5px; color: #2db9a3; font-weight: 500; }
        .last-active-text{ font-size: 13.5px; color: #374151; font-weight: 400; }

        .terminate-btn { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #fecaca; background: #fff; color: #ef4444; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .terminate-btn:hover { background: #fef2f2; border-color: #ef4444; }

        /* ── Pagination ── */
        .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; border-top: 1px solid #f0f3f7; background: #fff; }
        .pagination-info { font-size: 13px; color: #94a3b8; font-weight: 400; font-family: 'Open Sans', sans-serif; }
        .pagination-info strong { color: #475569; font-weight: 600; }
        .pagination-controls { display: flex; align-items: center; gap: 6px; }
        .pg-arrow { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.15s; }
        .pg-arrow:hover:not(:disabled) { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .pg-arrow:disabled { opacity: 0.35; cursor: not-allowed; }
        .pg-num { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: #475569; font-family: 'Open Sans', sans-serif; transition: all 0.15s; }
        .pg-num:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .pg-num.active { background: #2db9a3; border-color: #2db9a3; color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(45,185,163,0.35); }

        @media (max-width: 768px) {
          .topbar { padding: 0 18px; }
          .main-content { padding: 18px; }
        }
      `}</style>

      <div className="al-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={() => router.push('/')}
        />

        <div className="al-content">
          {/* Topbar */}
          <div className="topbar">
            <span className="topbar-title">Audit Logs</span>
            <div className="topbar-right">
              <button className="notif-btn">
                <Bell size={17} />
                <div className="notif-dot" />
              </button>
              <button onClick={() => router.push('/my-profile')} className="profile-pill" style={{ border: 'none' }}>
                <div className="profile-avatar">SJ</div>
                <span className="profile-name">Sarah Johnson</span>
              </button>
            </div>
          </div>

          {/* Main */}
          <div className="main-content">

            {/* Page Header */}
            <div className="page-header-row">
              <div>
                <div className="eyebrow"><span className="eyebrow-dot" />Audit Logs</div>
                <h1>Activity Logs</h1>
                <p>Track all system activity and changes</p>
              </div>
              <button className="export-btn">
                <Download size={15} />
                Export Logs
              </button>
            </div>

            {/* Controls */}
            <div className="controls-bar">
              {/* Search */}
              <div className="search-wrap">
                <Search
                  size={14}
                  style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}
                />
                <input
                  className="search-input"
                  placeholder="Search by user or action..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>

              {/* Status filter — filter icon inside */}
              <div className="filter-wrap">
                <span className="filter-icon"><Filter size={13} /></span>
                <select className="field-select" value={statusFilter} onChange={handleFilterChange(setStatusFilter)}>
                  <option value="all">All Status</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Locked">Locked</option>
                </select>
              </div>

              {/* Module filter — no icon */}
              <select className="field-select no-icon" value={moduleFilter} onChange={handleFilterChange(setModuleFilter)}>
                <option value="all">All Modules</option>
                {modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <h2>Activity Logs</h2>
                  <p>{filtered.length} activities recorded</p>
                </div>
              </div>

              <table className="al-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>IP Address</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((l, i) => {
                    const cfg = statusCfg[l.status] || { color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' };
                    return (
                    <tr key={i}>
                      <td><span className="user-name">{l.user}</span></td>
                      <td><span className="role-text">{l.role}</span></td>
                      <td><span className="action-text">{l.action}</span></td>
                      <td><span className="module-text">{l.module}</span></td>
                      <td><span className="ip-mono">{l.ip}</span></td>
                      <td><span className="date-text">{l.date}</span></td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: cfg.color,
                          backgroundColor: cfg.bg,
                          fontFamily: "'Open Sans', sans-serif",
                          whiteSpace: 'nowrap',
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: cfg.dot,
                            display: 'inline-block',
                            flexShrink: 0,
                          }} />
                          {l.status}
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
                  Showing <strong>{filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> activities
                </span>
                <div className="pagination-controls">
                  <button
                    className="pg-arrow"
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`pg-num ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="pg-arrow"
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight size={15} />
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