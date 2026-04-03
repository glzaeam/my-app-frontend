'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, Lock, Unlock, Eye } from 'lucide-react';

const modules = [
  { name: 'Dashboard',           desc: 'System overview and metrics',                    access: { 'System Admin': 'full', 'Branch Manager': 'view',  'Auditor': 'view', 'Bank Teller': 'view' } },
  { name: 'Authentication',      desc: 'Login, MFA, session, password settings',         access: { 'System Admin': 'full', 'Branch Manager': 'edit',  'Auditor': 'view', 'Bank Teller': 'self' } },
  { name: 'Role Management',     desc: 'Create, edit, assign roles',                     access: { 'System Admin': 'full', 'Branch Manager': 'none',  'Auditor': 'none', 'Bank Teller': 'none' } },
  { name: 'Permissions',         desc: 'Permission matrix and module access',            access: { 'System Admin': 'full', 'Branch Manager': 'none',  'Auditor': 'none', 'Bank Teller': 'none' } },
  { name: 'Security Monitoring', desc: 'Alerts, failed logins, device tracking',         access: { 'System Admin': 'full', 'Branch Manager': 'view',  'Auditor': 'none', 'Bank Teller': 'none' } },
  { name: 'Audit Logs',          desc: 'Activity logs, transaction trail, exports',      access: { 'System Admin': 'full', 'Branch Manager': 'view',  'Auditor': 'view', 'Bank Teller': 'none' } },
  { name: 'Users & Accounts',    desc: 'User management and account control',            access: { 'System Admin': 'full', 'Branch Manager': 'none',  'Auditor': 'none', 'Bank Teller': 'none' } },
];

const roles = ['System Admin', 'Branch Manager', 'Auditor', 'Bank Teller'];

const roleAccents: Record<string, string> = {
  'System Admin':   '#2db9a3',
  'Branch Manager': '#6366f1',
  'Auditor':        '#f59e0b',
  'Bank Teller':    '#06b6d4',
};

const accessConfig: Record<string, { label: string; color: string; bg: string; dot: string; Icon: any }> = {
  full: { label: 'Full Access', color: '#059669', bg: '#dcfce7', dot: '#10b981', Icon: Unlock },
  edit: { label: 'Edit',        color: '#2db9a3', bg: '#f0fdf9', dot: '#2db9a3', Icon: Unlock },
  view: { label: 'View Only',   color: '#d97706', bg: '#fef3c7', dot: '#f59e0b', Icon: Eye    },
  self: { label: 'Self Only',   color: '#6366f1', bg: '#ede9fe', dot: '#8b5cf6', Icon: Eye    },
  none: { label: 'No Access',   color: '#94a3b8', bg: '#f1f5f9', dot: '#cbd5e1', Icon: Lock   },
};

export default function ModuleAccess() {
  const [activeMenu, setActiveMenu] = useState('module-access');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const handleLogout = () => router.push('/');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ma-root { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Plus Jakarta Sans', sans-serif; }
        .ma-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        .topbar { height: 66px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .topbar-title { font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .notif-btn { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.18s; position: relative; }
        .notif-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .notif-dot { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; background: #ef4444; border-radius: 50%; border: 1.5px solid #fff; }
        .profile-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 40px; padding: 5px 14px 5px 5px; cursor: pointer; transition: all 0.18s; }
        .profile-pill:hover { border-color: #2db9a3; background: #f0fdf9; }
        .profile-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#2db9a3,#6366f1); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 800; }
        .profile-name { font-size: 13px; font-weight: 600; color: #1e293b; }

        .main-content { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        .page-header { margin-bottom: 28px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.03em; }
        .page-header p { font-size: 14px; color: #94a3b8; }

        .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); margin-bottom: 20px; }

        .ma-table { width: 100%; border-collapse: collapse; }
        .ma-table thead tr:first-child { background: #f8fafc; border-bottom: 1.5px solid #f1f5f9; }
        .ma-table thead tr:first-child th { padding: 11px 18px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.09em; white-space: nowrap; color: #94a3b8; }
        .ma-table thead tr:first-child th:first-child { color: #94a3b8; text-align: left; min-width: 220px; }
        .th-role { text-align: center; font-weight: 800; font-size: 10.5px; }

        .ma-table tbody tr { border-bottom: 1px solid #f8fafc; transition: background 0.13s; }
        .ma-table tbody tr:last-child { border-bottom: none; }
        .ma-table tbody tr:hover { background: #fafbfd; }

        .ma-table tbody td { padding: 13px 18px; vertical-align: middle; font-size: 13px; color: #1e293b; font-weight: 500; }
        .ma-table tbody td:first-child { text-align: left; }
        .ma-table tbody td:not(:first-child) { text-align: center; }

        .module-name { font-size: 13.5px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
        .module-desc { font-size: 12px; color: #94a3b8; font-weight: 400; }

        .access-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap; }
        .access-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        /* Legend */
        .legend { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 16px 24px; border-top: 1px solid #f1f5f9; background: #fafbfc; }
        .legend-label { font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-right: 8px; }
        .legend-item { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }

        @media (max-width: 768px) { .topbar { padding: 0 18px; } .main-content { padding: 18px; } }
      `}</style>

      <div className="ma-root">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        <div className="ma-content">
          <div className="topbar">
            <span className="topbar-title">Module Access</span>
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
              <div className="eyebrow"><span className="eyebrow-dot" />Permissions</div>
              <h1>Module Access</h1>
              <p>Configure module-level access controls per role</p>
            </div>

            <div className="table-card">
              <table className="ma-table">
                <thead>
                  <tr>
                    <th style={{ color: '#94a3b8', textAlign: 'left' }}>Module</th>
                    {roles.map(r => (
                      <th key={r} className="th-role" style={{ color: roleAccents[r] }}>{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map(mod => (
                    <tr key={mod.name}>
                      <td>
                        <div className="module-name">{mod.name}</div>
                        <div className="module-desc">{mod.desc}</div>
                      </td>
                      {roles.map(role => {
                        const key = mod.access[role as keyof typeof mod.access] as string;
                        const cfg = accessConfig[key] || accessConfig.none;
                        return (
                          <td key={role}>
                            <span className="access-badge" style={{ background: cfg.bg, color: cfg.color }}>
                              <span className="access-dot" style={{ background: cfg.dot }} />
                              {cfg.label}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="legend">
                <span className="legend-label">Legend:</span>
                {Object.entries(accessConfig).map(([k, v]) => (
                  <span key={k} className="legend-item" style={{ background: v.bg, color: v.color }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: v.dot, display: 'inline-block', flexShrink: 0 }} />
                    {v.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}