'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { Clock, Monitor, X, ChevronLeft, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

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
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${open ? '#2db9a3' : '#e2e8f0'}`, fontSize: 13.5, color: '#1e293b', background: open ? '#fff' : '#f8fafc', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 400, outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.18s' }}>
        <span>{selected?.label ?? 'Select'}</span>
        <ChevronDown size={15} style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden' }}>
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

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, padding: '14px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 500, fontFamily: "'DM Sans',sans-serif", boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: type === 'success' ? '#ecfdf5' : '#fef2f2', color: type === 'success' ? '#059669' : '#dc2626', border: `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
      {msg}
    </div>
  );
}

interface ActiveSession {
  id: string;
  userName: string;
  employeeId: string;
  role: string;
  ipAddress: string | null;
  deviceInfo: string | null;
  startedAt: string;
  expiresAt: string | null;
  status: string;
}

export default function SessionSettings() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]   = useState('session-settings');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Settings
  const [idleTimeout, setIdleTimeout]           = useState('15');
  const [maxSessionHours, setMaxSessionHours]   = useState('8');
  const [concurrentSessions, setConcurrentSessions] = useState('3');
  const [forceLogout, setForceLogout]           = useState(true);

  // Sessions
  const [sessions, setSessions]   = useState<ActiveSession[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = auth.getToken();
      const [settingsRes, sessionsRes] = await Promise.all([
        fetch(`${API}/sessions/settings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/sessions/active`,   { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const settings = await settingsRes.json();
      const sessData = await sessionsRes.json();

      setIdleTimeout(String(settings.idleTimeoutMinutes ?? 15));
      setMaxSessionHours(String(settings.maxSessionHours ?? 8));
      setConcurrentSessions(String(settings.maxConcurrentSessions ?? 3));
      setForceLogout(settings.forceLogoutOnNew ?? true);
      setSessions(sessData);
    } catch { setToast({ msg: 'Failed to load data', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/sessions/settings`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({
          idleTimeoutMinutes:    parseInt(idleTimeout),
          maxSessionHours:       parseInt(maxSessionHours),
          maxConcurrentSessions: parseInt(concurrentSessions),
          forceLogoutOnNew:      forceLogout,
        }),
      });
      const data = await res.json();
      if (data.success) setToast({ msg: 'Session settings saved', type: 'success' });
      else setToast({ msg: data.message || 'Save failed', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleTerminate = async (id: string) => {
    try {
      const res  = await fetch(`${API}/sessions/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setSessions(prev => prev.filter(s => s.id !== id));
        setToast({ msg: 'Session terminated', type: 'success' });
      } else setToast({ msg: data.message || 'Failed', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
  };

  const handleTerminateAll = async () => {
    try {
      const res  = await fetch(`${API}/sessions/terminate-all`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setSessions([]);
        setToast({ msg: data.message, type: 'success' });
      } else setToast({ msg: data.message || 'Failed', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
  };

  const totalPages = Math.max(1, Math.ceil(sessions.length / itemsPerPage));
  const safePage   = Math.min(currentPage, totalPages);
  const startIdx   = (safePage - 1) * itemsPerPage;
  const paged      = sessions.slice(startIdx, startIdx + itemsPerPage);

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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .ss-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'DM Sans',sans-serif;}
        .ss-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .ss-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .ss-scroll::-webkit-scrollbar{width:6px;}
        .ss-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .top-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px;margin-bottom:18px;}
        .card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.06);}
        .card-title{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:500;color:#0f172a;margin-bottom:20px;}
        .card-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(45,185,163,0.1);color:#2db9a3;flex-shrink:0;}
        .field-group{margin-bottom:16px;}
        .field-group:last-child{margin-bottom:0;}
        .field-label{font-size:12px;font-weight:500;color:#475569;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:7px;display:block;}
        .field-desc{font-size:12px;color:#94a3b8;margin-top:5px;}
        .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-top:1px solid #f1f5f9;margin-top:4px;}
        .toggle-info h3{font-size:13.5px;font-weight:500;color:#1e293b;margin-bottom:3px;}
        .toggle-info p{font-size:12px;color:#94a3b8;}
        .toggle{width:46px;height:26px;border-radius:13px;background:#e2e8f0;position:relative;cursor:pointer;transition:background 0.25s;flex-shrink:0;border:none;outline:none;}
        .toggle.on{background:#2db9a3;}
        .toggle-thumb{width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:left 0.25s;box-shadow:0 1px 4px rgba(0,0,0,0.18);}
        .toggle.on .toggle-thumb{left:23px;}
        .table-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;margin-bottom:24px;box-shadow:0 4px 20px rgba(0,0,0,0.04);}
        .table-card-header{padding:20px 28px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9;}
        table{width:100%;border-collapse:collapse;table-layout:fixed;}
        thead tr{background:#f8fafc;border-bottom:1.5px solid #f1f5f9;}
        thead th{padding:11px 20px;text-align:center;font-size:10.5px;font-weight:500;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;}
        thead th:nth-child(1){width:18%;text-align:center;}
        thead th:nth-child(2){width:11%;}
        thead th:nth-child(3){width:14%;}
        thead th:nth-child(4){width:17%;}
        thead th:nth-child(5){width:14%;}
        thead th:nth-child(6){width:14%;}
        thead th:nth-child(7){width:12%;}
        tbody tr{border-bottom:1px solid #f8fafc;transition:background 0.13s;}
        tbody tr:last-child{border-bottom:none;}
        tbody tr:hover{background:#fafbfd;}
        tbody td{padding:13px 20px;font-size:13px;color:#1e293b;font-weight:500;vertical-align:middle;text-align:center;}
        .terminate-btn{width:28px;height:28px;border-radius:8px;border:1.5px solid #fee2e2;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#ef4444;transition:all 0.15s;margin:0 auto;overflow:hidden;text-overflow:ellipsis;}
        .terminate-btn:hover{background:#fee2e2;}
        .terminate-all-btn{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;color:#ef4444;background:#fee2e2;border:1.5px solid #fecaca;border-radius:8px;padding:6px 14px;cursor:pointer;transition:all 0.18s;font-family:'DM Sans',sans-serif;}
        .terminate-all-btn:hover{background:#fecaca;}
        .pagination-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-top:1px solid #f1f5f9;background:#fafbfc;}
        .pagination-info{font-size:13px;color:#94a3b8;}
        .pagination-info strong{color:#475569;font-weight:600;}
        .pagination-controls{display:flex;align-items:center;gap:4px;}
        .pg-btn{width:34px;height:34px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;color:#64748b;transition:all 0.15s;}
        .pg-btn:hover:not(:disabled){border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .pg-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .pg-btn.active{background:#2db9a3;border-color:#2db9a3;color:#fff;}
        .pg-counter{min-width:50px;text-align:center;font-size:13px;color:#475569;font-weight:500;}
        .footer-actions{display:flex;justify-content:flex-end;gap:12px;}
        .btn-cancel{padding:11px 28px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;font-size:13.5px;font-weight:500;font-family:'DM Sans',sans-serif;}
        .btn-save{padding:11px 28px;border-radius:10px;border:none;background:#2db9a3;color:#fff;cursor:pointer;font-size:13.5px;font-weight:600;font-family:'DM Sans',sans-serif;box-shadow:0 2px 10px rgba(45,185,163,0.3);}
        .btn-save:disabled{opacity:0.6;cursor:not-allowed;}
        .btn-save:hover:not(:disabled){background:#28a593;}
        .refresh-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px;font-family:'DM Sans',sans-serif;color:#64748b;cursor:pointer;}
        .refresh-btn:hover{background:#f5f7fa;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="ss-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="ss-main">
          <TopBar title="Authentication" />
          <div className="ss-scroll">

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2db9a3', background: 'rgba(45,185,163,0.08)', padding: '4px 10px', borderRadius: 20, marginBottom: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2db9a3' }} />Authentication
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', margin: '0 0 4px' }}>Session Settings</h1>
                <p style={{ fontSize: 13, color: '#8a9ab0', margin: 0 }}>Configure session timeouts and manage active sessions</p>
              </div>
              <button className="refresh-btn" onClick={fetchAll}><RefreshCw size={13} /> Refresh</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading...</div>
            ) : (
              <>
                <div className="top-grid">
                  {/* Timeout Settings */}
                  <div className="card">
                    <div className="card-title"><div className="card-icon"><Clock size={16} /></div>Timeout Settings</div>
                    <div className="field-group">
                      <label className="field-label">Idle Timeout</label>
                      <CustomSelect
                        options={[{ value:'5', label:'5 minutes' }, { value:'10', label:'10 minutes' }, { value:'15', label:'15 minutes' }, { value:'30', label:'30 minutes' }, { value:'60', label:'60 minutes' }]}
                        value={idleTimeout} onChange={setIdleTimeout}
                      />
                      <p className="field-desc">Auto-logout users after this inactivity period</p>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Max Session Duration</label>
                      <CustomSelect
                        options={[{ value:'4', label:'4 hours' }, { value:'6', label:'6 hours' }, { value:'8', label:'8 hours' }, { value:'12', label:'12 hours' }, { value:'24', label:'24 hours' }]}
                        value={maxSessionHours} onChange={setMaxSessionHours}
                      />
                      <p className="field-desc">Force re-login after this duration regardless of activity</p>
                    </div>
                  </div>

                  {/* Session Policies */}
                  <div className="card">
                    <div className="card-title"><div className="card-icon"><Monitor size={16} /></div>Session Policies</div>
                    <div className="field-group">
                      <label className="field-label">Concurrent Sessions Allowed</label>
                      <CustomSelect
                        options={[{ value:'1', label:'1 session' }, { value:'2', label:'2 sessions' }, { value:'3', label:'3 sessions' }, { value:'5', label:'5 sessions' }, { value:'0', label:'Unlimited' }]}
                        value={concurrentSessions} onChange={setConcurrentSessions}
                      />
                      <p className="field-desc">Max simultaneous logins per user — enforced in Device Tracking</p>
                    </div>
                    <div className="toggle-row">
                      <div className="toggle-info">
                        <h3>Force Logout on New Session</h3>
                        <p>Terminate oldest session when limit is reached</p>
                      </div>
                      <button className={`toggle ${forceLogout ? 'on' : ''}`} onClick={() => setForceLogout(v => !v)}>
                        <div className="toggle-thumb" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Sessions Table */}
                <div className="table-card">
                  <div className="table-card-header">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Active Sessions</div>
                      <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>
                        {sessions.length} session{sessions.length !== 1 ? 's' : ''} currently active
                      </div>
                    </div>
                    <button className="terminate-all-btn" onClick={handleTerminateAll} disabled={sessions.length === 0}>
                      <X size={13} /> Terminate All
                    </button>
                  </div>
                  <table>
                    <thead>
                      <tr><th>User</th><th>Role</th><th>Device</th><th>IP Address</th><th>Started</th><th>Expires</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {sessions.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>No active sessions.</td></tr>
                      ) : paged.map(s => (
                        <tr key={s.id}>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.userName}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.employeeId}</div>
                          </td>
                          <td style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>{s.role}</td>
                          <td style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>{s.deviceInfo || '—'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b', textAlign: 'center' }}>{s.ipAddress || '—'}</td>
                          <td style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>{formatDate(s.startedAt)}</td>
                          <td style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>{s.expiresAt ? formatDate(s.expiresAt) : '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="terminate-btn" onClick={() => handleTerminate(s.id)} title="Terminate session">
                              <X size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="pagination-bar">
                    <span className="pagination-info">
                      Showing <strong>{sessions.length === 0 ? 0 : startIdx + 1}–{Math.min(startIdx + itemsPerPage, sessions.length)}</strong> of <strong>{sessions.length}</strong> sessions
                    </span>
                    <div className="pagination-controls">
                      <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={15} /></button>
                      <span className="pg-counter">{safePage} / {totalPages}</span>
                      <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={15} /></button>
                    </div>
                  </div>
                </div>

                <div className="footer-actions">
                  <button className="btn-cancel" onClick={fetchAll}>Reset</button>
                  <button className="btn-save" disabled={saving} onClick={handleSave}>
                    {saving ? 'Saving...' : 'Save Session Settings'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
