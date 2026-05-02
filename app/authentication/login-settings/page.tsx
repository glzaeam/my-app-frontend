'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { AlertCircle, Shield, Clock, Globe, Plus, ChevronDown, X } from 'lucide-react';
import { auth } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;

function CustomSelect({ options, value, onChange, disabled }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean; // ✅ added
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
      <button
        type="button"
        onClick={() => !disabled && setOpen(v => !v)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: `1.5px solid ${open ? '#2db9a3' : '#e2e8f0'}`,
          fontSize: 13.5, color: disabled ? '#94a3b8' : '#1e293b',
          background: disabled ? '#f8fafc' : open ? '#fff' : '#f8fafc',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans',sans-serif", fontWeight: 400, outline: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: open && !disabled ? '0 0 0 3px rgba(45,185,163,0.1)' : 'none',
          transition: 'all 0.18s', opacity: disabled ? 0.7 : 1,
        }}
      >
        <span>{selected?.label ?? 'Select'}</span>
        <ChevronDown size={15} style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && !disabled && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden' }}>
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ width: '100%', padding: '10px 14px', fontSize: 13.5, color: opt.value === value ? '#2db9a3' : '#1e293b', background: opt.value === value ? 'rgba(45,185,163,0.08)' : '#fff', fontWeight: opt.value === value ? 600 : 400, fontFamily: "'DM Sans',sans-serif", border: 'none', cursor: 'pointer', textAlign: 'left', display: 'block' }}
              onMouseEnter={e => { if (opt.value !== value) (e.target as HTMLElement).style.background = '#f8fafc'; }}
              onMouseLeave={e => { if (opt.value !== value) (e.target as HTMLElement).style.background = '#fff'; }}>
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

export default function LoginSettings() {
  const router = useRouter();

  // ✅ Pull canEdit from AuthContext — driven by Permission Matrix in DB
  const { canEdit } = useAuth();
  const isEditable = canEdit('authentication'); // true only if DB says CanEdit = true

  const [activeMenu, setActiveMenu]     = useState('login-settings');
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [maxAttempts, setMaxAttempts]         = useState('5');
  const [lockoutDuration, setLockoutDuration] = useState('15');
  const [sessionTimeout, setSessionTimeout]   = useState('480');
  const [maxSessions, setMaxSessions]         = useState('3');
  const [ipWhitelisting, setIpWhitelisting]   = useState(false);
  const [allowedIps, setAllowedIps]           = useState<string[]>([]);
  const [newIp, setNewIp]                     = useState('');
  const [newIpLabel, setNewIpLabel]           = useState('');
  const [showAddIp, setShowAddIp]             = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/login-settings`, {
        headers: { Authorization: `Bearer ${auth.getToken()}` }
      });
      const data = await res.json();
      setMaxAttempts(String(data.maxFailedAttempts ?? 5));
      setLockoutDuration(String(data.lockoutDuration ?? 15));
      setSessionTimeout(String(data.sessionTimeoutMinutes ?? 480));
      setMaxSessions(String(data.maxConcurrentSessions ?? 3));
      setIpWhitelisting(data.ipWhitelistEnabled ?? false);
      if (data.allowedIps) setAllowedIps(data.allowedIps.split(',').filter(Boolean));
    } catch { setToast({ msg: 'Failed to load settings', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    if (!isEditable) return; // ✅ guard: ignore if no edit permission
    setSaving(true);
    try {
      const res  = await fetch(`${API}/login-settings`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({
          maxFailedAttempts:     parseInt(maxAttempts),
          lockoutDuration:       parseInt(lockoutDuration),
          sessionTimeoutMinutes: parseInt(sessionTimeout),
          maxConcurrentSessions: parseInt(maxSessions),
          ipWhitelistEnabled:    ipWhitelisting,
          allowedIps:            allowedIps.join(','),
        }),
      });
      const data = await res.json();
      if (data.success) setToast({ msg: 'Settings saved successfully', type: 'success' });
      else setToast({ msg: data.message || 'Save failed', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const addIp = () => {
    if (!newIp.trim() || !isEditable) return;
    const entry = newIpLabel.trim() ? `${newIp.trim()} (${newIpLabel.trim()})` : newIp.trim();
    setAllowedIps(prev => [...prev, entry]);
    setNewIp(''); setNewIpLabel(''); setShowAddIp(false);
  };

  const removeIp = (i: number) => {
    if (!isEditable) return;
    setAllowedIps(prev => prev.filter((_, idx) => idx !== i));
  };

  const maxAttemptsOptions    = [{ value:'3', label:'3 attempts' }, { value:'5', label:'5 attempts' }, { value:'10', label:'10 attempts' }];
  const lockoutOptions        = [{ value:'15', label:'15 minutes' }, { value:'30', label:'30 minutes' }, { value:'60', label:'1 hour' }, { value:'1440', label:'24 hours' }];
  const sessionTimeoutOptions = [{ value:'60', label:'1 hour' }, { value:'240', label:'4 hours' }, { value:'480', label:'8 hours' }, { value:'1440', label:'24 hours' }];
  const maxSessionOptions     = [{ value:'1', label:'1 session' }, { value:'2', label:'2 sessions' }, { value:'3', label:'3 sessions' }, { value:'5', label:'5 sessions' }];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .ls-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'DM Sans',sans-serif;}
        .ls-content{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .ls-scroll{flex:1;overflow-y:auto;padding:32px 36px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .ls-scroll::-webkit-scrollbar{width:6px;}
        .ls-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .ls-header{margin-bottom:28px;}
        .ls-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#2db9a3;background:rgba(45,185,163,0.08);padding:4px 10px;border-radius:20px;margin-bottom:10px;}
        .ls-header h1{font-size:24px;font-weight:600;color:#0f172a;margin-bottom:4px;letter-spacing:-0.02em;}
        .ls-header p{font-size:13px;color:#94a3b8;}
        .ls-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:18px;margin-bottom:28px;}
        .ls-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.05);}
        .ls-card-title{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:500;color:#0f172a;margin-bottom:20px;}
        .ls-card-icon{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(45,185,163,0.15);color:#1D9E75;flex-shrink:0;box-shadow:0 0 12px rgba(45,185,163,0.2);}
        .ls-field{margin-bottom:16px;}
        .ls-field:last-child{margin-bottom:0;}
        .ls-label{font-size:11.5px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:7px;display:block;}
        .ls-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #f1f5f9;}
        .ls-toggle-row:last-child{border-bottom:none;padding-bottom:0;}
        .ls-toggle-row:first-child{padding-top:0;}
        .ls-toggle-info h3{font-size:13.5px;font-weight:500;color:#1e293b;margin-bottom:3px;}
        .ls-toggle-info p{font-size:12px;color:#94a3b8;}
        .ls-toggle{width:46px;height:26px;border-radius:13px;background:#e2e8f0;position:relative;transition:background 0.25s;flex-shrink:0;border:none;outline:none;}
        .ls-toggle.on{background:#2db9a3;}
        .ls-toggle-thumb{width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:left 0.25s;box-shadow:0 1px 4px rgba(0,0,0,0.18);}
        .ls-toggle.on .ls-toggle-thumb{left:23px;}
        .ls-ip-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;}
        .ls-ip-row:last-child{border-bottom:none;}
        .ls-ip-code{font-size:12px;font-weight:500;color:#0f172a;font-family:'DM Mono',monospace;background:#f1f5f9;padding:3px 8px;border-radius:6px;border:1px solid #e2e8f0;}
        .ls-ip-remove{width:28px;height:28px;border-radius:8px;border:1.5px solid #fee2e2;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#ef4444;transition:all 0.15s;}
        .ls-ip-remove:hover{background:#fee2e2;}
        .ls-add-ip-btn{display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-size:13px;font-weight:600;color:#2db9a3;cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif;padding:6px 0;}
        .ls-add-ip-btn:hover{color:#1fa090;}
        .ls-add-ip-form{margin-top:12px;display:flex;flex-direction:column;gap:8px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;}
        .ls-mini-input{height:36px;padding:0 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;color:#1a2332;background:#fff;outline:none;width:100%;}
        .ls-mini-input:focus{border-color:#2db9a3;}
        .ls-footer{display:flex;justify-content:flex-end;gap:12px;padding-top:4px;}
        .ls-btn-cancel{padding:11px 28px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;font-size:13.5px;font-weight:500;font-family:'DM Sans',sans-serif;transition:all 0.18s;}
        .ls-btn-cancel:hover{background:#f8fafc;}
        .ls-btn-save{padding:11px 28px;border-radius:10px;border:none;background:#2db9a3;color:#fff;cursor:pointer;font-size:13.5px;font-weight:600;font-family:'DM Sans',sans-serif;transition:all 0.18s;box-shadow:0 2px 10px rgba(45,185,163,0.3);}
        .ls-btn-save:hover:not(:disabled){background:#28a593;}
        .ls-btn-save:disabled{opacity:0.6;cursor:not-allowed;}
        .readonly-badge{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:#64748b;background:#f1f5f9;padding:5px 12px;border-radius:20px;border:1px solid #e2e8f0;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="ls-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="ls-content">
          <TopBar title="Login Settings" />
          <div className="ls-scroll">
            <div className="ls-header">
              {/* ✅ Show read-only badge if user cannot edit */}
              {!isEditable && (
                <span className="readonly-badge">👁 View Only</span>
              )}
              <h1>Login Settings</h1>
              <p>
                {isEditable
                  ? 'Configure authentication settings — changes apply immediately to all login attempts.'
                  : 'You have read-only access to these settings.'}
              </p>
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#94a3b8' }}>Loading settings...</div>
            ) : (
              <>
                <div className="ls-grid">
                  {/* Attempt Limits */}
                  <div className="ls-card">
                    <div className="ls-card-title">
                      <div className="ls-card-icon"><AlertCircle size={16}/></div>
                      Attempt Limits
                    </div>
                    <div className="ls-field">
                      <label className="ls-label">Max Failed Attempts Before Lockout</label>
                      {/* ✅ disabled when view-only */}
                      <CustomSelect options={maxAttemptsOptions} value={maxAttempts} onChange={setMaxAttempts} disabled={!isEditable}/>
                    </div>
                    <div className="ls-field">
                      <label className="ls-label">Account Lockout Duration</label>
                      <CustomSelect options={lockoutOptions} value={lockoutDuration} onChange={setLockoutDuration} disabled={!isEditable}/>
                    </div>
                  </div>

                  {/* Session Settings */}
                  <div className="ls-card">
                    <div className="ls-card-title">
                      <div className="ls-card-icon"><Clock size={16}/></div>
                      Session Settings
                    </div>
                    <div className="ls-field">
                      <label className="ls-label">Session Timeout</label>
                      <CustomSelect options={sessionTimeoutOptions} value={sessionTimeout} onChange={setSessionTimeout} disabled={!isEditable}/>
                    </div>
                    <div className="ls-field">
                      <label className="ls-label">Max Concurrent Sessions Per User</label>
                      <CustomSelect options={maxSessionOptions} value={maxSessions} onChange={setMaxSessions} disabled={!isEditable}/>
                    </div>
                  </div>

                  {/* Login Behavior */}
                  <div className="ls-card">
                    <div className="ls-card-title">
                      <div className="ls-card-icon"><Shield size={16}/></div>
                      Login Behavior
                    </div>
                    <div className="ls-toggle-row">
                      <div className="ls-toggle-info">
                        <h3>IP Whitelisting</h3>
                        <p>Restrict login to pre-approved IP addresses only</p>
                      </div>
                      {/* ✅ Toggle disabled when view-only */}
                      <button
                        className={`ls-toggle ${ipWhitelisting ? 'on' : ''}`}
                        onClick={() => isEditable && setIpWhitelisting(v => !v)}
                        style={{ cursor: isEditable ? 'pointer' : 'not-allowed', opacity: isEditable ? 1 : 0.6 }}
                      >
                        <div className="ls-toggle-thumb"/>
                      </button>
                    </div>
                    {ipWhitelisting && (
                      <div style={{ marginTop:12, padding:'12px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10 }}>
                        <p style={{ fontSize:12, color:'#d97706', fontWeight:600 }}>⚠️ Only IPs in the whitelist below can log in. Make sure your current IP is included.</p>
                      </div>
                    )}
                  </div>

                  {/* Whitelisted IPs */}
                  <div className="ls-card">
                    <div className="ls-card-title">
                      <div className="ls-card-icon"><Globe size={16}/></div>
                      Whitelisted IPs
                      {!ipWhitelisting && <span style={{ fontSize:11, fontWeight:600, color:'#94a3b8', marginLeft:'auto' }}>IP whitelisting is disabled</span>}
                    </div>

                    {allowedIps.length === 0 ? (
                      <p style={{ fontSize:13, color:'#94a3b8', textAlign:'center', padding:'16px 0' }}>No IPs whitelisted</p>
                    ) : allowedIps.map((ip, i) => (
                      <div key={i} className="ls-ip-row">
                        <span className="ls-ip-code">{ip}</span>
                        {/* ✅ Hide remove button when view-only */}
                        {isEditable && (
                          <button className="ls-ip-remove" onClick={() => removeIp(i)}><X size={13}/></button>
                        )}
                      </div>
                    ))}

                    {/* ✅ Hide Add IP button when view-only */}
                    {isEditable && (
                      showAddIp ? (
                        <div className="ls-add-ip-form">
                          <input className="ls-mini-input" placeholder="IP or CIDR e.g. 192.168.1.0/24" value={newIp} onChange={e => setNewIp(e.target.value)}/>
                          <input className="ls-mini-input" placeholder="Label (optional)" value={newIpLabel} onChange={e => setNewIpLabel(e.target.value)}/>
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={addIp} style={{ flex:1, height:34, borderRadius:8, border:'none', background:'#2db9a3', color:'#fff', fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:'pointer' }}>Add</button>
                            <button onClick={() => { setShowAddIp(false); setNewIp(''); setNewIpLabel(''); }} style={{ flex:1, height:34, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#64748b', fontSize:13, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:'pointer' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="ls-add-ip-btn" onClick={() => setShowAddIp(true)}>
                          <Plus size={14}/> Add IP Range
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* ✅ Hide Save button entirely when view-only */}
                {isEditable && (
                  <div className="ls-footer">
                    <button className="ls-btn-save" disabled={saving} onClick={handleSave}>
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}