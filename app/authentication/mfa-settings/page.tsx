'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { Settings, MessageSquare, Mail, Smartphone, ChevronLeft, ChevronRight, ChevronDown, Edit2, X } from 'lucide-react';
import { auth } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;

function CustomSelect({ options, value, onChange, disabled }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
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

interface RoleRow {
  id: string;
  name: string;
  mfaRequirement: string;
  allowedMfaMethods: string | null;
  userCount: number;
}

export default function MFASettings() {
  const router = useRouter();

  const { canEdit } = useAuth();
  const isEditable = canEdit('authentication');

  const [activeMenu, setActiveMenu]   = useState('mfa-settings');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [smsEnabled, setSmsEnabled]                     = useState(true);
  const [emailEnabled, setEmailEnabled]                 = useState(true);
  const [authenticatorEnabled, setAuthenticatorEnabled] = useState(false);
  const [codeExpiry, setCodeExpiry]                     = useState('5');
  const [graceLogins, setGraceLogins]                   = useState('0');

  // Authenticator App setup state
  const [showAuthSetup, setShowAuthSetup] = useState(false);
  const [qrUri, setQrUri]                = useState('');
  const [totpSecret, setTotpSecret]      = useState('');
  const [totpCode, setTotpCode]          = useState('');
  const [verifying, setVerifying]        = useState(false);

  const [roles, setRoles]             = useState<RoleRow[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editForm, setEditForm]       = useState({ mfaRequirement: 'Optional', allowedMfaMethods: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = auth.getToken();
      const [configRes, rolesRes] = await Promise.all([
        fetch(`${API}/mfa/config`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/mfa/roles`,  { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const config    = await configRes.json();
      const rolesData = await rolesRes.json();

      setSmsEnabled(config.smsEnabled ?? true);
      setEmailEnabled(config.emailEnabled ?? true);
      // ✅ Reads per-user authenticator status from backend (MfaSettings table)
      setAuthenticatorEnabled(config.authenticatorEnabled ?? false);
      setCodeExpiry(String(config.codeExpiryMinutes ?? 5));
      setGraceLogins(String(config.graceLogins ?? 0));
      setRoles(rolesData);
    } catch { setToast({ msg: 'Failed to load MFA settings', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveConfig = async () => {
    if (!isEditable) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/mfa/config`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({
          smsEnabled, emailEnabled, authenticatorEnabled,
          codeExpiryMinutes: parseInt(codeExpiry),
          graceLogins:       parseInt(graceLogins),
        }),
      });
      const data = await res.json();
      if (data.success) setToast({ msg: 'MFA settings saved', type: 'success' });
      else setToast({ msg: data.message || 'Save failed', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleSaveRole = async (roleId: string) => {
    if (!isEditable) return;
    try {
      const res  = await fetch(`${API}/mfa/roles/${roleId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ msg: 'Role MFA updated — user accounts updated', type: 'success' });
        setEditingRole(null);
        fetchData();
      } else setToast({ msg: data.message || 'Update failed', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
  };

  const setupAuthenticator = async () => {
    try {
      const res  = await fetch(`${API}/mfa/authenticator/setup`, {
        method: 'POST', headers: { Authorization: `Bearer ${auth.getToken()}` }
      });
      const data = await res.json();
      setQrUri(data.qrUri);
      setTotpSecret(data.secret);
      setTotpCode('');
      setShowAuthSetup(true);
    } catch { setToast({ msg: 'Failed to start authenticator setup', type: 'error' }); }
  };

  const verifyAuthenticator = async () => {
    setVerifying(true);
    try {
      const res  = await fetch(`${API}/mfa/authenticator/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body:    JSON.stringify({ code: totpCode })
      });
      const data = await res.json();
      if (data.success) {
        // ✅ Flip toggle ON immediately
        setAuthenticatorEnabled(true);
        setShowAuthSetup(false);
        setToast({ msg: 'Authenticator app enabled! Login will now use your Authenticator app.', type: 'success' });
      } else {
        setToast({ msg: data.message || 'Invalid code', type: 'error' });
      }
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setVerifying(false); }
  };

  // ✅ Calls backend to set IsEnabled = false in DB
  const disableAuthenticator = async () => {
    try {
      const res  = await fetch(`${API}/mfa/authenticator/disable`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${auth.getToken()}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticatorEnabled(false);
        setToast({ msg: 'Authenticator disabled. Login will now use SMS/Email OTP.', type: 'success' });
      } else {
        setToast({ msg: data.message || 'Failed to disable authenticator', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Failed to disable authenticator', type: 'error' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(roles.length / itemsPerPage));
  const safePage   = Math.min(currentPage, totalPages);
  const paged      = roles.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const reqStyle: Record<string, { color: string; bg: string }> = {
    Required: { color: '#2563eb', bg: '#dbeafe' },
    Optional: { color: '#d97706', bg: '#fef3c7' },
    Disabled: { color: '#94a3b8', bg: '#f1f5f9' },
  };

  const authMethods = [
    { icon: <Smartphone size={18} />, label: 'SMS OTP',          desc: 'Send one-time codes via SMS',      value: smsEnabled,           toggle: () => setSmsEnabled(v => !v),           accent: '#1D9E75', iconBg: 'rgba(45,185,163,0.15)' },
    { icon: <Mail size={18} />,       label: 'Email OTP',         desc: 'Send one-time codes via email',    value: emailEnabled,         toggle: () => setEmailEnabled(v => !v),         accent: '#6366f1', iconBg: 'rgba(99,102,241,0.1)' },
    { icon: <Settings size={18} />,   label: 'Authenticator App', desc: 'Google / Microsoft Authenticator', value: authenticatorEnabled, toggle: () => {},                              accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .mfa-root{display:flex;height:100vh;background:#fff;overflow:hidden;font-family:'DM Sans',sans-serif;}
        .mfa-main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .mfa-scroll{flex:1;overflow-y:auto;padding:28px 32px;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;}
        .mfa-scroll::-webkit-scrollbar{width:6px;}
        .mfa-scroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
        .top-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:18px;margin-bottom:18px;overflow:visible;}
        .card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.06);overflow:visible;}
        .card-title{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:500;color:#0f172a;margin-bottom:20px;}
        .card-icon{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(45,185,163,0.15);color:#1D9E75;flex-shrink:0;box-shadow:0 0 12px rgba(45,185,163,0.2);}
        .method-row{display:flex;align-items:center;gap:14px;padding:13px 14px;border-radius:12px;border:1.5px solid #f1f5f9;margin-bottom:10px;background:#fafbfc;}
        .method-row:last-child{margin-bottom:0;}
        .method-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .method-info{flex:1;}
        .method-info h3{font-size:13.5px;font-weight:500;color:#0f172a;margin-bottom:2px;}
        .method-info p{font-size:12px;color:#94a3b8;}
        .toggle{width:46px;height:26px;border-radius:13px;background:#e2e8f0;position:relative;transition:background 0.25s;flex-shrink:0;border:none;outline:none;}
        .toggle.on{background:#2db9a3;}
        .toggle-thumb{width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:left 0.25s;box-shadow:0 1px 4px rgba(0,0,0,0.18);}
        .toggle.on .toggle-thumb{left:23px;}
        .field-group{margin-bottom:16px;position:relative;}
        .field-group:last-child{margin-bottom:0;}
        .field-label{font-size:12px;font-weight:500;color:#475569;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:7px;display:block;}
        .info-box{margin-top:16px;background:#f0fdf9;border:1.5px solid #a7f3d0;border-radius:10px;padding:12px 16px;}
        .info-box p{font-size:13px;font-weight:600;color:#059669;}
        .info-box span{font-size:12px;color:#34d399;display:block;margin-top:2px;}
        .table-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;overflow:hidden;margin-bottom:24px;box-shadow:0 4px 20px rgba(0,0,0,0.04);}
        .table-card-header{padding:20px 28px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9;}
        table{width:100%;border-collapse:collapse;table-layout:fixed;}
        thead tr{background:#f8fafc;border-bottom:1.5px solid #f1f5f9;}
        thead th{padding:11px 20px;text-align:center;font-size:10.5px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;}
        thead th:nth-child(1){width:25%;}
        thead th:nth-child(2){width:15%;}
        thead th:nth-child(3){width:25%;}
        thead th:nth-child(4){width:20%;}
        thead th:nth-child(5){width:15%;}
        tbody tr{border-bottom:1px solid #f8fafc;transition:background 0.13s;}
        tbody tr:last-child{border-bottom:none;}
        tbody tr:hover{background:#fafbfd;}
        tbody td{padding:14px 20px;font-size:13.5px;color:#1e293b;font-weight:500;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;}
        .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500;white-space:nowrap;}
        .badge-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
        .edit-icon-btn{width:32px;height:32px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;margin:0 auto;}
        .edit-icon-btn:hover{border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;}
        .modal-content{background:#fff;border-radius:16px;padding:28px;width:90%;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,0.15);}
        .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;border-bottom:1.5px solid #f1f5f9;padding-bottom:16px;}
        .modal-title{font-size:18px;font-weight:600;color:#0f172a;}
        .modal-close-btn{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:24px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;}
        .modal-close-btn:hover{color:#0f172a;}
        .modal-form-group{margin-bottom:18px;}
        .modal-form-group:last-of-type{margin-bottom:24px;}
        .modal-label{display:block;font-size:12px;font-weight:500;color:#475569;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px;}
        .modal-input{width:100%;height:42px;padding:0 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;color:#0f172a;background:#fff;outline:none;}
        .modal-input:focus{border-color:#2db9a3;box-shadow:0 0 0 3px rgba(45,185,163,0.1);}
        .modal-actions{display:flex;gap:12px;justify-content:flex-end;}
        .modal-cancel{padding:10px 20px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;}
        .modal-cancel:hover{border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .modal-save{padding:10px 20px;border-radius:8px;border:none;background:#2db9a3;color:#fff;cursor:pointer;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;}
        .modal-save:hover:not(:disabled){background:#28a593;}
        .modal-save:disabled{opacity:0.5;cursor:not-allowed;}
        .pg-counter{min-width:50px;text-align:center;font-size:13px;color:#475569;font-weight:500;}
        .pagination-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-top:1px solid #f1f5f9;background:#fafbfc;}
        .pagination-info{font-size:13px;color:#94a3b8;}
        .pagination-info strong{color:#475569;font-weight:600;}
        .pagination-controls{display:flex;align-items:center;gap:4px;}
        .pg-btn{width:34px;height:34px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;color:#64748b;transition:all 0.15s;}
        .pg-btn:hover:not(:disabled){border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .pg-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .footer-actions{display:flex;justify-content:flex-end;gap:12px;}
        .btn-cancel{padding:11px 28px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;font-size:13.5px;font-weight:500;font-family:'DM Sans',sans-serif;}
        .btn-save{padding:11px 28px;border-radius:10px;border:none;background:#2db9a3;color:#fff;cursor:pointer;font-size:13.5px;font-weight:600;font-family:'DM Sans',sans-serif;box-shadow:0 2px 10px rgba(45,185,163,0.3);}
        .btn-save:disabled{opacity:0.6;cursor:not-allowed;}
        .btn-save:hover:not(:disabled){background:#28a593;}
        .readonly-badge{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:#64748b;background:#f1f5f9;padding:5px 12px;border-radius:20px;border:1px solid #e2e8f0;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="mfa-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="mfa-main">
          <TopBar title="Authentication" />
          <div className="mfa-scroll">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  {!isEditable && <span className="readonly-badge">👁 View Only</span>}
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a2332', margin: '0 0 4px' }}>MFA Settings</h1>
                <p style={{ fontSize: 13, color: '#8a9ab0', margin: 0 }}>
                  {isEditable ? 'Configure multi-factor authentication methods and per-role policies' : 'Read-only view of MFA configuration'}
                </p>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading MFA settings...</div>
            ) : (
              <>
                <div className="top-grid">
                  {/* Auth Methods */}
                  <div className="card">
                    <div className="card-title">
                      <div className="card-icon"><MessageSquare size={16} /></div>
                      Authentication Methods
                    </div>
                    {authMethods.map((m, i) => (
                      <div key={i} className="method-row">
                        <div className="method-icon" style={{ background: m.iconBg, color: m.accent }}>{m.icon}</div>
                        <div className="method-info"><h3>{m.label}</h3><p>{m.desc}</p></div>

                        {m.label === 'Authenticator App' ? (
                          // ✅ Authenticator App: toggle calls backend on both ON and OFF
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {authenticatorEnabled && (
                              <button
                                onClick={setupAuthenticator}
                                style={{ fontSize: 12, fontWeight: 600, color: '#2db9a3', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', textDecoration: 'underline' }}
                              >
                                Reconfigure
                              </button>
                            )}
                            <button
                              className={`toggle ${authenticatorEnabled ? 'on' : ''}`}
                              onClick={async () => {
                                if (!authenticatorEnabled) {
                                  // OFF → ON: open QR setup modal
                                  setupAuthenticator();
                                } else {
                                  // ON → OFF: call backend to set IsEnabled = false in DB
                                  await disableAuthenticator();
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="toggle-thumb" />
                            </button>
                          </div>
                        ) : (
                          // SMS and Email: normal toggles
                          <button
                            className={`toggle ${m.value ? 'on' : ''}`}
                            onClick={() => isEditable && m.toggle()}
                            style={{ cursor: isEditable ? 'pointer' : 'not-allowed', opacity: isEditable ? 1 : 0.5 }}
                          >
                            <div className="toggle-thumb" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* OTP Config */}
                  <div className="card">
                    <div className="card-title">
                      <div className="card-icon"><Settings size={16} /></div>
                      OTP Configuration
                    </div>
                    <div className="field-group">
                      <label className="field-label">Code Expiry Time</label>
                      <CustomSelect
                        options={[{ value: '5', label: '5 minutes' }, { value: '10', label: '10 minutes' }, { value: '15', label: '15 minutes' }, { value: '30', label: '30 minutes' }]}
                        value={codeExpiry} onChange={setCodeExpiry} disabled={!isEditable}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Grace Logins (without MFA)</label>
                      <CustomSelect
                        options={[{ value: '0', label: 'Disabled' }, { value: '1', label: '1 login' }, { value: '3', label: '3 logins' }, { value: '5', label: '5 logins' }]}
                        value={graceLogins} onChange={setGraceLogins} disabled={!isEditable}
                      />
                    </div>
                    <div className="info-box">
                      <p>OTP Code Length: 6 digits</p>
                      <span>Standard 6-digit codes for all authentication methods</span>
                    </div>
                  </div>
                </div>

                {/* Role MFA Table */}
                <div className="table-card">
                  <div className="table-card-header">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>MFA Enforcement by Role</div>
                      <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>Changes update MfaEnabled on all users with that role</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2db9a3', background: 'rgba(45,185,163,0.1)', padding: '4px 12px', borderRadius: 20 }}>{roles.length} roles</span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Role</th>
                        <th>Users</th>
                        <th>MFA Requirement</th>
                        <th>Allowed Methods</th>
                        {isEditable && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map(role => {
                        const r = reqStyle[role.mfaRequirement] ?? reqStyle.Optional;
                        return (
                          <tr key={role.id}>
                            <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>{role.name}</td>
                            <td style={{ color: '#64748b', textAlign: 'center' }}>{role.userCount}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="badge" style={{ background: r.bg, color: r.color }}>
                                <span className="badge-dot" style={{ background: r.color }} />
                                {role.mfaRequirement || 'Optional'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontSize: 12, color: '#64748b' }}>{role.allowedMfaMethods || 'SMS,Email'}</span>
                            </td>
                            {isEditable && (
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  className="edit-icon-btn"
                                  onClick={() => {
                                    setEditingRole(role.id);
                                    setEditForm({ mfaRequirement: role.mfaRequirement || 'Optional', allowedMfaMethods: role.allowedMfaMethods || 'SMS,Email' });
                                  }}
                                  title="Edit MFA settings"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {paged.length === 0 && (
                        <tr><td colSpan={isEditable ? 5 : 4} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>No roles found.</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="pagination-bar">
                    <span className="pagination-info">
                      Showing <strong>{roles.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}–{Math.min(safePage * itemsPerPage, roles.length)}</strong> of <strong>{roles.length}</strong> roles
                    </span>
                    <div className="pagination-controls">
                      <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={15} /></button>
                      <span className="pg-counter">{safePage} / {totalPages}</span>
                      <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={15} /></button>
                    </div>
                  </div>
                </div>

                {isEditable && (
                  <div className="footer-actions">
                    <button className="btn-cancel" onClick={fetchData}>Reset</button>
                    <button className="btn-save" disabled={saving} onClick={handleSaveConfig}>
                      {saving ? 'Saving...' : 'Save MFA Settings'}
                    </button>
                  </div>
                )}

                {/* Edit Role Modal */}
                {editingRole && isEditable && (
                  <div className="modal-overlay" onClick={() => setEditingRole(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                      <div className="modal-header">
                        <div className="modal-title">Edit MFA Configuration</div>
                        <button className="modal-close-btn" onClick={() => setEditingRole(null)}><X size={20} /></button>
                      </div>
                      <div className="modal-form-group">
                        <label className="modal-label">MFA Requirement</label>
                        <CustomSelect
                          options={[{ value: 'Required', label: 'Required' }, { value: 'Optional', label: 'Optional' }, { value: 'Disabled', label: 'Disabled' }]}
                          value={editForm.mfaRequirement}
                          onChange={val => setEditForm(f => ({ ...f, mfaRequirement: val }))}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label className="modal-label">Allowed MFA Methods</label>
                        <CustomSelect
  options={[
    { value: 'SMS',                    label: 'SMS only' },
    { value: 'Email',                  label: 'Email only' },
    { value: 'Authenticator',          label: 'Authenticator App only' },
    { value: 'SMS,Email',              label: 'SMS & Email' },
    { value: 'SMS,Authenticator',      label: 'SMS & Authenticator' },
    { value: 'Email,Authenticator',    label: 'Email & Authenticator' },
    { value: 'SMS,Email,Authenticator',label: 'All Methods' },
  ]}
  value={editForm.allowedMfaMethods}
  onChange={val => setEditForm(f => ({ ...f, allowedMfaMethods: val }))}
/>
                      </div>
                      <div className="modal-actions">
                        <button className="modal-cancel" onClick={() => setEditingRole(null)}>Cancel</button>
                        <button className="modal-save" onClick={() => handleSaveRole(editingRole)}>Save Changes</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Authenticator App Setup Modal */}
                {showAuthSetup && (
                  <div className="modal-overlay" onClick={() => setShowAuthSetup(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                      <div className="modal-header">
                        <div className="modal-title">Setup Authenticator App</div>
                        <button className="modal-close-btn" onClick={() => setShowAuthSetup(false)}><X size={20} /></button>
                      </div>
                     <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
  Scan this QR code with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong>, then enter the 6-digit code to confirm.
</p>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUri)}`}
                          alt="Authenticator QR Code"
                          style={{ borderRadius: 10, border: '1.5px solid #e2e8f0', width: 180, height: 180 }}
                        />
                      </div>
                      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 16, fontFamily: "'DM Mono',monospace", wordBreak: 'break-all' }}>
                        Manual key: {totpSecret}
                      </p>
                      <div className="modal-form-group">
                        <label className="modal-label">Enter 6-digit code from app</label>
                        <input
                          className="modal-input"
                          placeholder="000000"
                          maxLength={6}
                          value={totpCode}
                          onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={e => e.key === 'Enter' && totpCode.length === 6 && verifyAuthenticator()}
                          style={{ letterSpacing: '0.3em', fontSize: 20, textAlign: 'center' }}
                        />
                      </div>
                      <div className="modal-actions">
                        <button className="modal-cancel" onClick={() => setShowAuthSetup(false)}>Cancel</button>
                        <button
                          className="modal-save"
                          onClick={verifyAuthenticator}
                          disabled={verifying || totpCode.length !== 6}
                        >
                          {verifying ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                      </div>
                    </div>
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