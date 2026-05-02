'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { AlertTriangle, Ban, Lock, ShieldAlert, Search, Filter, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { auth, fetchArray } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface FailedLogin {
  id: string;
  ipAddress: string | null;
  status: string;
  failureReason: string | null;
  attemptedAt: string;
  employeeId: string;
  userName: string;
}

interface Summary {
  total: number;
  today: number;
  blocked: number;
  locked: number;
}

const riskCfg: Record<string, { color: string; bg: string; dot: string }> = {
  Success:    { color: '#059669', bg: '#dcfce7', dot: '#10b981' },
  Failed:     { color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  Blocked:    { color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  Locked:     { color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  Monitoring: { color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6' },
};

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, padding: '14px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, fontFamily: "'Open Sans',sans-serif", boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: type === 'success' ? '#ecfdf5' : '#fef2f2', color: type === 'success' ? '#059669' : '#dc2626', border: `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
      {msg}
    </div>
  );
}

function FilterDropdown({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label ?? 'Select';

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: '160px' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 20,
          border: `1.5px solid ${open ? '#2db9a3' : '#e2e8f0'}`,
          fontSize: 13,
          fontWeight: 600,
          color: open ? '#2db9a3' : '#64748b',
          background: open ? '#f0fdf9' : '#fff',
          cursor: 'pointer',
          fontFamily: "'Open Sans',sans-serif",
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          transition: 'all 0.18s',
        }}
      >
        <Filter size={14} style={{ flexShrink: 0, color: open ? '#2db9a3' : '#94a3b8' }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{selectedLabel}</span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            color: open ? '#2db9a3' : '#94a3b8',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            zIndex: 300,
            overflow: 'hidden',
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 13,
                color: opt.value === value ? '#2db9a3' : '#1e293b',
                background: opt.value === value ? 'rgba(45,185,163,0.08)' : '#fff',
                fontWeight: opt.value === value ? 700 : 500,
                fontFamily: "'Open Sans',sans-serif",
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'block',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = opt.value === value ? 'rgba(45,185,163,0.12)' : '#f8fafc';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = opt.value === value ? 'rgba(45,185,163,0.08)' : '#fff';
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FailedLoginsPage() {
  const router = useRouter();
  const [activeMenu,   setActiveMenu]   = useState('failed-logins');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [logs,         setLogs]         = useState<FailedLogin[]>([]);
  const [summary,      setSummary]      = useState<Summary>({ total: 0, today: 0, blocked: 0, locked: 0 });
  const [loading,      setLoading]      = useState(true);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsData, sumData] = await Promise.all([
        fetchArray(`${API}/security/failed-logins`),
        fetch(`${API}/security/failed-logins/summary`, { headers: { Authorization: `Bearer ${auth.getToken()}` } }).then(r => r.json()),
      ]);
      setLogs(logsData);
      setSummary(sumData);
    } catch { setToast({ msg: 'Failed to load data', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = logs.filter(l => {
    if (reasonFilter !== 'all' && (l.failureReason ?? 'None') !== reasonFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!l.employeeId.toLowerCase().includes(q) && !(l.ipAddress ?? '').includes(q) && !l.userName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Dynamically generate filter options from actual data
  const uniqueReasons = Array.from(new Set(logs.map(l => l.failureReason ?? 'None')))
    .filter(r => r !== null)
    .sort();
  const reasonOptions = [
    { value: 'all', label: 'All Reasons' },
    ...uniqueReasons.map(r => ({ value: r, label: r }))
  ];

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage   = Math.min(currentPage, totalPages);
  const paged      = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    // Ensure the string is parsed as UTC (append Z if missing)
    const utcString = iso.endsWith('Z') ? iso : iso + 'Z';
    const d = new Date(utcString);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    
    const timeStr = d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    if (isToday) return `Today ${timeStr}`;
    
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }) + ' ' + timeStr;
  };

  const stats = [
    { label: 'Total Failed',    value: summary.total,   accent: '#6366f1', iconBg: 'rgba(99,102,241,0.1)',  icon: <AlertTriangle size={20} /> },
    { label: 'Today',           value: summary.today,   accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)',  icon: <Lock size={20} />          },
    { label: 'Blocked IPs',     value: summary.blocked, accent: '#ef4444', iconBg: 'rgba(239,68,68,0.1)',   icon: <Ban size={20} />           },
    { label: 'Locked Accounts', value: summary.locked,  accent: '#dc2626', iconBg: 'rgba(220,38,38,0.1)',   icon: <ShieldAlert size={20} />   },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .fl-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .fl-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .fl-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .fl-scroll::-webkit-scrollbar{width:6px;}
        .fl-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;}
        .stat-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:18px 20px;}
        .stat-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
        .stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--icon-bg);color:var(--accent);}
        .stat-label{font-size:11.5px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;}
        .stat-value{font-size:28px;font-weight:600;color:#0f172a;letter-spacing:-0.03em;}
        .controls-bar{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
        .search-wrap{position:relative;flex:1;min-width:200px;max-width:340px;}
        .search-input{width:100%;padding:8px 14px 8px 38px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:13px;color:#1e293b;background:#fff;font-family:'Open Sans',sans-serif;outline:none;}
        .search-input:focus{border-color:#2db9a3;}
        .filter-select{padding:8px 12px 8px 32px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;color:#64748b;font-family:'Open Sans',sans-serif;cursor:pointer;outline:none;position:relative;}
        .filter-select:focus{border-color:#2db9a3;}
        .table-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.04);}
        .table-card-header{padding:16px 22px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9;}
        table{width:100%;border-collapse:collapse;}
        thead tr{background:#f8fafc;border-bottom:1.5px solid #f1f5f9;}
        thead th{padding:11px 16px;text-align:center;font-size:10.5px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;white-space:nowrap;}
        tbody tr{border-bottom:1px solid #f8fafc;transition:background 0.13s;}
        tbody tr:last-child{border-bottom:none;}
        tbody tr:hover{background:#fafbfd;}
        tbody td{padding:12px 16px;font-size:13px;color:#1e293b;font-weight:500;vertical-align:middle;text-align:center;}
        .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;}
        .badge-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
        .pagination-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 22px;border-top:1px solid #f1f5f9;}
        .pagination-info{font-size:13px;color:#94a3b8;}
        .pagination-info strong{color:#475569;font-weight:600;}
        .pagination-controls{display:flex;align-items:center;gap:10px;}
        .pg-btn{width:32px;height:32px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;color:#64748b;transition:all 0.15s;}
        .pg-btn:hover:not(:disabled){border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .pg-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .pg-counter{font-size:13px;color:#475569;font-weight:600;min-width:45px;text-align:center;}

      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="fl-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="fl-main">
          <TopBar title="Security Monitoring" />
          <div className="fl-scroll">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2db9a3', background: 'rgba(45,185,163,0.08)', padding: '4px 10px', borderRadius: 20, marginBottom: 8 }}>
                  
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', margin: '0 0 4px' }}>Failed Logins</h1>
                <p style={{ fontSize: 13, color: '#8a9ab0', margin: 0 }}>Track and investigate failed login attempts</p>
              </div>

            </div>

            <div className="stats-grid">
              {stats.map((s, i) => (
                <div key={i} className="stat-card" style={{ '--accent': s.accent, '--icon-bg': s.iconBg } as React.CSSProperties}>
                  <div className="stat-top">
                    <div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
                    <div className="stat-icon">{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="controls-bar">
              <div className="search-wrap">
                <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input className="search-input" placeholder="Search by ID, name or IP..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
              </div>
              <FilterDropdown
                options={reasonOptions}
                value={reasonFilter}
                onChange={val => { setReasonFilter(val); setCurrentPage(1); }}
              />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{filtered.length} records</span>
            </div>

            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Failed Login Log</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{filtered.length} records found</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 12px', borderRadius: 20 }}>{summary.today} today</span>
              </div>
              <table>
                <thead>
                  <tr><th>Date & Time</th><th>Emp ID</th><th>User</th><th>IP Address</th><th>Reason</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>Loading...</td></tr>
                  ) : paged.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>No failed logins found.</td></tr>
                  ) : paged.map(l => {
                    const rc = riskCfg[l.status] ?? riskCfg.Failed;
                    return (
                      <tr key={l.id}>
                        <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDate(l.attemptedAt)}</td>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{l.employeeId}</span></td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{l.userName}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{l.ipAddress ?? '—'}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{l.failureReason ?? '—'}</td>
                        <td>
                          <span className="badge" style={{ background: rc.bg, color: rc.color }}>
                            <span className="badge-dot" style={{ background: rc.dot }} />{l.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing <strong>{filtered.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}–{Math.min(safePage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong>
                </span>
                <div className="pagination-controls">
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={14} /></button>
                  <span className="pg-counter">{safePage} / {totalPages}</span>
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={14} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

