'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { AlertTriangle, Eye, Lock, RefreshCw, CheckCircle, ChevronDown, Filter } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface SecurityAlert {
  id: string;
  alertType: string;
  severity: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  userName: string;
  employeeId: string;
}

const alertCfg: Record<string, { color: string; bg: string; border: string; dot: string; iconBg: string }> = {
  critical: { color: '#dc2626', bg: '#fff5f5', border: '#fca5a5', dot: '#ef4444', iconBg: 'rgba(239,68,68,0.1)'  },
  high:     { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', dot: '#f97316', iconBg: 'rgba(249,115,22,0.1)' },
  warning:  { color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)' },
  medium:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)' },
  info:     { color: '#2db9a3', bg: '#f0fdf9', border: '#a7f3d0', dot: '#10b981', iconBg: 'rgba(45,185,163,0.1)'  },
  low:      { color: '#2db9a3', bg: '#f0fdf9', border: '#a7f3d0', dot: '#10b981', iconBg: 'rgba(45,185,163,0.1)'  },
};

function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, padding: '14px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, fontFamily: "'Open Sans',sans-serif", boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: type === 'success' ? '#ecfdf5' : '#fef2f2', color: type === 'success' ? '#059669' : '#dc2626', border: `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
      {msg}
    </div>
  );
}

function FilterDropdown({ options, value, onChange }: { options: string[]; value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectedLabel = value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Select Filter';
  const isSelected = value === options[0];

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
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 13,
                color: opt === value ? '#2db9a3' : '#1e293b',
                background: opt === value ? 'rgba(45,185,163,0.08)' : '#fff',
                fontWeight: opt === value ? 700 : 500,
                fontFamily: "'Open Sans',sans-serif",
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'block',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = opt === value ? 'rgba(45,185,163,0.12)' : '#f8fafc';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = opt === value ? 'rgba(45,185,163,0.08)' : '#fff';
              }}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LiveAlerts() {
  const router = useRouter();
  const [activeMenu,  setActiveMenu]  = useState('live-alerts');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alerts,      setAlerts]      = useState<SecurityAlert[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [resolving,   setResolving]   = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/security/alerts`, { headers: { Authorization: `Bearer ${auth.getToken()}` } });
      const data = await res.json();
      setAlerts(data);
    } catch { setToast({ msg: 'Failed to load alerts', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      const res  = await fetch(`${API}/security/alerts/${id}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setToast({ msg: 'Alert resolved', type: 'success' });
        fetchAlerts();
      } else setToast({ msg: data.message || 'Failed to resolve', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setResolving(null); }
  };

  const filtered = alerts.filter(a => filter === 'all' || a.severity === filter || a.status === filter);
  const active   = alerts.filter(a => a.status === 'active');
  const critical = alerts.filter(a => a.severity === 'critical').length;

  const formatTime = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1)  return 'just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} day ago`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .la-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .la-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .la-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .la-scroll::-webkit-scrollbar{width:6px;}
        .la-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:22px;}
        .stat-box{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px 18px;}
        .stat-val{font-size:26px;font-weight:600;letter-spacing:-0.03em;color:var(--accent);}
        .stat-lbl{font-size:11.5px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-top:2px;}
        .section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
        .live-badge{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#059669;background:#dcfce7;padding:5px 12px;border-radius:20px;}
        .live-dot{width:6px;height:6px;background:#10b981;border-radius:50%;animation:blink 2s ease-in-out infinite;}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0.3;}}
        .alerts-list{display:flex;flex-direction:column;gap:10px;}
        .alert-card{background:#fff;border:1.5px solid var(--a-border);border-left:3px solid var(--a-color);border-radius:14px;padding:16px 20px;display:flex;align-items:flex-start;gap:14px;transition:box-shadow 0.2s;}
        .alert-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.06);}
        .alert-card.resolved{opacity:0.6;}
        .alert-icon-wrap{width:36px;height:36px;border-radius:10px;background:var(--a-icon-bg);color:var(--a-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .alert-body{flex:1;}
        .alert-header-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
        .alert-title{font-size:13.5px;font-weight:600;color:#0f172a;}
        .alert-meta{font-size:12px;color:#64748b;margin-top:4px;}
        .sev-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;text-transform:capitalize;margin-left:8px;}
        .time-text{font-size:11.5px;color:#94a3b8;white-space:nowrap;}
        .resolve-btn{padding:5px 12px;border-radius:7px;border:1.5px solid #2db9a3;background:#fff;color:#2db9a3;font-size:12px;font-weight:600;cursor:pointer;font-family:'Open Sans',sans-serif;transition:all 0.15s;flex-shrink:0;}
        .resolve-btn:hover{background:#2db9a3;color:#fff;}
        .resolve-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .filter-bar{display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;}
        .filter-chip{padding:6px 14px;border-radius:20px;border:1.5px solid #e2e8f0;background:#fff;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;font-family:'Open Sans',sans-serif;transition:all 0.15s;}
        .filter-chip:hover{border-color:#2db9a3;color:#2db9a3;}
        .filter-chip.active{background:#2db9a3;border-color:#2db9a3;color:#fff;}
        .refresh-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px;font-family:'Open Sans',sans-serif;color:#64748b;cursor:pointer;margin-left:auto;}
        .refresh-btn:hover{background:#f5f7fa;}
        .empty-state{text-align:center;padding:40px 0;color:#94a3b8;font-size:13px;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="la-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="la-main">
          <TopBar title="Security Monitoring" />
          <div className="la-scroll">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2db9a3', background: 'rgba(45,185,163,0.08)', padding: '4px 10px', borderRadius: 20, marginBottom: 8 }}>
                  
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', margin: '0 0 4px' }}>Live Alerts</h1>
              </div>
              <button className="refresh-btn" onClick={fetchAlerts}><RefreshCw size={13} /> Refresh</button>
            </div>

            <div className="stats-row">
              {[
                { label: 'Total Alerts',    value: alerts.length, accent: '#6366f1' },
                { label: 'Active',          value: active.length, accent: '#ef4444' },
                { label: 'Critical',        value: critical,      accent: '#dc2626' },
                { label: 'Resolved',        value: alerts.filter(a => a.status === 'resolved').length, accent: '#2db9a3' },
              ].map((s, i) => (
                <div key={i} className="stat-box" style={{ '--accent': s.accent } as React.CSSProperties}>
                  <div className="stat-val">{s.value}</div>
                  <div className="stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="section-title">
              <div className="live-badge"><div className="live-dot" />Live</div>
            </div>

            <div className="filter-bar">
              <FilterDropdown
                options={['all', 'active', 'critical', 'high', 'medium', 'low', 'resolved']}
                value={filter}
                onChange={f => setFilter(f)}
              />
            </div>

            {loading ? (
              <p className="empty-state">Loading alerts...</p>
            ) : (
              <div className="alerts-list">
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 13 }}>
                    <AlertTriangle size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <p>No alerts found in this filter.</p>
                  </div>
                ) : (
                  filtered.map(a => {
                    const cfg  = alertCfg[a.severity] ?? alertCfg.info;
                    const Icon = a.severity === 'critical' || a.severity === 'high' ? AlertTriangle : a.severity === 'medium' ? Eye : Lock;
                    return (
                      <div key={a.id} className={`alert-card${a.status === 'resolved' ? ' resolved' : ''}`} style={{ '--a-color': cfg.color, '--a-border': cfg.border, '--a-icon-bg': cfg.iconBg } as React.CSSProperties}>
                        <div className="alert-icon-wrap"><Icon size={16} /></div>
                        <div className="alert-body">
                          <div className="alert-header-row">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span className="alert-title">{a.alertType}</span>
                              <span className="sev-badge" style={{ background: cfg.bg, color: cfg.color }}>{a.severity}</span>
                            </div>
                            <span className="time-text">{formatTime(a.createdAt)}</span>
                          </div>
                          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0' }}>{a.description}</p>
                          <div className="alert-meta">User: {a.userName} · {a.employeeId}</div>
                        </div>
                        {a.status === 'active' ? (
                          <button className="resolve-btn" onClick={() => handleResolve(a.id)} disabled={resolving === a.id}>
                            {resolving === a.id ? '...' : 'Resolve'}
                          </button>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#059669', background: '#dcfce7', padding: '4px 10px', borderRadius: 20, flexShrink: 0 }}>
                            <CheckCircle size={12} /> Resolved
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

