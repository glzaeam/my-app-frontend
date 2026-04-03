'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Shield, Users, ChevronDown } from 'lucide-react';

export default function RoleHierarchy() {
  const [activeMenu, setActiveMenu] = useState('role-hierarchy');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const hierarchy = [
    {
      role: 'System Admin', level: 1, users: 2, accent: '#2db9a3', iconBg: 'rgba(45,185,163,0.1)',
      permissions: 'Full system access — all modules, all operations',
      canManage: ['Branch Manager', 'Auditor', 'Bank Teller'],
      modules: ['Dashboard', 'Authentication', 'Roles', 'Permissions', 'Security', 'Audit', 'Users'],
    },
    {
      role: 'Branch Manager', level: 2, users: 3, accent: '#6366f1', iconBg: 'rgba(99,102,241,0.1)',
      permissions: 'Branch-level oversight — monitoring and authentication management',
      canManage: ['Bank Teller'],
      modules: ['Dashboard', 'Authentication', 'Security Monitoring', 'Audit Logs'],
    },
    {
      role: 'Auditor', level: 3, users: 2, accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)',
      permissions: 'Read-only access to audit trails and authentication logs',
      canManage: [],
      modules: ['Dashboard', 'Authentication', 'Audit Logs (Read-Only)'],
    },
    {
      role: 'Bank Teller', level: 4, users: 4, accent: '#06b6d4', iconBg: 'rgba(6,182,212,0.1)',
      permissions: 'Basic access — dashboard and self-service authentication only',
      canManage: [],
      modules: ['Dashboard', 'Authentication'],
    },
  ];

  const handleLogout = () => router.push('/');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rh-root { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Plus Jakarta Sans', sans-serif; }
        .rh-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

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

        .page-header { margin-bottom: 32px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.03em; }
        .page-header p { font-size: 14px; color: #94a3b8; font-weight: 400; }

        /* Hierarchy layout */
        .hierarchy-list { display: flex; flex-direction: column; gap: 0; max-width: 860px; }

        /* Connector between cards */
        .connector { display: flex; align-items: center; gap: 10px; padding: 6px 0 6px 28px; margin-left: var(--indent); }
        .connector-line { display: flex; flex-direction: column; align-items: center; gap: 0; }
        .connector-dot-top { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); opacity: 0.4; }
        .connector-arrow { color: var(--accent); opacity: 0.6; margin: -2px 0; }
        .connector-dot-bot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); opacity: 0.8; }
        .connector-label { font-size: 11.5px; font-weight: 600; color: #94a3b8; }
        .connector-label span { color: var(--accent); font-weight: 700; }

        .hierarchy-item { margin-left: var(--indent); }

        .role-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 22px 24px; position: relative; overflow: hidden; }
        .role-card::before { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 4px; background: var(--accent); border-radius: 18px 0 0 18px; }

        .card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
        .card-left { display: flex; align-items: center; gap: 14px; }
        .role-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--icon-bg); color: var(--accent); flex-shrink: 0; }
        .role-name { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.02em; }
        .role-meta { display: flex; align-items: center; gap: 8px; }
        .level-badge { font-size: 11.5px; font-weight: 700; color: var(--accent); background: var(--icon-bg); padding: 2px 10px; border-radius: 20px; }
        .users-badge { display: flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 2px 10px; border-radius: 20px; }

        .role-desc { font-size: 13px; color: #64748b; line-height: 1.55; margin-bottom: 14px; }

        .modules-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .mod-tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: var(--icon-bg); color: var(--accent); white-space: nowrap; }

        .manages-section { display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; }
        .manages-label { font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; }
        .manages-chip { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: var(--icon-bg); color: var(--accent); white-space: nowrap; }

        .no-manage { font-size: 12px; color: #cbd5e1; font-style: italic; padding-top: 12px; border-top: 1px solid #f1f5f9; }

        @media (max-width: 768px) { .topbar { padding: 0 18px; } .main-content { padding: 18px; } .hierarchy-item, .connector { margin-left: 0 !important; } }
      `}</style>

      <div className="rh-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        <div className="rh-content">
          <div className="topbar">
            <span className="topbar-title">Role Hierarchy</span>
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
              <div className="eyebrow"><span className="eyebrow-dot" />Role Management</div>
              <h1>Role Hierarchy</h1>
              <p>View role levels, inheritance, and management scope</p>
            </div>

            <div className="hierarchy-list">
              {hierarchy.map((h, idx) => {
                const indent = idx * 28;
                return (
                  <div key={h.role}>
                    {idx > 0 && (
                      <div
                        className="connector"
                        style={{ '--indent': `${indent}px`, '--accent': hierarchy[idx].accent, marginLeft: indent } as React.CSSProperties}
                      >
                        <div className="connector-line">
                          <div className="connector-dot-top" />
                          <ChevronDown size={14} className="connector-arrow" style={{ color: hierarchy[idx].accent, opacity: 0.6 }} />
                          <div className="connector-dot-bot" />
                        </div>
                        <span className="connector-label">
                          Reports to <span>{hierarchy[idx - 1].role}</span>
                        </span>
                      </div>
                    )}

                    <div
                      className="hierarchy-item"
                      style={{ '--indent': `${indent}px`, marginLeft: indent } as React.CSSProperties}
                    >
                      <div
                        className="role-card"
                        style={{ '--accent': h.accent, '--icon-bg': h.iconBg } as React.CSSProperties}
                      >
                        <div className="card-top">
                          <div className="card-left">
                            <div className="role-icon"><Shield size={20} /></div>
                            <div>
                              <div className="role-name">{h.role}</div>
                              <div className="role-meta">
                                <span className="level-badge">Level {h.level}</span>
                                <span className="users-badge"><Users size={11} />{h.users} users</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="role-desc">{h.permissions}</p>

                        <div className="modules-wrap">
                          {h.modules.map(m => <span key={m} className="mod-tag">{m}</span>)}
                        </div>

                        {h.canManage.length > 0 ? (
                          <div className="manages-section">
                            <span className="manages-label">Can manage:</span>
                            {h.canManage.map(r => <span key={r} className="manages-chip">{r}</span>)}
                          </div>
                        ) : (
                          <p className="no-manage">No management scope</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}