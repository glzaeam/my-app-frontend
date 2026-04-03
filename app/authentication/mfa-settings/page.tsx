'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Settings, Shield, MessageSquare, Mail, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MFASettings() {
  const [activeMenu, setActiveMenu] = useState('mfa-settings');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [smsOtp, setSmsOtp] = useState(true);
  const [emailOtp, setEmailOtp] = useState(true);
  const [authenticatorApp, setAuthenticatorApp] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  const mfaEnforcementData = [
    { role: 'System Admin',     required: 'Yes',      methods: 'SMS, Email, Authenticator', status: 'Active' },
    { role: 'Branch Manager',   required: 'Yes',      methods: 'SMS, Email',                status: 'Active' },
    { role: 'Auditor',          required: 'Optional', methods: 'SMS, Email, Authenticator', status: 'Active' },
    { role: 'Bank Teller',      required: 'Optional', methods: 'SMS, Email',                status: 'Active' },
    { role: 'Customer Service', required: 'No',       methods: 'None',                      status: 'Inactive' },
    { role: 'Data Analyst',     required: 'Optional', methods: 'SMS, Email',                status: 'Active' },
    { role: 'Risk Officer',     required: 'Yes',      methods: 'SMS, Email, Authenticator', status: 'Active' },
  ];

  const totalPages = Math.ceil(mfaEnforcementData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMfaData = mfaEnforcementData.slice(startIndex, startIndex + itemsPerPage);

  const handleLogout = () => router.push('/');

  const authMethods = [
    {
      icon: <Smartphone size={18} />,
      label: 'SMS OTP',
      desc: 'Send one-time codes via SMS',
      value: smsOtp,
      toggle: () => setSmsOtp(v => !v),
      accent: '#2db9a3',
      iconBg: 'rgba(45,185,163,0.1)',
    },
    {
      icon: <Mail size={18} />,
      label: 'Email OTP',
      desc: 'Send one-time codes via email',
      value: emailOtp,
      toggle: () => setEmailOtp(v => !v),
      accent: '#6366f1',
      iconBg: 'rgba(99,102,241,0.1)',
    },
    {
      icon: <Settings size={18} />,
      label: 'Authenticator App',
      desc: 'Google / Microsoft Authenticator',
      value: authenticatorApp,
      toggle: () => setAuthenticatorApp(v => !v),
      accent: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.1)',
    },
  ];

  const requiredStyle = {
    Yes:      { color: '#2563eb', bg: '#dbeafe' },
    Optional: { color: '#d97706', bg: '#fef3c7' },
    No:       { color: '#94a3b8', bg: '#f1f5f9' },
  };

  const statusStyle = {
    Active:   { color: '#059669', bg: '#dcfce7', dot: '#10b981' },
    Inactive: { color: '#94a3b8', bg: '#f1f5f9', dot: '#cbd5e1' },
  };

  const moduleColorMap = {
    'SMS, Email, Authenticator': '#6366f1',
    'SMS, Email': '#2db9a3',
    'None': '#94a3b8',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .mfa-root {
          display: flex; height: 100vh;
          background: #ffffff; overflow: hidden;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .mfa-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* Topbar */
        .topbar {
          height: 66px; background: #fff;
          border-bottom: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .topbar-title { font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .notif-btn {
          width: 38px; height: 38px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #64748b; transition: all 0.18s; position: relative;
        }
        .notif-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .notif-dot {
          position: absolute; top: 8px; right: 8px;
          width: 7px; height: 7px; background: #ef4444;
          border-radius: 50%; border: 1.5px solid #fff;
        }
        .profile-pill {
          display: flex; align-items: center; gap: 10px;
          background: #f8fafc; border: 1.5px solid #e2e8f0;
          border-radius: 40px; padding: 5px 14px 5px 5px;
          cursor: pointer; transition: all 0.18s;
        }
        .profile-pill:hover { border-color: #2db9a3; background: #f0fdf9; }
        .profile-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #2db9a3 0%, #6366f1 100%);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 11px; font-weight: 800;
        }
        .profile-name { font-size: 13px; font-weight: 600; color: #1e293b; }

        /* Scroll */
        .main-content {
          flex: 1; overflow-y: auto; padding: 32px 36px;
          scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
        }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        /* Page Header */
        .page-header { margin-bottom: 28px; }
        .eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #2db9a3;
          background: rgba(45,185,163,0.08);
          padding: 4px 10px; border-radius: 20px; margin-bottom: 10px;
        }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.03em; }
        .page-header p { font-size: 14px; color: #94a3b8; font-weight: 400; }

        /* Top Grid */
        .top-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 18px;
          margin-bottom: 18px;
        }

        /* Card */
        .card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
          transition: box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.06); }

        .card-title {
          display: flex; align-items: center; gap: 10px;
          font-size: 14px; font-weight: 700; color: #0f172a;
          margin-bottom: 20px; letter-spacing: -0.01em;
        }
        .card-title-icon {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(45,185,163,0.1); color: #2db9a3; flex-shrink: 0;
        }

        /* Auth method rows */
        .method-row {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 14px; border-radius: 12px;
          border: 1.5px solid #f1f5f9; margin-bottom: 10px;
          background: #fafbfc; transition: all 0.18s; cursor: default;
        }
        .method-row:last-child { margin-bottom: 0; }
        .method-row:hover { border-color: var(--m-accent); background: #fff; }
        .method-row-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: var(--m-icon-bg); color: var(--m-accent); flex-shrink: 0;
        }
        .method-row-info { flex: 1; }
        .method-row-info h3 { font-size: 13.5px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .method-row-info p { font-size: 12px; color: #94a3b8; font-weight: 400; }

        /* Toggle */
        .toggle {
          width: 46px; height: 26px; border-radius: 13px;
          background: #e2e8f0; position: relative;
          cursor: pointer; transition: background 0.25s; flex-shrink: 0;
          border: none; outline: none;
        }
        .toggle.on { background: #2db9a3; }
        .toggle-thumb {
          width: 20px; height: 20px; border-radius: 50%; background: #fff;
          position: absolute; top: 3px; left: 3px;
          transition: left 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.18);
        }
        .toggle.on .toggle-thumb { left: 23px; }

        /* OTP Config selects */
        .field-group { margin-bottom: 16px; }
        .field-group:last-of-type { margin-bottom: 0; }
        .field-label {
          font-size: 12px; font-weight: 700; color: #475569;
          text-transform: uppercase; letter-spacing: 0.07em;
          margin-bottom: 7px; display: block;
        }
        .field-select {
          width: 100%; padding: 10px 14px;
          border-radius: 10px; border: 1.5px solid #e2e8f0;
          font-size: 13.5px; color: #1e293b; background: #f8fafc;
          cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500; outline: none; transition: all 0.18s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px;
        }
        .field-select:focus { border-color: #2db9a3; background: #fff; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        .info-box {
          margin-top: 16px;
          background: #f0fdf9;
          border: 1.5px solid #a7f3d0;
          border-radius: 10px;
          padding: 12px 16px;
        }
        .info-box p { font-size: 13px; font-weight: 600; color: #059669; }
        .info-box span { font-size: 12px; color: #34d399; font-weight: 400; display: block; margin-top: 2px; }

        /* Table section */
        .table-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }
        .table-card-header {
          padding: 20px 28px 16px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
        }
        .table-card-header h2 { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
        .table-card-header p { font-size: 12.5px; color: #94a3b8; margin-top: 2px; }
        .table-count-badge {
          font-size: 12px; font-weight: 700; color: #2db9a3;
          background: rgba(45,185,163,0.1); padding: 4px 12px; border-radius: 20px;
        }

        .mfa-table { width: 100%; border-collapse: collapse; }
        .mfa-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #f1f5f9; }
        .mfa-table thead th {
          padding: 11px 20px; text-align: center;
          font-size: 10.5px; font-weight: 800; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.09em; white-space: nowrap;
        }
        .mfa-table tbody tr { border-bottom: 1px solid #f8fafc; transition: background 0.13s; }
        .mfa-table tbody tr:last-child { border-bottom: none; }
        .mfa-table tbody tr:hover { background: #fafbfd; }
        .mfa-table tbody td { padding: 14px 20px; font-size: 13.5px; color: #1e293b; font-weight: 500; vertical-align: middle; text-align: center; }

        .role-name { font-weight: 700; color: #0f172a; }

        .req-badge, .status-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 20px;
          font-size: 12px; font-weight: 700; white-space: nowrap;
        }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        .methods-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600;
          padding: 3px 10px; border-radius: 6px;
        }
        .methods-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        /* Pagination */
        .pagination-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px; border-top: 1px solid #f1f5f9; background: #fafbfc;
        }
        .pagination-info { font-size: 13px; color: #94a3b8; font-weight: 500; }
        .pagination-info strong { color: #475569; font-weight: 700; }
        .pagination-controls { display: flex; align-items: center; gap: 4px; }
        .pg-btn {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: #64748b;
          font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.15s;
        }
        .pg-btn:hover:not(:disabled) { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pg-btn.active { background: #2db9a3; border-color: #2db9a3; color: #fff; box-shadow: 0 2px 10px rgba(45,185,163,0.35); }

        /* Footer */
        .footer-actions { display: flex; justify-content: flex-end; gap: 12px; }
        .btn-cancel {
          padding: 11px 28px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: #fff;
          color: #64748b; cursor: pointer; font-size: 13.5px; font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s;
        }
        .btn-cancel:hover { border-color: #cbd5e1; background: #f8fafc; color: #475569; }
        .btn-save {
          padding: 11px 28px; border-radius: 10px; border: none;
          background: #2db9a3; color: #fff; cursor: pointer;
          font-size: 13.5px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s;
          box-shadow: 0 2px 10px rgba(45,185,163,0.3);
        }
        .btn-save:hover { background: #28a593; box-shadow: 0 4px 16px rgba(45,185,163,0.4); transform: translateY(-1px); }

        @media (max-width: 768px) {
          .topbar { padding: 0 18px; }
          .main-content { padding: 18px; }
          .top-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="mfa-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />

        <div className="mfa-content">
          {/* Topbar */}
          <div className="topbar">
            <span className="topbar-title">MFA Settings</span>
            <div className="topbar-right">
              <button className="notif-btn">
                <Bell size={17} />
                <div className="notif-dot" />
              </button>
              <button
                onClick={() => router.push('/my-profile')}
                className="profile-pill"
                style={{ border: 'none' }}
              >
                <div className="profile-avatar">SJ</div>
                <span className="profile-name">Sarah Johnson</span>
              </button>
            </div>
          </div>

          {/* Main */}
          <div className="main-content">

            {/* Header */}
            <div className="page-header">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                Security
              </div>
              <h1>MFA Settings</h1>
              <p>Configure multi-factor authentication methods and policies for your system.</p>
            </div>

            {/* Top 2-col grid */}
            <div className="top-grid">

              {/* Auth Methods */}
              <div className="card">
                <div className="card-title">
                  <div className="card-title-icon"><MessageSquare size={16} /></div>
                  Authentication Methods
                </div>
                {authMethods.map((m, i) => (
                  <div
                    className="method-row"
                    key={i}
                    style={{ '--m-accent': m.accent, '--m-icon-bg': m.iconBg } as React.CSSProperties}
                  >
                    <div className="method-row-icon">{m.icon}</div>
                    <div className="method-row-info">
                      <h3>{m.label}</h3>
                      <p>{m.desc}</p>
                    </div>
                    <button className={`toggle ${m.value ? 'on' : ''}`} onClick={m.toggle}>
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                ))}
              </div>

              {/* OTP Config */}
              <div className="card">
                <div className="card-title">
                  <div className="card-title-icon"><Settings size={16} /></div>
                  OTP Configuration
                </div>
                <div className="field-group">
                  <label className="field-label">Code Expiry Time</label>
                  <select className="field-select" defaultValue="5">
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Grace Logins (without MFA)</label>
                  <select className="field-select" defaultValue="3">
                    <option value="1">1 login</option>
                    <option value="3">3 logins</option>
                    <option value="5">5 logins</option>
                    <option value="0">Disable</option>
                  </select>
                </div>
                <div className="info-box">
                  <p>OTP Code Length: 6 digits</p>
                  <span>Standard 6-digit codes for all authentication methods</span>
                </div>
              </div>

            </div>

            {/* Enforcement Table */}
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <h2>MFA Enforcement by Role</h2>
                  <p>Per-role authentication requirements and allowed methods</p>
                </div>
                <span className="table-count-badge">{mfaEnforcementData.length} roles</span>
              </div>

              <table className="mfa-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>MFA Required</th>
                    <th>Allowed Methods</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMfaData.map((row, idx) => {
                    const rStyle = requiredStyle[row.required as keyof typeof requiredStyle] || requiredStyle.No;
                    const sStyle = statusStyle[row.status as keyof typeof statusStyle] || statusStyle.Inactive;
                    const mColor = moduleColorMap[row.methods as keyof typeof moduleColorMap] || '#94a3b8';
                    return (
                      <tr key={idx}>
                        <td><span className="role-name">{row.role}</span></td>
                        <td>
                          <span className="req-badge" style={{ background: rStyle.bg, color: rStyle.color }}>
                            <span className="badge-dot" style={{ background: rStyle.color }} />
                            {row.required === 'Yes' ? 'Required' : row.required === 'No' ? 'Not Required' : 'Optional'}
                          </span>
                        </td>
                        <td>
                          <span className="methods-tag" style={{ background: mColor + '15', color: mColor }}>
                            <span className="methods-dot" style={{ background: mColor }} />
                            {row.methods}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge" style={{ background: sStyle.bg, color: sStyle.color }}>
                            <span className="badge-dot" style={{ background: sStyle.dot }} />
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing <strong>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, mfaEnforcementData.length)}</strong> of <strong>{mfaEnforcementData.length}</strong> roles
                </span>
                <div className="pagination-controls">
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} className={`pg-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  ))}
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer-actions">
              <button className="btn-cancel">Cancel</button>
              <button className="btn-save">Save MFA Settings</button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}