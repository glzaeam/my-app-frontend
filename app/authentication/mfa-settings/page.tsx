'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { Settings, MessageSquare, Mail, Smartphone, ChevronLeft, ChevronRight, ChevronDown, RefreshCw, Edit2, X } from 'lucide-react';
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

interface RoleRow {
  id: string;
  name: string;
  mfaRequirement: string;
  allowedMfaMethods: string | null;
  userCount: number;
}

export default function MFASettings() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]   = useState('mfa-settings');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Global config
  const [smsEnabled, setSmsEnabled]                   = useState(true);
  const [emailEnabled, setEmailEnabled]               = useState(true);
  const [authenticatorEnabled, setAuthenticatorEnabled] = useState(false);
  const [codeExpiry, setCodeExpiry]                   = useState('5');
  const [graceLogins, setGraceLogins]                 = useState('0');

  // Role MFA
  const [roles, setRoles]         = useState<RoleRow[]>([]);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editForm, setEditForm]   = useState({ mfaRequirement: 'Optional', allowedMfaMethods: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = auth.getToken();
      const [configRes, rolesRes] = await Promise.all([
        fetch(`${API}/mfa/config`,  { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/mfa/roles`,   { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const config = await configRes.json();
      const rolesData = await rolesRes.json();

      setSmsEnabled(config.smsEnabled ?? true);
      setEmailEnabled(config.emailEnabled ?? true);
      setAuthenticatorEnabled(config.authenticatorEnabled ?? false);
      setCodeExpiry(String(config.codeExpiryMinutes ?? 5));
      setGraceLogins(String(config.graceLogins ?? 0));
      setRoles(rolesData);
    } catch { setToast({ msg: 'Failed to load MFA settings', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/mfa/config`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({
          smsEnabled, emailEnabled, authenticatorEnabled,
          codeExpiryMinutes: parseInt(codeExpiry),
          graceLogins: parseInt(graceLogins),
        }),
      });
      const data = await res.json();
      if (data.success) setToast({ msg: 'MFA settings saved', type: 'success' });
      else setToast({ msg: data.message || 'Save failed', type: 'error' });
    } catch { setToast({ msg: 'Server error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleSaveRole = async (roleId: string) => {
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

  const totalPages = Math.max(1, Math.ceil(roles.length / itemsPerPage));
  const safePage   = Math.min(currentPage, totalPages);
  const paged      = roles.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const reqStyle: Record<string, { color: string; bg: string }> = {
    Required: { color: '#2563eb', bg: '#dbeafe' },
    Optional: { color: '#d97706', bg: '#fef3c7' },
    Disabled: { color: '#94a3b8', bg: '#f1f5f9' },
  };

  const authMethods = [
    { icon: <Smartphone size={18} />, label: 'SMS OTP',          desc: 'Send one-time codes via SMS',      value: smsEnabled,           toggle: () => setSmsEnabled(v => !v),           accent: '#2db9a3', iconBg: 'rgba(45,185,163,0.1)' },
    { icon: <Mail size={18} />,       label: 'Email OTP',         desc: 'Send one-time codes via email',    value: emailEnabled,         toggle: () => setEmailEnabled(v => !v),         accent: '#6366f1', iconBg: 'rgba(99,102,241,0.1)' },
    { icon: <Settings size={18} />,   label: 'Authenticator App', desc: 'Google / Microsoft Authenticator', value: authenticatorEnabled, toggle: () => setAuthenticatorEnabled(v => !v), accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)' },
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
        .card-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(45,185,163,0.1);color:#2db9a3;flex-shrink:0;}
        .method-row{display:flex;align-items:center;gap:14px;padding:13px 14px;border-radius:12px;border:1.5px solid #f1f5f9;margin-bottom:10px;background:#fafbfc;}
        .method-row:last-child{margin-bottom:0;}
        .method-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .method-info{flex:1;}
        .method-info h3{font-size:13.5px;font-weight:500;color:#0f172a;margin-bottom:2px;}
        .method-info p{font-size:12px;color:#94a3b8;}
        .toggle{width:46px;height:26px;border-radius:13px;background:#e2e8f0;position:relative;cursor:pointer;transition:background 0.25s;flex-shrink:0;border:none;outline:none;}
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
        .modal-select{width:100%;height:36px;padding:0 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;color:#0f172a;background:#fff;outline:none;cursor:pointer;position:relative;z-index:1001;}
        .modal-select:focus{border-color:#2db9a3;box-shadow:0 0 0 3px rgba(45,185,163,0.1);}
        .modal-select option{color:#0f172a;background:#fff;padding:8px;}
        .modal-input{width:100%;height:36px;padding:0 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;color:#0f172a;background:#fff;outline:none;}
        .modal-input:focus{border-color:#2db9a3;box-shadow:0 0 0 3px rgba(45,185,163,0.1);}
        .modal-actions{display:flex;gap:12px;justify-content:flex-end;}
        .modal-cancel{padding:10px 20px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;}
        .modal-cancel:hover{border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .modal-save{padding:10px 20px;border-radius:8px;border:none;background:#2db9a3;color:#fff;cursor:pointer;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;}
        .modal-save:hover{background:#28a593;}
        .pg-counter{min-width:50px;text-align:center;font-size:13px;color:#475569;font-weight:500;}
        .save-btn{padding:6px 14px;border-radius:8px;border:none;background:#2db9a3;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;color:#fff;cursor:pointer;}
        .cancel-btn{padding:6px 14px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;color:#64748b;cursor:pointer;}
        .inline-select{height:32px;padding:0 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;color:#1a2332;background:#fff;outline:none;cursor:pointer;}
        .inline-input{height:32px;padding:0 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;color:#1a2332;background:#fff;outline:none;width:180px;}
        .pagination-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-top:1px solid #f1f5f9;background:#fafbfc;}
        .pagination-info{font-size:13px;color:#94a3b8;}
        .pagination-info strong{color:#475569;font-weight:600;}
        .pagination-controls{display:flex;align-items:center;gap:4px;}
        .pg-btn{width:34px;height:34px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;color:#64748b;transition:all 0.15s;}
        .pg-btn:hover:not(:disabled){border-color:#2db9a3;color:#2db9a3;background:#f0fdf9;}
        .pg-btn:disabled{opacity:0.35;cursor:not-allowed;}
        .pg-btn.active{background:#2db9a3;border-color:#2db9a3;color:#fff;}
        .footer-actions{display:flex;justify-content:flex-end;gap:12px;}
        .btn-cancel{padding:11px 28px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;font-size:13.5px;font-weight:500;font-family:'DM Sans',sans-serif;}
        .btn-save{padding:11px 28px;border-radius:10px;border:none;background:#2db9a3;color:#fff;cursor:pointer;font-size:13.5px;font-weight:600;font-family:'DM Sans',sans-serif;box-shadow:0 2px 10px rgba(45,185,163,0.3);}
        .btn-save:disabled{opacity:0.6;cursor:not-allowed;}
        .btn-save:hover:not(:disabled){background:#28a593;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="mfa-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={() => { auth.clear(); router.push('/'); }} />
        <div className="mfa-main">
          <TopBar title="Authentication" />
          <div className="mfa-scroll">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2db9a3', background: 'rgba(45,185,163,0.08)', padding: '4px 10px', borderRadius: 20, marginBottom: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2db9a3' }} />Authentication
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a2332', margin: '0 0 4px' }}>MFA Settings</h1>
                <p style={{ fontSize: 13, color: '#8a9ab0', margin: 0 }}>Configure multi-factor authentication methods and per-role policies</p>
              </div>
              <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: '#64748b', cursor: 'pointer' }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading MFA settings...</div>
            ) : (
              <>
                <div className="top-grid">
                  {/* Auth Methods */}
                  <div className="card">
                    <div className="card-title"><div className="card-icon"><MessageSquare size={16} /></div>Authentication Methods</div>
                    {authMethods.map((m, i) => (
                      <div key={i} className="method-row">
                        <div className="method-icon" style={{ background: m.iconBg, color: m.accent }}>{m.icon}</div>
                        <div className="method-info"><h3>{m.label}</h3><p>{m.desc}</p></div>
                        <button className={`toggle ${m.value ? 'on' : ''}`} onClick={m.toggle}><div className="toggle-thumb" /></button>
                      </div>
                    ))}
                  </div>

                  {/* OTP Config */}
                  <div className="card">
                    <div className="card-title"><div className="card-icon"><Settings size={16} /></div>OTP Configuration</div>
                    <div className="field-group">
                      <label className="field-label">Code Expiry Time</label>
                      <CustomSelect
                        options={[{ value: '5', label: '5 minutes' }, { value: '10', label: '10 minutes' }, { value: '15', label: '15 minutes' }, { value: '30', label: '30 minutes' }]}
                        value={codeExpiry} onChange={setCodeExpiry}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Grace Logins (without MFA)</label>
                      <CustomSelect
                        options={[{ value: '0', label: 'Disabled' }, { value: '1', label: '1 login' }, { value: '3', label: '3 logins' }, { value: '5', label: '5 logins' }]}
                        value={graceLogins} onChange={setGraceLogins}
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
                      <tr><th>Role</th><th>Users</th><th>MFA Requirement</th><th>Allowed Methods</th><th>Actions</th></tr>
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
                          </tr>
                        );
                      })}
                      {paged.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>No roles found.</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="pagination-bar">
                    <span className="pagination-info">Showing <strong>{roles.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}–{Math.min(safePage * itemsPerPage, roles.length)}</strong> of <strong>{roles.length}</strong> roles</span>
                    <div className="pagination-controls">
                      <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={15} /></button>
                      <span className="pg-counter">{safePage} / {totalPages}</span>
                      <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={15} /></button>
                    </div>
                  </div>
                </div>

                <div className="footer-actions">
                  <button className="btn-cancel" onClick={fetchData}>Reset</button>
                  <button className="btn-save" disabled={saving} onClick={handleSaveConfig}>
                    {saving ? 'Saving...' : 'Save MFA Settings'}
                  </button>
                </div>

                {editingRole && (
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
                        <input 
                          className="modal-input" 
                          placeholder="e.g. SMS,Email,Authenticator" 
                          value={editForm.allowedMfaMethods} 
                          onChange={e => setEditForm(f => ({ ...f, allowedMfaMethods: e.target.value }))}
                        />
                      </div>
                      <div className="modal-actions">
                        <button className="modal-cancel" onClick={() => setEditingRole(null)}>Cancel</button>
                        <button className="modal-save" onClick={() => handleSaveRole(editingRole)}>Save Changes</button>
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
