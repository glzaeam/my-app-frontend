'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { Smartphone, Monitor, Tablet, Search, Shield, Activity, AlertTriangle, Filter, XCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Device {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  ipAddress: string | null;
  location: string | null;
  isTrusted: boolean;
  lastUsed: string;
  status: string;
  userName: string;
  employeeId: string;
}

const statusCfg: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  active:     { color: '#059669', bg: '#dcfce7', dot: '#10b981', label: 'Active'     },
  inactive:   { color: '#d97706', bg: '#fef3c7', dot: '#f59e0b', label: 'Inactive'   },
  suspicious: { color: '#dc2626', bg: '#fee2e2', dot: '#ef4444', label: 'Suspicious' },
  revoked:    { color: '#94a3b8', bg: '#f1f5f9', dot: '#cbd5e1', label: 'Revoked'    },
};

const browserColor: Record<string, { color: string; bg: string }> = {
  Chrome:  { color: '#2db9a3', bg: 'rgba(45,185,163,0.1)'  },
  Safari:  { color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
  Firefox: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  Edge:    { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'   },
};

const getBrowserStyle = (browser: string | null) => {
  if (!browser) return { color: '#94a3b8', bg: '#f1f5f9' };
  const key = Object.keys(browserColor).find(k => browser.startsWith(k));
  return key ? browserColor[key] : { color: '#94a3b8', bg: '#f1f5f9' };
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

export default function DeviceTracking() {
  const router = useRouter();
  const [activeMenu,  setActiveMenu]  = useState('device-tracking');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [devices,     setDevices]     = useState<Device[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [revoking,    setRevoking]    = useState<string | null>(null);
  const [trusting,    setTrusting]    = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/security/devices`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const data = await res.json();
      setDevices(data);
    } catch { setToast({ msg: 'Failed to load devices', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      const res  = await fetch(`${API}/security/devices/${id}/revoke`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      const data = await res.json();
      if (data.success) { setToast({ msg: 'Device revoked', type: 'success' }); fetchDevices(); }
      else setToast({ msg: data.message || 'Failed', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setRevoking(null); }
  };

  const handleTrust = async (id: string) => {
    setTrusting(id);
    try {
      const res  = await fetch(`${API}/security/devices/${id}/trust`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDevices(prev => prev.map(d =>
          d.id === id ? { ...d, isTrusted: true, status: 'active' } : d
        ));
        setToast({ msg: 'Device marked as trusted', type: 'success' });
      } else {
        setToast({ msg: data.message || 'Failed', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Server error', type: 'error' });
    } finally {
      setTrusting(null);
    }
  };

  const filtered = devices.filter(d => {
    if (typeFilter !== 'all' && (d.deviceType ?? '').toLowerCase() !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!d.userName.toLowerCase().includes(q) && !d.employeeId.toLowerCase().includes(q)) return false;
    }
    return true;
  });

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
    { label: 'Total Devices', value: devices.length,                                     accent: '#6366f1', iconBg: 'rgba(99,102,241,0.1)',  icon: <Monitor size={20} />      },
    { label: 'Active Now',    value: devices.filter(d => d.status === 'active').length,   accent: '#1D9E75', iconBg: 'rgba(45,185,163,0.15)',  icon: <Activity size={20} />     },
    { label: 'Trusted',       value: devices.filter(d => d.isTrusted).length,             accent: '#059669', iconBg: 'rgba(5,150,105,0.1)',   icon: <Shield size={20} />       },
    { label: 'Suspicious',    value: devices.filter(d => d.status === 'suspicious').length, accent: '#ef4444', iconBg: 'rgba(239,68,68,0.1)', icon: <AlertTriangle size={20} /> },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .dt-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .dt-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .dt-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .dt-scroll::-webkit-scrollbar{width:6px;}
        .dt-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;}
        .stat-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:18px 20px;}
        .stat-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
        .stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--icon-bg);color:var(--accent);}
        .stat-label{font-size:11.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;}
        .stat-value{font-size:28px;font-weight:600;color:#0f172a;letter-spacing:-0.03em;}
        .controls-bar{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
        .search-wrap{position:relative;flex:1;min-width:200px;max-width:340px;}
        .search-input{width:100%;padding:8px 14px 8px 38px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:13px;color:#1e293b;background:#fff;font-family:'Open Sans',sans-serif;outline:none;}
        .search-input:focus{border-color:#2db9a3;}
        .filter-select{padding:8px 12px 8px 32px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;color:#64748b;font-family:'Open Sans',sans-serif;cursor:pointer;outline:none;position:relative;}
        .filter-select:focus{border-color:#2db9a3;}
        .devices-list{display:flex;flex-direction:column;gap:12px;}
        .device-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:18px 22px;display:flex;align-items:center;gap:16px;transition:all 0.2s;}
        .device-card:hover{box-shadow:0 6px 24px rgba(0,0,0,0.06);}
        .device-card.suspicious{border-color:#fca5a5;background:#fffafa;}
        .device-icon-wrap{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .device-main{flex:1;min-width:0;}
        .device-name-row{display:flex;align-items:center;gap:8px;margin-bottom:5px;}
        .device-name{font-size:14px;font-weight:600;color:#0f172a;}
        .device-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
        .device-user{font-size:12.5px;font-weight:600;color:#475569;}
        .device-emp{font-size:12px;color:#94a3b8;}
        .browser-tag{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;padding:2px 9px;border-radius:6px;white-space:nowrap;}
        .os-text{font-size:12px;color:#94a3b8;}
        .device-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;}
        .status-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;}
        .status-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
        .ip-mono{font-family:monospace;font-size:12px;color:#64748b;}
        .last-used{font-size:12px;color:#94a3b8;}
        .revoke-btn{padding:5px 14px;border-radius:8px;border:1.5px solid #fecaca;background:#fff;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;font-family:'Open Sans',sans-serif;transition:all 0.15s;}
        .revoke-btn:hover{background:#fee2e2;border-color:#fca5a5;}
        .revoke-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .trust-badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:2px 9px;border-radius:20px;}

        .empty-state{text-align:center;padding:40px 0;color:#94a3b8;font-size:13px;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="dt-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="dt-main">
          <TopBar title="Security Monitoring" />
          <div className="dt-scroll">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2db9a3', background: 'rgba(45,185,163,0.08)', padding: '4px 10px', borderRadius: 20, marginBottom: 8 }}>
                  
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', margin: '0 0 4px' }}>Device Tracking</h1>
                <p style={{ fontSize: 13, color: '#8a9ab0', margin: 0 }}>Monitor and manage registered devices across all users</p>
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
                <input className="search-input" placeholder="Search by user or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <FilterDropdown
                options={[{ value: 'all', label: 'All Types' }, { value: 'desktop', label: 'Desktop' }, { value: 'mobile', label: 'Mobile' }, { value: 'tablet', label: 'Tablet' }]}
                value={typeFilter}
                onChange={setTypeFilter}
              />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{filtered.length} devices</span>
            </div>

            {loading ? (
              <p className="empty-state">Loading devices...</p>
            ) : filtered.length === 0 ? (
              <p className="empty-state">No devices found.</p>
            ) : (
              <div className="devices-list">
                {filtered.map(d => {
                  const s   = statusCfg[d.status] ?? statusCfg.inactive;
                  const bs  = getBrowserStyle(d.browser);
                  const Icon = (d.deviceType ?? '').toLowerCase() === 'mobile' ? Smartphone : (d.deviceType ?? '').toLowerCase() === 'tablet' ? Tablet : Monitor;
                  const iconColor = d.status === 'suspicious' ? '#ef4444' : '#2db9a3';
                  const iconBg    = d.status === 'suspicious' ? 'rgba(239,68,68,0.1)' : 'rgba(45,185,163,0.15)';
                  return (
                    <div key={d.id} className={`device-card${d.status === 'suspicious' ? ' suspicious' : ''}`}>
                      <div className="device-icon-wrap" style={{ background: iconBg, color: iconColor }}><Icon size={20} /></div>
                      <div className="device-main">
                        <div className="device-name-row">
                          <span className="device-name">{d.deviceName ?? 'Unknown Device'}</span>
                          {d.isTrusted
                            ? <span className="trust-badge" style={{ background: '#dcfce7', color: '#059669' }}><CheckCircle size={11} /> Trusted</span>
                            : <span className="trust-badge" style={{ background: '#fee2e2', color: '#dc2626' }}><XCircle size={11} /> Untrusted</span>}
                        </div>
                        <div className="device-meta">
                          <span className="device-user">{d.userName}</span>
                          <span className="device-emp">{d.employeeId}</span>
                          {d.browser && (
                            <span className="browser-tag" style={{ background: bs.bg, color: bs.color }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: bs.color }} />{d.browser}
                            </span>
                          )}
                          {d.os && <span className="os-text">{d.os}</span>}
                          {d.location && <span className="os-text">{d.location}</span>}
                        </div>
                      </div>
                      <div className="device-right">
                        <span className="status-badge" style={{ background: s.bg, color: s.color }}>
                          <span className="status-dot" style={{ background: s.dot }} />{s.label}
                        </span>
                        <span className="ip-mono">{d.ipAddress ?? '—'}</span>
                        <span className="last-used">{formatDate(d.lastUsed)}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
                          {/* Trust button — only show if not already trusted and not revoked */}
                          {d.status !== 'revoked' && !d.isTrusted && (
                            <button
                              onClick={() => handleTrust(d.id)}
                              title="Mark as trusted"
                              disabled={trusting === d.id}
                              style={{
                                display:'flex', alignItems:'center', gap:4,
                                padding:'5px 10px', borderRadius:8,
                                border:'1.5px solid #a7f3d0', background:'#f0fdf9',
                                color:'#059669', fontSize:12, fontWeight:700,
                                cursor: trusting === d.id ? 'not-allowed' : 'pointer', fontFamily:"'Open Sans',sans-serif",
                                opacity: trusting === d.id ? 0.6 : 1
                              }}>
                              ✓ {trusting === d.id ? 'Trusting...' : 'Trust'}
                            </button>
                          )}

                          {/* Already trusted badge */}
                          {d.isTrusted && d.status !== 'revoked' && (
                            <span style={{
                              display:'flex', alignItems:'center', gap:4,
                              padding:'5px 10px', borderRadius:8,
                              background:'#dcfce7', color:'#059669',
                              fontSize:12, fontWeight:700
                            }}>
                              ✓ Trusted
                            </span>
                          )}

                          {/* Revoke button — only show if not already revoked */}
                          {d.status !== 'revoked' && (
                            <button
                              onClick={() => handleRevoke(d.id)}
                              title="Revoke device"
                              disabled={revoking === d.id}
                              style={{
                                display:'flex', alignItems:'center', gap:4,
                                padding:'5px 10px', borderRadius:8,
                                border:'1.5px solid #fecaca', background:'#fff',
                                color:'#ef4444', fontSize:12, fontWeight:700,
                                cursor: revoking === d.id ? 'not-allowed' : 'pointer', fontFamily:"'Open Sans',sans-serif"
                              }}>
                              ✕ {revoking === d.id ? 'Revoking...' : 'Revoke'}
                            </button>
                          )}

                          {/* Revoked badge */}
                          {d.status === 'revoked' && (
                            <span style={{
                              padding:'5px 10px', borderRadius:8,
                              background:'#f1f5f9', color:'#94a3b8',
                              fontSize:12, fontWeight:700
                            }}>
                              Revoked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

