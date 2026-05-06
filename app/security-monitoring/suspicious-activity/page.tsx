'use client';
import DashboardLayout from '@/app/components/DashboardLayout';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, CheckCircle, Filter, ChevronDown } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface SecurityAlert {
  id: string;
  alertType: string;
  severity: string;
  description: string;
  status: string;
  createdAt: string;
  userName: string;
  employeeId: string;
}

const severityCfg: Record<string, { color: string; bg: string; border: string; dot: string; iconBg: string }> = {
  critical: { color: '#dc2626', bg: '#fff5f5', border: '#fca5a5', dot: '#ef4444', iconBg: 'rgba(239,68,68,0.1)'  },
  high:     { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', dot: '#f97316', iconBg: 'rgba(249,115,22,0.1)' },
  medium:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)' },
  low:      { color: '#1D9E75', bg: '#f0fdf9', border: '#a7f3d0', dot: '#10b981', iconBg: 'rgba(45,185,163,0.15)'  },
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

export default function SuspiciousActivity() {
  const router = useRouter();
    const [sidebarOpen,      setSidebarOpen]      = useState(true);
  const [alerts,           setAlerts]           = useState<SecurityAlert[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [severityFilter,   setSeverityFilter]   = useState('all');
  const [resolving,        setResolving]        = useState<string | null>(null);
  const [toast,            setToast]            = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

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
      if (data.success) { setToast({ msg: 'Alert resolved', type: 'success' }); fetchAlerts(); }
      else setToast({ msg: data.message || 'Failed', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setResolving(null); }
  };

  const filtered = alerts.filter(a => severityFilter === 'all' || a.severity === severityFilter);
  const statCards = [
    { label: 'Critical', value: alerts.filter(a => a.severity === 'critical').length, accent: '#dc2626', iconBg: 'rgba(220,38,38,0.1)' },
    { label: 'High',     value: alerts.filter(a => a.severity === 'high').length,     accent: '#ea580c', iconBg: 'rgba(234,88,12,0.1)'  },
    { label: 'Medium',   value: alerts.filter(a => a.severity === 'medium').length,   accent: '#d97706', iconBg: 'rgba(217,119,6,0.1)'  },
    { label: 'Low',      value: alerts.filter(a => a.severity === 'low').length,      accent: '#1D9E75', iconBg: 'rgba(45,185,163,0.15)' },
  ];

  const formatTime = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1)  return 'just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} day ago`;
  };

  return (
    <DashboardLayout title="Security Monitoring" activeMenu="suspicious-activity">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .sa-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'Open Sans',sans-serif;}
        .sa-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .sa-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .sa-scroll::-webkit-scrollbar{width:6px;}
        .sa-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:22px;}
        .stat-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;}
        .stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--icon-bg);color:var(--accent);flex-shrink:0;}
        .stat-val{font-size:26px;font-weight:600;color:var(--accent);letter-spacing:-0.03em;line-height:1;}
        .stat-label{font-size:11.5px;font-weight:600;color:#94a3b8;text-transform:capitalize;margin-top:2px;}
        .controls-bar{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
        .filter-select{padding:8px 14px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;color:#64748b;font-family:'Open Sans',sans-serif;cursor:pointer;outline:none;}
        .filter-select:focus{border-color:#2db9a3;}
        .activities-list{display:flex;flex-direction:column;gap:12px;}
        .activity-card{background:#fff;border:1.5px solid var(--a-border);border-left:3px solid var(--a-color);border-radius:16px;padding:18px 22px;transition:all 0.2s;}
        .activity-card:hover{box-shadow:0 6px 24px rgba(0,0,0,0.06);}
        .activity-card.resolved{opacity:0.6;}
        .activity-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;}
        .activity-title-row{display:flex;align-items:center;gap:10px;}
        .activity-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:var(--a-icon-bg);color:var(--a-color);flex-shrink:0;}
        .activity-title{font-size:14px;font-weight:600;color:#0f172a;}
        .sev-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;text-transform:capitalize;}
        .time-row{display:flex;align-items:center;gap:5px;font-size:12px;color:#94a3b8;white-space:nowrap;}
        .activity-desc{font-size:13px;color:#64748b;margin-bottom:10px;line-height:1.5;}
        .activity-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
        .user-info{font-size:12px;color:#64748b;}
       .resolve-btn{width:34px;height:34px;border-radius:8px;border:1.5px solid #2db9a3;background:#fff;color:#2db9a3;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0;}
.resolve-btn:hover{background:#2db9a3;color:#fff;}
.resolve-btn:disabled{opacity:0.5;cursor:not-allowed;}

        .empty-state{text-align:center;padding:40px 0;color:#94a3b8;font-size:13px;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      
        
        
          
          <div className="sa-scroll">
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#dc2626', background: 'rgba(220,38,38,0.08)', padding: '4px 10px', borderRadius: 20, marginBottom: 8 }}>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', margin: '0 0 4px' }}>Suspicious Activity</h1>
            </div>

            <div className="stats-grid">
              {statCards.map(sc => (
                <div key={sc.label} className="stat-card" style={{ '--accent': sc.accent, '--icon-bg': sc.iconBg } as React.CSSProperties}>
                  <div className="stat-icon"><AlertTriangle size={18} /></div>
                  <div><div className="stat-val">{sc.value}</div><div className="stat-label">{sc.label}</div></div>
                </div>
              ))}
            </div>

            <div className="controls-bar">
              <FilterDropdown
                options={[{ value: 'all', label: 'All Severity' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]}
                value={severityFilter}
                onChange={setSeverityFilter}
              />

            </div>

            {loading ? (
              <div className="empty-state">Loading alerts...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">No alerts found.</div>
            ) : (
              <div className="activities-list">
                {filtered.map(alert => {
                  const cfg = severityCfg[alert.severity] || severityCfg.low;
                  return (
                    <div key={alert.id} className={`activity-card${alert.status === 'resolved' ? ' resolved' : ''}`} style={{ '--a-color': cfg.color, '--a-border': cfg.border, '--a-icon-bg': cfg.iconBg } as React.CSSProperties}>
                      <div className="activity-top">
                        <div className="activity-title-row">
                          <div className="activity-icon"><AlertTriangle size={16} /></div>
                          <div style={{ flex: 1 }}>
                            <div className="activity-title">{alert.alertType}</div>
                            <div className="time-row"><Clock size={12} />{formatTime(alert.createdAt)}</div>
                          </div>
                        </div>
                        <div className="sev-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
                          {alert.severity}
                        </div>
                      </div>
                      <div className="activity-desc">{alert.description}</div>
                      <div className="activity-footer">
                        <div className="user-info">
                          <strong>{alert.userName}</strong> ({alert.employeeId})
                        </div>
                        {alert.status !== 'resolved' && (
                         <button className="resolve-btn" onClick={() => handleResolve(alert.id)} disabled={resolving === alert.id} title="Resolve Alert">
  {resolving === alert.id ? <Clock size={14} /> : <CheckCircle size={14} />}
</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
    </DashboardLayout>
  );
}



