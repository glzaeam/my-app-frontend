'use client';
// ── TransactionTrail ──────────────────────────────────────────────
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Search, Filter, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const transactions = [
  { id:'TXN-001', date:'Jan 15, 14:32', user:'Sarah Johnson', empId:'ADM001',  role:'System Admin',   action:'Role Updated',            target:'Branch Manager → System Admin for EMP029', module:'Role Management', ip:'192.168.1.45', status:'completed'        },
  { id:'TXN-002', date:'Jan 15, 14:28', user:'Sarah Johnson', empId:'ADM001',  role:'System Admin',   action:'User Deactivated',         target:'EMP042 — Robert Lee',                       module:'Users',           ip:'192.168.1.45', status:'completed'        },
  { id:'TXN-003', date:'Jan 15, 14:15', user:'Michael Chen', empId:'MGR001',   role:'Branch Manager', action:'Password Reset Approved',  target:'TEL003 — Mark Brown',                       module:'Authentication',  ip:'10.0.12.88',   status:'completed'        },
  { id:'TXN-004', date:'Jan 15, 14:10', user:'Emily Davis',  empId:'AUD001',   role:'Auditor',        action:'Report Exported',          target:'Audit Logs — Jan 2024',                     module:'Audit Logs',      ip:'10.0.12.34',   status:'completed'        },
  { id:'TXN-005', date:'Jan 15, 13:55', user:'Sarah Johnson', empId:'ADM001',  role:'System Admin',   action:'Permission Updated',       target:'Auditor role — removed Edit access',        module:'Permissions',     ip:'192.168.1.45', status:'completed'        },
  { id:'TXN-006', date:'Jan 15, 13:45', user:'Sarah Johnson', empId:'ADM001',  role:'System Admin',   action:'MFA Policy Changed',       target:'Branch Manager — MFA now required',         module:'Authentication',  ip:'192.168.1.45', status:'completed'        },
  { id:'TXN-007', date:'Jan 15, 13:30', user:'Sarah Johnson', empId:'ADM001',  role:'System Admin',   action:'IP Blocked',               target:'185.220.101.42 — Tor Exit Node',            module:'Security',        ip:'192.168.1.45', status:'completed'        },
  { id:'TXN-008', date:'Jan 15, 13:20', user:'Sarah Johnson', empId:'ADM001',  role:'System Admin',   action:'New User Created',         target:'TEL005 — Nina Patel',                       module:'Users',           ip:'192.168.1.45', status:'pending_approval' },
];

const moduleColorMap: Record<string, string> = {
  'Role Management': '#6366f1',
  'Audit Logs':      '#2db9a3',
  'Authentication':  '#f59e0b',
  'Users':           '#06b6d4',
  'Security':        '#ef4444',
  'Permissions':     '#8b5cf6',
};

const statusCfg: Record<string, { color: string; bg: string; dot: string }> = {
  completed:        { color: '#059669', bg: '#dcfce7', dot: '#10b981' },
  pending_approval: { color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
};

const userInitials = (n: string) => n.split(' ').map(x => x[0]).join('').slice(0, 2);

export function TransactionTrailPage() {
  const [moduleFilter, setModuleFilter] = useState('all');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [activeMenu,   setActiveMenu]   = useState('transaction-trail');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  const modules = [...new Set(transactions.map(t => t.module))];

  const filtered = transactions.filter(t => {
    if (moduleFilter !== 'all' && t.module !== moduleFilter) return false;
    return searchTerm === '' ||
      t.id.includes(searchTerm.toUpperCase()) ||
      t.user.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paged      = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .tt-root, .tt-root * { font-family: 'Open Sans', sans-serif; }

        .tt-root    { display: flex; height: 100vh; background: #ffffff; overflow: hidden; }
        .tt-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

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

        /* ── Main scroll ── */
        .main-content { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        /* ── Page header ── */
        .page-header-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header-row h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.02em; }
        .page-header-row p  { font-size: 13px; color: #94a3b8; }
        .tx-count-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 8px 16px; border-radius: 20px; }

        /* ── Controls ── */
        .controls-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
        .search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
        .search-input { width: 100%; padding: 10px 14px 10px 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 13px; color: #1e293b; background: #fff; font-family: 'Open Sans', sans-serif; outline: none; transition: all 0.18s; }
        .search-input::placeholder { color: #94a3b8; }
        .search-input:focus { border-color: #2db9a3; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        /* Filter select with icon inside */
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

        /* ── Table card ── */
        .table-card { background: #fff; border: 1px solid #e8ecf2; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }

        .table-card-header { padding: 22px 28px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f3f7; }
        .table-card-header h2 { font-size: 17px; font-weight: 700; color: #0f172a; }
        .table-card-header p  { font-size: 13px; color: #94a3b8; margin-top: 4px; }
        .count-badge { font-size: 12px; font-weight: 600; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 5px 14px; border-radius: 20px; }

        /* ── Table ── */
        .tt-table { width: 100%; border-collapse: collapse; }

        .tt-table thead tr { background: #f8fafc; border-bottom: 1px solid #edf0f5; }
        .tt-table thead th {
          padding: 14px 16px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #9aa5b4;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
          font-family: 'Open Sans', sans-serif;
        }

        .tt-table tbody tr { border-bottom: 1px solid #f0f3f7; transition: background 0.12s; }
        .tt-table tbody tr:last-child { border-bottom: none; }
        .tt-table tbody tr:hover { background: #fafbfc; }
        .tt-table tbody td {
          padding: 16px 16px;
          font-size: 13px;
          color: #1e293b;
          font-weight: 400;
          vertical-align: middle;
          text-align: center;
          font-family: 'Open Sans', sans-serif;
        }

        /* Cell styles */
        .txn-id     { font-family: 'Open Sans', sans-serif; font-size: 12px; font-weight: 400; color: #2db9a3; }
        .date-text  { font-size: 12.5px; color: #94a3b8; font-weight: 400; white-space: nowrap; }
        .emp-id-text { font-family: 'Open Sans', sans-serif; font-size: 13px; font-weight: 400; color: #0f172a; letter-spacing: 0.02em; }
        .user-cell  { display: flex; align-items: center; gap: 9px; text-align: left; }
        .u-avatar   { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #e0f2fe, #bae6fd); color: #0369a1; border: 1.5px solid #bae6fd; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
        .user-name-sm { font-size: 13px; font-weight: 600; color: #0f172a; }
        .user-role-sm { font-size: 11.5px; color: #94a3b8; font-weight: 400; margin-top: 1px; }
        .action-text  { font-weight: 600; color: #334155; font-size: 13px; }
        .target-text  { font-size: 12px; color: #94a3b8; font-weight: 400; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }
        .module-text  { font-size: 13px; color: #1e293b; font-weight: 500; }
        .module-tag   { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 6px; white-space: nowrap; }
        .module-dot   { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .ip-mono      { font-family: 'Menlo','Monaco',monospace; font-size: 12px; color: #64748b; font-weight: 400; letter-spacing: 0.02em; }
        .badge        { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
        .badge-dot    { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── Pagination ── */
        .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; border-top: 1px solid #f0f3f7; background: #fff; }
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
          .topbar { padding: 0 18px; }
          .main-content { padding: 18px; }
        }
      `}</style>

      <div className="tt-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={() => router.push('/')}
        />

        <div className="tt-content">
          {/* Topbar */}
          <div className="topbar">
            <span className="topbar-title">Audit Logs</span>
            <div className="topbar-right">
              <button className="notif-btn"><Bell size={17} /><div className="notif-dot" /></button>
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
                <h1>Transaction Trail</h1>
                <p>Complete audit trail for all system transactions</p>
              </div>
              <div className="tx-count-badge"><FileText size={14} />{transactions.length} transactions</div>
            </div>

            {/* Controls */}
            <div className="controls-bar">
              <div className="search-wrap">
                <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  className="search-input"
                  placeholder="Search by ID or user..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>

              {/* Module filter — icon inside */}
              <div className="filter-wrap">
                <span className="filter-icon"><Filter size={13} /></span>
                <select className="field-select" value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">All Modules</option>
                  {modules.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <h2>Transaction Log</h2>
                  <p>{filtered.length} records found</p>
                </div>
                <span className="count-badge">{transactions.length} total</span>
              </div>

              <table className="tt-table">
                <thead>
                  <tr>
                    <th>TXN ID</th>
                    <th>Date</th>
                    <th>EMP ID</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Module</th>
                    <th>IP</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(t => {
                    const sc = statusCfg[t.status]  || statusCfg.completed;
                    return (
                      <tr key={t.id}>
                        <td><span className="txn-id">{t.id}</span></td>
                        <td><span className="date-text">{t.date}</span></td>
                        <td><span className="emp-id-text">{t.empId}</span></td>
                        <td><span className="user-name-sm">{t.user}</span></td>
                        <td><span className="action-text">{t.action}</span></td>
                        <td><span className="target-text" title={t.target}>{t.target}</span></td>
                        <td><span className="module-text">{t.module}</span></td>
                        <td><span className="ip-mono">{t.ip}</span></td>
                        <td>
                          <span className="badge" style={{ background: sc.bg, color: sc.color }}>
                            <span className="badge-dot" style={{ background: sc.dot }} />
                            {t.status === 'completed' ? 'Completed' : 'Pending'}
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
                  Showing <strong>{filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> records
                </span>
                <div className="pagination-controls">
                  <button className="pg-arrow" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} className={`pg-num ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  ))}
                  <button className="pg-arrow" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
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

export default TransactionTrailPage;