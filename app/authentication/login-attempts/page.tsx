'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import {
  CheckCircle, XCircle, Lock, Search, Activity,
  ChevronLeft, ChevronRight, Filter, ChevronDown,
  Shield, AlertTriangle,
} from 'lucide-react';
import { auth, fetchArray } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface LoginAttempt {
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
  failed: number;
  blocked: number;
  todayCount: number;
  blockedIps: number;
}

interface BlockedIp {
  ipAddress: string;
  failureCount: number;
  lastAttempt: string;
}

function CustomSelect({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
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
    <div ref={ref} style={{ position: 'relative', minWidth: 150 }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{ width: '100%', padding: '9px 14px', borderRadius: 20, border: `1.5px solid ${open ? '#2db9a3' : '#e2e8f0'}`, fontSize: 13, color: open ? '#2db9a3' : '#64748b', background: open ? '#f0fdf9' : '#fff', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 500, outline: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Filter size={13} style={{ flexShrink: 0, color: open ? '#2db9a3' : '#94a3b8' }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{selected?.label ?? 'All'}</span>
        <ChevronDown size={13} style={{ color: open ? '#2db9a3' : '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden' }}>
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, color: opt.value === value ? '#2db9a3' : '#1e293b', background: opt.value === value ? 'rgba(45,185,163,0.08)' : '#fff', fontWeight: opt.value === value ? 600 : 400, fontFamily: "'DM Sans',sans-serif", border: 'none', cursor: 'pointer', textAlign: 'left', display: 'block' }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const statusMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  Failed:  { label: 'Failed',  color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  Blocked: { label: 'Blocked', color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  Success: { label: 'Success', color: '#059669', bg: '#dcfce7', dot: '#10b981' },
};

export default function LoginAttempts() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]     = useState('login-attempts');
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [logs, setLogs]                 = useState<LoginAttempt[]>([]);
  const [summary, setSummary]           = useState<Summary | null>(null);
  const [blockedIps, setBlockedIps]     = useState<BlockedIp[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const [showBlockedIps, setShowBlockedIps] = useState(false);
  const itemsPerPage = 10;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [logsData, summaryRes, ipsData] = await Promise.all([
        fetchArray(`${API}/security/failed-logins`),
        fetch(`${API}/login-attempts/summary`, { headers: { Authorization: `Bearer ${auth.getToken()}` } }),
        fetchArray(`${API}/login-attempts/blocked-ips`),
      ]);
      const summaryData = await summaryRes.json();

      setLogs(logsData);
      setSummary(summaryData);
      setBlockedIps(ipsData);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = logs.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!l.userName.toLowerCase().includes(q) &&
          !l.employeeId.toLowerCase().includes(q) &&
          !(l.ipAddress ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

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
    { label: 'Total Attempts', value: summary?.total      ?? logs.length, accent: '#6366f1', iconBg: 'rgba(99,102,241,0.1)',  icon: <Activity size={20} />    },
    { label: 'Failed',         value: summary?.failed     ?? 0,           accent: '#ef4444', iconBg: 'rgba(239,68,68,0.1)',   icon: <XCircle size={20} />     },
    { label: 'Blocked',        value: summary?.blocked    ?? 0,           accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)',  icon: <Lock size={20} />        },
    { label: 'Today',          value: summary?.todayCount ?? 0,           accent: '#1D9E75', iconBg: 'rgba(45,185,163,0.15)',  icon: <CheckCircle size={20} /> },
    { label: 'Blocked IPs',    value: summary?.blockedIps ?? 0,           accent: '#dc2626', iconBg: 'rgba(220,38,38,0.1)',   icon: <Shield size={20} />      },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .la-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:var(--font-dm-sans, 'DM Sans', sans-serif);}
        .la-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .la-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .la-scroll::-webkit-scrollbar{width:6px;}
        .la-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px;}
        .stat-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:16px 18px;cursor:default;transition:box-shadow 0.15s;}
        .stat-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.08);}
        .stat-card.clickable{cursor:pointer;}
        .stat-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;}
        .stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
        .stat-label{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px;}
        .stat-value{font-size:26px;font-weight:600;color:#0f172a;letter-spacing:-0.03em;}
        .controls-bar{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
        .search-wrap{position:relative;flex:1;min-width:200px;max-width:320px;}
        .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none;}
        .search-input{width:100%;padding:9px 14px 9px 36px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:13px;color:#1e293b;background:#fff;font-family:var(--font-dm-sans, 'DM Sans', sans-serif);outline:none;}
        .search-input:focus{border-color:#2db9a3;}
        .table-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.04);margin-bottom:18px;}
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
        .pagination-controls{display:flex;align-items:center;gap:4px;}
        .pg-btn{width:32px;height:32px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;color:#64748b;transition:all 0.15s;}
        .pg-btn:hover:not(:disabled){border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .pg-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .pg-btn.active{background:#2db9a3;border-color:#2db9a3;color:#fff;}
        .pg-counter{min-width:50px;text-align:center;font-size:13px;color:#475569;font-weight:500;}
        .la-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px;font-family:var(--font-dm-sans, 'DM Sans', sans-serif);color:#64748b;cursor:pointer;}

        .ip-table{width:100%;border-collapse:collapse;}
        .ip-table th{padding:10px 16px;text-align:left;font-size:10.5px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;background:#f8fafc;border-bottom:1.5px solid #f1f5f9;}
        .ip-table td{padding:11px 16px;font-size:13px;color:#1e293b;border-bottom:1px solid #f8fafc;}
        .ip-table tr:last-child td{border-bottom:none;}
        .ip-table tr:hover td{background:#fafbfd;}
      `}</style>

      <div className="la-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="la-main">
          <TopBar title="Authentication" />
          <div className="la-scroll">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', margin: '0 0 4px' }}>Login Attempts</h1>
                <p style={{ fontSize: 13, color: '#8a9ab0', margin: 0 }}>Monitor login attempt history — failures trigger audit logs and security alerts</p>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div key={i} className={`stat-card${i === 4 ? ' clickable' : ''}`}
                  onClick={i === 4 ? () => setShowBlockedIps(v => !v) : undefined}
                  title={i === 4 ? 'Click to view blocked IPs' : undefined}>
                  <div className="stat-top">
                    <div>
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value">{s.value}</div>
                    </div>
                    <div className="stat-icon" style={{ background: s.iconBg, color: s.accent }}>{s.icon}</div>
                  </div>
                  {i === 4 && s.value > 0 && (
                    <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>
                      {showBlockedIps ? '▲ Hide details' : '▼ View IPs'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Blocked IPs panel */}
            {showBlockedIps && blockedIps.length > 0 && (
              <div className="table-card" style={{ marginBottom: 18 }}>
                <div className="table-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={15} color="#dc2626" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Blocked IPs (last 24h)</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>IPs with 5+ failed attempts — fed to Security Monitoring</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '4px 12px', borderRadius: 20 }}>{blockedIps.length} IPs</span>
                </div>
                <table className="ip-table">
                  <thead>
                    <tr><th>IP Address</th><th>Failed Attempts</th><th>Last Attempt</th><th>Risk</th></tr>
                  </thead>
                  <tbody>
                    {blockedIps.map((ip, i) => (
                      <tr key={i}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: 6 }}>{ip.ipAddress}</span></td>
                        <td style={{ fontWeight: 700, color: '#1e293b' }}>{ip.failureCount}</td>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(ip.lastAttempt)}</td>
                        <td>
                          <span className="badge" style={{ background: ip.failureCount >= 10 ? '#fee2e2' : '#fef3c7', color: ip.failureCount >= 10 ? '#dc2626' : '#d97706' }}>
                            <span className="badge-dot" style={{ background: ip.failureCount >= 10 ? '#ef4444' : '#f59e0b' }} />
                            {ip.failureCount >= 10 ? 'Critical' : 'High'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Controls */}
            <div className="controls-bar">
              <div className="search-wrap">
                <Search size={14} className="search-icon" />
                <input className="search-input" placeholder="Search by user, ID, or IP..."
                  value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
              </div>
              <CustomSelect
                options={[
                  { value: 'all',     label: 'All Statuses' },
                  { value: 'Failed',  label: 'Failed'       },
                  { value: 'Blocked', label: 'Blocked'      },
                  { value: 'Success', label: 'Success'      },
                ]}
                value={statusFilter}
                onChange={v => { setStatusFilter(v); setCurrentPage(1); }}
              />
              <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 'auto' }}>{filtered.length} records</span>
            </div>

            {/* Attempts Table */}
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Attempt Log</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Each failure is written to Audit Logs — threshold breach triggers Security Alert</div>
                </div>
              </div>
              <table>
                <thead>
                  <tr><th>Date &amp; Time</th><th>Emp ID</th><th>User</th><th>IP Address</th><th>Reason</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>Loading...</td></tr>
                  ) : paged.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>No records found.</td></tr>
                  ) : paged.map(l => {
                    const s = statusMap[l.status] ?? { label: l.status, color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' };
                    return (
                      <tr key={l.id}>
                        <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDate(l.attemptedAt)}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>
                            {l.employeeId}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{l.userName}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{l.ipAddress ?? '—'}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{l.failureReason ?? '—'}</td>
                        <td>
                          <span className="badge" style={{ background: s.bg, color: s.color }}>
                            <span className="badge-dot" style={{ background: s.dot }} />{s.label}
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
