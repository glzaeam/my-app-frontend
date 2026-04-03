'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Settings, AlertCircle, Shield, X, User, Clock, Globe, Plus } from 'lucide-react';

export default function LoginSettings() {
  const [activeMenu, setActiveMenu] = useState('login-settings');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [ipWhitelisting, setIpWhitelisting] = useState(true);
  const [geoRestriction, setGeoRestriction] = useState(false);
  const router = useRouter();

  const handleLogout = () => router.push('/');

  const loginHours = [
    { role: 'System Admin', hours: '24/7 Access', badge: 'full' },
    { role: 'Branch Manager', hours: '06:00 – 22:00', badge: 'standard' },
    { role: 'Auditor', hours: '06:00 – 22:00', badge: 'standard' },
    { role: 'Bank Teller', hours: '06:00 – 20:00', badge: 'restricted' },
  ];

  const ips = [
    { cidr: '10.0.0.0/8', label: 'Corporate Network' },
    { cidr: '192.168.1.0/24', label: 'HQ Branch' },
    { cidr: '172.16.0.0/12', label: 'VPN Range' },
  ];

  const badgeStyle = {
    full:       { color: '#059669', bg: '#dcfce7' },
    standard:   { color: '#2563eb', bg: '#dbeafe' },
    restricted: { color: '#d97706', bg: '#fef3c7' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ls-root {
          display: flex;
          height: 100vh;
          background: #ffffff;
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .ls-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* ── Topbar ── */
        .topbar {
          height: 66px;
          background: #fff;
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

        /* ── Scroll area ── */
        .main-content {
          flex: 1; overflow-y: auto; padding: 32px 36px;
          scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
        }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        /* ── Page Header ── */
        .page-header { margin-bottom: 28px; }
        .eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #2db9a3;
          background: rgba(45,185,163,0.08);
          padding: 4px 10px; border-radius: 20px; margin-bottom: 10px;
        }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 {
          font-size: 26px; font-weight: 800; color: #0f172a;
          margin-bottom: 4px; letter-spacing: -0.03em;
        }
        .page-header p { font-size: 14px; color: #94a3b8; font-weight: 400; }

        /* ── Cards Grid ── */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 18px;
          margin-bottom: 28px;
        }

        .card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
          transition: box-shadow 0.2s, border-color 0.2s;
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
          background: rgba(45,185,163,0.1); color: #2db9a3;
          flex-shrink: 0;
        }

        /* Select fields */
        .field-group { margin-bottom: 16px; }
        .field-group:last-child { margin-bottom: 0; }
        .field-label {
          font-size: 12px; font-weight: 700; color: #475569;
          text-transform: uppercase; letter-spacing: 0.07em;
          margin-bottom: 7px; display: block;
        }
        .field-select {
          width: 100%; padding: 10px 14px;
          border-radius: 10px; border: 1.5px solid #e2e8f0;
          font-size: 13.5px; color: #1e293b; background: #f8fafc;
          cursor: pointer; font-family: 'Open Sans', sans-serif;
          font-weight: 500; outline: none; transition: all 0.18s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }
        .field-select:focus { border-color: #2db9a3; background: #fff; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        /* Toggle rows */
        .toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
        .toggle-row:first-child { padding-top: 0; }
        .toggle-info h3 { font-size: 13.5px; font-weight: 600; color: #1e293b; margin-bottom: 3px; }
        .toggle-info p { font-size: 12px; color: #94a3b8; font-weight: 400; }

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

        /* Login hours rows */
        .hours-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0; border-bottom: 1px solid #f1f5f9;
        }
        .hours-row:last-child { border-bottom: none; padding-bottom: 0; }
        .hours-row:first-child { padding-top: 0; }
        .hours-role { font-size: 13.5px; font-weight: 600; color: #1e293b; }
        .hours-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 700;
          padding: 3px 10px; border-radius: 20px;
        }

        /* IP rows */
        .ip-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 11px 0; border-bottom: 1px solid #f1f5f9;
        }
        .ip-row:last-child { border-bottom: none; }
        .ip-info { display: flex; align-items: center; gap: 10px; }
        .ip-cidr {
          font-size: 12.5px; font-weight: 700; color: #0f172a;
          font-family: 'Menlo', 'Monaco', monospace;
          background: #f1f5f9; padding: 3px 8px; border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .ip-label { font-size: 12.5px; color: #64748b; font-weight: 500; }
        .ip-remove {
          width: 28px; height: 28px; border-radius: 8px;
          border: 1.5px solid #fee2e2; background: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #ef4444; transition: all 0.15s;
        }
        .ip-remove:hover { background: #fee2e2; border-color: #fca5a5; }

        .add-ip-btn {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 14px; font-size: 13px; font-weight: 700;
          color: #2db9a3; cursor: pointer; background: none; border: none;
          font-family: 'Open Sans', sans-serif;
          padding: 6px 0; transition: color 0.15s;
        }
        .add-ip-btn:hover { color: #1fa090; }

        /* ── Footer Actions ── */
        .footer-actions {
          display: flex; justify-content: flex-end; gap: 12px;
          padding-top: 4px;
        }
        .btn-cancel {
          padding: 11px 28px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: #fff;
          color: #64748b; cursor: pointer; font-size: 13.5px;
          font-weight: 600; font-family: 'Open Sans', sans-serif;
          transition: all 0.18s;
        }
        .btn-cancel:hover { border-color: #cbd5e1; background: #f8fafc; color: #475569; }
        .btn-save {
          padding: 11px 28px; border-radius: 10px;
          border: none; background: #2db9a3;
          color: #fff; cursor: pointer; font-size: 13.5px;
          font-weight: 700; font-family: 'Open Sans', sans-serif;
          transition: all 0.18s;
          box-shadow: 0 2px 10px rgba(45,185,163,0.3);
        }
        .btn-save:hover { background: #28a593; box-shadow: 0 4px 16px rgba(45,185,163,0.4); transform: translateY(-1px); }

        @media (max-width: 768px) {
          .topbar { padding: 0 18px; }
          .main-content { padding: 18px; }
          .cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ls-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        />

        <div className="ls-content">
          {/* Topbar */}
          <div className="topbar">
            <span className="topbar-title">Login Settings</span>
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
                Configuration
              </div>
              <h1>Login Settings</h1>
              <p>Configure and manage login authentication settings for your system.</p>
            </div>

            {/* Cards */}
            <div className="cards-grid">

              {/* Attempt Limits */}
              <div className="card">
                <div className="card-title">
                  <div className="card-title-icon"><AlertCircle size={16} /></div>
                  Attempt Limits
                </div>
                <div className="field-group">
                  <label className="field-label">Max Failed Attempts Before Lockout</label>
                  <select className="field-select" defaultValue="5">
                    <option value="3">3 attempts</option>
                    <option value="5">5 attempts</option>
                    <option value="10">10 attempts</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Account Lockout Duration</label>
                  <select className="field-select" defaultValue="30">
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="1440">24 hours</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Show CAPTCHA After Failed Attempts</label>
                  <select className="field-select" defaultValue="3">
                    <option value="1">After 1 attempt</option>
                    <option value="3">After 3 attempts</option>
                    <option value="5">After 5 attempts</option>
                    <option value="0">Disable</option>
                  </select>
                </div>
              </div>

              {/* Login Behavior */}
              <div className="card">
                <div className="card-title">
                  <div className="card-title-icon"><Shield size={16} /></div>
                  Login Behavior
                </div>
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h3>Remember Me Option</h3>
                    <p>Allow users to stay logged in across sessions</p>
                  </div>
                  <button className={`toggle ${rememberMe ? 'on' : ''}`} onClick={() => setRememberMe(v => !v)}>
                    <div className="toggle-thumb" />
                  </button>
                </div>
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h3>IP Whitelisting</h3>
                    <p>Restrict login to pre-approved IP addresses</p>
                  </div>
                  <button className={`toggle ${ipWhitelisting ? 'on' : ''}`} onClick={() => setIpWhitelisting(v => !v)}>
                    <div className="toggle-thumb" />
                  </button>
                </div>
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h3>Geo-Restriction</h3>
                    <p>Block logins from outside allowed regions</p>
                  </div>
                  <button className={`toggle ${geoRestriction ? 'on' : ''}`} onClick={() => setGeoRestriction(v => !v)}>
                    <div className="toggle-thumb" />
                  </button>
                </div>
              </div>

              {/* Login Hours */}
              <div className="card">
                <div className="card-title">
                  <div className="card-title-icon"><Clock size={16} /></div>
                  Login Hours
                </div>
                {loginHours.map((row, i) => {
                  const b = badgeStyle[row.badge as keyof typeof badgeStyle];
                  return (
                    <div className="hours-row" key={i}>
                      <span className="hours-role">{row.role}</span>
                      <span className="hours-badge" style={{ color: b.color, background: b.bg }}>
                        {row.hours}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Whitelisted IPs */}
              <div className="card">
                <div className="card-title">
                  <div className="card-title-icon"><Globe size={16} /></div>
                  Whitelisted IPs
                </div>
                {ips.map((ip, i) => (
                  <div className="ip-row" key={i}>
                    <div className="ip-info">
                      <span className="ip-cidr">{ip.cidr}</span>
                      <span className="ip-label">{ip.label}</span>
                    </div>
                    <button className="ip-remove" title="Remove">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button className="add-ip-btn">
                  <Plus size={14} />
                  Add IP Range
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="footer-actions">
              <button className="btn-cancel">Cancel</button>
              <button className="btn-save">Save Settings</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}