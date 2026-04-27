'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { Download, Filter, Search, ChevronLeft, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface AuditLog {
  id: string;
  action: string;
  module: string | null;
  details: string | null;
  status: string;
  ipAddress: string | null;
  createdAt: string;
  userName: string;
  userEmpId: string;
}

function CustomSelect({ options, value, onChange, withIcon }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  withIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: 180 }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 20, border: `1.5px solid ${open ? '#2db9a3' : '#e2e8f0'}`, fontSize: 13, color: open ? '#2db9a3' : '#64748b', background: open ? '#f0fdf9' : '#fff', cursor: 'pointer', fontFamily: "'Open Sans',sans-serif", fontWeight: 600, outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, transition: 'all 0.18s' }}>
        {withIcon && <Filter size={14} style={{ flexShrink: 0, color: open ? '#2db9a3' : '#94a3b8' }} />}
        <span style={{ flex: 1, textAlign: 'left' }}>{selected?.label ?? options[0]?.label}</span>
        <ChevronDown size={14} style={{ flexShrink: 0, color: open ? '#2db9a3' : '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden' }}>
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, color: opt.value === value ? '#2db9a3' : '#1e293b', background: opt.value === value ? 'rgba(45,185,163,0.08)' : '#fff', fontWeight: opt.value === value ? 700 : 500, fontFamily: "'Open Sans',sans-serif", border: 'none', cursor: 'pointer', textAlign: 'left', display: 'block' }}
              onMouseEnter={e => e.currentTarget.style.background = opt.value === value ? 'rgba(45,185,163,0.12)' : '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = opt.value === value ? 'rgba(45,185,163,0.08)' : '#fff'}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const statusCfg: Record<string, { color: string; bg: string; dot: string }> = {
  Success: { color: '#059669', bg: '#dcfce7', dot: '#10b981' },
  Failed:  { color: '#dc2626', bg: '#fecaca', dot: '#ef4444' },
  Warning: { color: '#d97706', bg: '#fed7aa', dot: '#f59e0b' },
};

const ITEMS_PER_PAGE = 10;

export default function ActivityLogs() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]     = useState('activity-logs');
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [logs, setLogs]                 = useState<AuditLog[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res  = await fetch(`${API}/audit?${params}`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const data = await res.json();
      setLogs(data);
    } catch {}
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { const interval = setInterval(() => fetchLogs(), 5000); return () => clearInterval(interval); }, [fetchLogs]);

  const modules = ['all', ...new Set(logs.map(l => l.module ?? '').filter(Boolean))];

  const filtered = logs.filter(l => {
    if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!l.userName.toLowerCase().includes(q) && !l.action.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const paged      = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        .al-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .al-content{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .main-content{flex:1;overflow-y:auto;padding:32px 36px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .main-content::-webkit-scrollbar{width:6px;}
        .main-content::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .page-header-row{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px;}
        .export-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:10px;border:none;background:#2db9a3;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:'Open Sans',sans-serif;}
        .controls-bar{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
        .search-wrap{position:relative;flex:1;min-width:200px;max-width:320px;}
        .search-input{width:100%;padding:10px 14px 10px 38px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:13px;color:#1e293b;background:#fff;font-family:'Open Sans',sans-serif;outline:none;}
        .search-input:focus{border-color:#2db9a3;}
        .table-card{background:#fff;border:1px solid #e8ecf2;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.05);}
        .table-card-header{padding:20px 28px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f0f3f7;}
        .al-table{width:100%;border-collapse:collapse;}
        .al-table thead tr{background:#f8fafc;border-bottom:1px solid #edf0f5;}
        .al-table thead th{padding:12px 16px;text-align:center;font-size:10.5px;font-weight:600;color:#9aa5b4;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;}
        .al-table tbody tr{border-bottom:1px solid #f0f3f7;transition:background 0.12s;}
        .al-table tbody tr:last-child{border-bottom:none;}
        .al-table tbody tr:hover{background:#fafbfc;}
        .al-table tbody td{padding:14px 16px;font-size:13px;color:#1e293b;vertical-align:middle;text-align:center;}
        .pagination-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-top:1px solid #f0f3f7;}
        .pagination-info{font-size:13px;color:#94a3b8;}
        .pagination-info strong{color:#475569;font-weight:500;}
        .pagination-controls{display:flex;align-items:center;gap:10px;}
        .pg-btn{width:34px;height:34px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;color:#475569;font-family:'Open Sans',sans-serif;transition:all 0.15s;}
        .pg-btn:hover:not(:disabled){border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .pg-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .pg-counter{font-size:13px;color:#475569;font-weight:500;min-width:45px;text-align:center;}
        .refresh-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid #e2e8f0;border-radius:9px;background:#fff;font-size:13px;font-family:'Open Sans',sans-serif;color:#64748b;cursor:pointer;}
        .refresh-btn:hover{background:#f5f7fa;}
      `}</style>

      <div className="al-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="al-content">
          <div className="main-content">
            <div className="page-header-row">
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Activity Logs</h1>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Track all system activity and changes</p>
              </div>

            </div>

            <div className="controls-bar">
              <div className="search-wrap">
                <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input className="search-input" placeholder="Search by user or action..." value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
              </div>
              <CustomSelect withIcon
                options={[{ value: 'all', label: 'All Status' }, { value: 'Success', label: 'Success' }, { value: 'Failed', label: 'Failed' }, { value: 'Warning', label: 'Warning' }]}
                value={statusFilter} onChange={v => { setStatusFilter(v); setCurrentPage(1); }} />
              <CustomSelect
                options={modules.map(m => ({ value: m, label: m === 'all' ? 'All Modules' : m }))}
                value={moduleFilter} onChange={v => { setModuleFilter(v); setCurrentPage(1); }} />
            </div>

            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Activity Logs</h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>{filtered.length} activities recorded</p>
                </div>
              </div>
              <table className="al-table">
                <thead>
                  <tr>{['User', 'Action', 'Module', 'IP Address', 'Date & Time', 'Status'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Loading...</td></tr>
                  ) : paged.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No logs found.</td></tr>
                  ) : paged.map(l => {
                    const cfg = statusCfg[l.status] ?? statusCfg.Warning;
                    return (
                      <tr key={l.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{l.userName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{l.userEmpId}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: '#334155' }}>{l.action}</td>
                        <td style={{ color: '#64748b' }}>{l.module ?? '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{l.ipAddress ?? '—'}</td>
                        <td style={{ color: '#94a3b8', fontSize: 12 }}>{formatDate(l.createdAt)}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing <strong>{filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}</strong> of <strong>{filtered.length}</strong>
                </span>
                <div className="pagination-controls">
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
                  <span className="pg-counter">{safePage} / {totalPages}</span>
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

