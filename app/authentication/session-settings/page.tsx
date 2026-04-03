'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Clock, Monitor, Users, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SessionSettings() {
  const [activeMenu, setActiveMenu] = useState('session-settings');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [forceLogout, setForceLogout] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  const activeSessions = [
    { user: 'Sarah Johnson',  role: 'System Admin',     device: 'Chrome / Windows',  ip: '192.168.1.45', started: '08:00', lastActive: '14:35' },
    { user: 'Michael Chen',   role: 'Branch Manager',   device: 'Safari / macOS',    ip: '10.0.12.88',  started: '09:15', lastActive: '14:28' },
    { user: 'Emily Davis',    role: 'Auditor',           device: 'Firefox / Windows', ip: '10.0.12.34',  started: '07:30', lastActive: '14:10' },
    { user: 'James Wilson',   role: 'Bank Teller',       device: 'Chrome / Windows',  ip: '10.0.8.15',   started: '10:00', lastActive: '13:55' },
    { user: 'Robert Lee',     role: 'Bank Teller',       device: 'Chrome / Windows',  ip: '10.0.0.45',   started: '11:20', lastActive: '11:25' },
    { user: 'Lisa Park',      role: 'Customer Service',  device: 'Edge / Windows',    ip: '10.0.5.67',   started: '06:45', lastActive: '14:32' },
  ];

  const totalPages = Math.ceil(activeSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = activeSessions.slice(startIndex, startIndex + itemsPerPage);
  const handleLogout = () => router.push('/');

  const deviceBrowserColor = (device: string) => {
    if (device.startsWith('Chrome'))  return { color: '#2db9a3', bg: 'rgba(45,185,163,0.1)' };
    if (device.startsWith('Safari'))  return { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
    if (device.startsWith('Firefox')) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { color: '#64748b', bg: '#f1f5f9' };
  };

  const userInitials = (name: string) => name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ss-root { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Plus Jakarta Sans', sans-serif; }
        .ss-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        .topbar { height: 66px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .topbar-title { font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .notif-btn { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.18s; position: relative; }
        .notif-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .notif-dot { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; background: #ef4444; border-radius: 50%; border: 1.5px solid #fff; }
        .profile-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 40px; padding: 5px 14px 5px 5px; cursor: pointer; transition: all 0.18s; }
        .profile-pill:hover { border-color: #2db9a3; background: #f0fdf9; }
        .profile-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #2db9a3 0%, #6366f1 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; }
        .profile-name { font-size: 13px; font-weight: 600; color: #1e293b; }

        .main-content { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        .page-header { margin-bottom: 28px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.03em; }
        .page-header p { font-size: 14px; color: #94a3b8; font-weight: 400; }

        .top-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; margin-bottom: 18px; }

        .card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 24px; transition: box-shadow 0.2s; }
        .card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.06); }
        .card-title { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 20px; letter-spacing: -0.01em; }
        .card-title-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(45,185,163,0.1); color: #2db9a3; flex-shrink: 0; }

        .field-group { margin-bottom: 16px; }
        .field-group:last-child { margin-bottom: 0; }
        .field-label { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px; display: block; }
        .field-desc { font-size: 12px; color: #94a3b8; margin-top: 5px; }
        .field-select { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 13.5px; color: #1e293b; background: #f8fafc; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; outline: none; transition: all 0.18s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
        .field-select:focus { border-color: #2db9a3; background: #fff; box-shadow: 0 0 0 3px rgba(45,185,163,0.1); }

        .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-top: 1px solid #f1f5f9; margin-top: 4px; }
        .toggle-info h3 { font-size: 13.5px; font-weight: 600; color: #1e293b; margin-bottom: 3px; }
        .toggle-info p { font-size: 12px; color: #94a3b8; }
        .toggle { width: 46px; height: 26px; border-radius: 13px; background: #e2e8f0; position: relative; cursor: pointer; transition: background 0.25s; flex-shrink: 0; border: none; outline: none; }
        .toggle.on { background: #2db9a3; }
        .toggle-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: left 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.18); }
        .toggle.on .toggle-thumb { left: 23px; }

        .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
        .table-card-header { padding: 20px 28px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; }
        .table-card-header-left h2 { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
        .table-card-header-left p { font-size: 12.5px; color: #94a3b8; margin-top: 2px; }
        .terminate-all-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: #ef4444; background: #fee2e2; border: 1.5px solid #fecaca; border-radius: 8px; padding: 6px 14px; cursor: pointer; transition: all 0.18s; font-family: 'Plus Jakarta Sans', sans-serif; }
        .terminate-all-btn:hover { background: #fecaca; border-color: #fca5a5; }

        .session-table { width: 100%; border-collapse: collapse; }
        .session-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #f1f5f9; }
        .session-table thead th { padding: 11px 20px; text-align: center; font-size: 10.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.09em; white-space: nowrap; }
        .session-table tbody tr { border-bottom: 1px solid #f8fafc; transition: background 0.13s; }
        .session-table tbody tr:last-child { border-bottom: none; }
        .session-table tbody tr:hover { background: #fafbfd; }
        .session-table tbody td { padding: 13px 20px; font-size: 13px; color: #1e293b; font-weight: 500; vertical-align: middle; text-align: center; }

        .user-cell { display: block; }
        .user-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #e0f2fe, #bae6fd); display: none; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 800; color: #0369a1; border: 1.5px solid #bae6fd; flex-shrink: 0; }
        .user-name { font-weight: 400; color: #0f172a; font-size: 13px; }
        .role-chip { display: inline-block; font-size: 11.5px; font-weight: 400; color: #475569; background: transparent; padding: 0; border-radius: 0; border: none; white-space: nowrap; }
        .device-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 400; padding: 0; border-radius: 0; white-space: nowrap; color: #475569; }
        .device-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; display: none; }
        .ip-mono { font-family: 'Menlo', 'Monaco', monospace; font-size: 12px; font-weight: 400; color: #475569; background: transparent; padding: 0; border-radius: 0; border: none; }
        .time-text { font-size: 12px; color: #94a3b8; font-weight: 400; white-space: nowrap; }
        .last-active-text { font-size: 12px; font-weight: 400; color: #475569; background: transparent; padding: 0; border-radius: 0; white-space: nowrap; }
        .terminate-btn { width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid #fee2e2; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #ef4444; transition: all 0.15s; margin: 0 auto; }
        .terminate-btn:hover { background: #fee2e2; border-color: #fca5a5; }

        .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-top: 1px solid #f1f5f9; background: #fafbfc; }
        .pagination-info { font-size: 13px; color: #94a3b8; font-weight: 500; }
        .pagination-info strong { color: #475569; font-weight: 700; }
        .pagination-controls { display: flex; align-items: center; gap: 4px; }
        .pg-btn { width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #64748b; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.15s; }
        .pg-btn:hover:not(:disabled) { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pg-btn.active { background: #2db9a3; border-color: #2db9a3; color: #fff; box-shadow: 0 2px 10px rgba(45,185,163,0.35); }

        .footer-actions { display: flex; justify-content: flex-end; gap: 12px; }
        .btn-cancel { padding: 11px 28px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; font-size: 13.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; }
        .btn-cancel:hover { border-color: #cbd5e1; background: #f8fafc; }
        .btn-save { padding: 11px 28px; border-radius: 10px; border: none; background: #2db9a3; color: #fff; cursor: pointer; font-size: 13.5px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s; box-shadow: 0 2px 10px rgba(45,185,163,0.3); }
        .btn-save:hover { background: #28a593; box-shadow: 0 4px 16px rgba(45,185,163,0.4); transform: translateY(-1px); }

        @media (max-width: 768px) { .topbar { padding: 0 18px; } .main-content { padding: 18px; } .top-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="ss-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        <div className="ss-content">
          <div className="topbar">
            <span className="topbar-title">Session Settings</span>
            <div className="topbar-right">
              <button className="notif-btn"><Bell size={17} /><div className="notif-dot" /></button>
              <button onClick={() => router.push('/my-profile')} className="profile-pill" style={{ border: 'none' }}>
                <div className="profile-avatar">SJ</div>
                <span className="profile-name">Sarah Johnson</span>
              </button>
            </div>
          </div>

          <div className="main-content">
            <div className="page-header">
              <div className="eyebrow"><span className="eyebrow-dot" />Configuration</div>
              <h1>Session Settings</h1>
              <p>Configure session timeouts and management policies for your system.</p>
            </div>

            <div className="top-grid">
              {/* Timeout Settings */}
              <div className="card">
                <div className="card-title">
                  <div className="card-title-icon"><Clock size={16} /></div>
                  Timeout Settings
                </div>
                <div className="field-group">
                  <label className="field-label">Idle Timeout</label>
                  <select className="field-select" defaultValue="15">
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                  <p className="field-desc">Auto-logout users after inactivity period</p>
                </div>
                <div className="field-group">
                  <label className="field-label">Max Session Duration</label>
                  <select className="field-select" defaultValue="8">
                    <option value="4">4 hours</option>
                    <option value="6">6 hours</option>
                    <option value="8">8 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                  </select>
                </div>
              </div>

              {/* Session Policies */}
              <div className="card">
                <div className="card-title">
                  <div className="card-title-icon"><Monitor size={16} /></div>
                  Session Policies
                </div>
                <div className="field-group">
                  <label className="field-label">Concurrent Sessions Allowed</label>
                  <select className="field-select" defaultValue="1">
                    <option value="1">1 session</option>
                    <option value="2">2 sessions</option>
                    <option value="3">3 sessions</option>
                    <option value="5">5 sessions</option>
                    <option value="0">Unlimited</option>
                  </select>
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
                <div className="table-card-header-left">
                  <h2>Active Sessions</h2>
                  <p>{activeSessions.length} sessions currently active</p>
                </div>
                <button className="terminate-all-btn">
                  <X size={13} /> Terminate All
                </button>
              </div>

              <table className="session-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Device</th>
                    <th>IP Address</th>
                    <th>Started</th>
                    <th>Last Active</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSessions.map((s, idx) => {
                    return (
                      <tr key={idx}>
                        <td>
                          <span className="user-name">{s.user}</span>
                        </td>
                        <td><span className="role-chip">{s.role}</span></td>
                        <td>
                          <span className="device-tag">
                            {s.device}
                          </span>
                        </td>
                        <td><span className="ip-mono">{s.ip}</span></td>
                        <td><span className="time-text">Today {s.started}</span></td>
                        <td><span className="last-active-text">Today {s.lastActive}</span></td>
                        <td>
                          <button className="terminate-btn" title="Terminate session"><X size={13} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing <strong>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, activeSessions.length)}</strong> of <strong>{activeSessions.length}</strong> sessions
                </span>
                <div className="pagination-controls">
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft size={15} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} className={`pg-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                  ))}
                  <button className="pg-btn" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight size={15} /></button>
                </div>
              </div>
            </div>

            <div className="footer-actions">
              <button className="btn-cancel">Cancel</button>
              <button className="btn-save">Save Session Settings</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}