'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Bell, User, Check } from 'lucide-react';

const modules = [
  'Dashboard',
  'Authentication',
  'Role Management',
  'Permissions',
  'Security Monitoring',
  'Audit Logs',
  'Users & Accounts',
];

const roles = ['System Admin', 'Branch Manager', 'Auditor', 'Bank Teller'];

const permissionData: Record<string, Record<string, { view: boolean; edit: boolean; delete: boolean }>> = {
  Dashboard:             { 'System Admin': { view:true,  edit:true,  delete:true  }, 'Branch Manager': { view:true,  edit:false, delete:false }, Auditor: { view:true,  edit:false, delete:false }, 'Bank Teller': { view:true,  edit:false, delete:false } },
  Authentication:        { 'System Admin': { view:true,  edit:true,  delete:true  }, 'Branch Manager': { view:true,  edit:true,  delete:false }, Auditor: { view:true,  edit:false, delete:false }, 'Bank Teller': { view:true,  edit:false, delete:false } },
  'Role Management':     { 'System Admin': { view:true,  edit:true,  delete:true  }, 'Branch Manager': { view:false, edit:false, delete:false }, Auditor: { view:false, edit:false, delete:false }, 'Bank Teller': { view:false, edit:false, delete:false } },
  Permissions:           { 'System Admin': { view:true,  edit:true,  delete:true  }, 'Branch Manager': { view:false, edit:false, delete:false }, Auditor: { view:false, edit:false, delete:false }, 'Bank Teller': { view:false, edit:false, delete:false } },
  'Security Monitoring': { 'System Admin': { view:true,  edit:true,  delete:true  }, 'Branch Manager': { view:true,  edit:false, delete:false }, Auditor: { view:false, edit:false, delete:false }, 'Bank Teller': { view:false, edit:false, delete:false } },
  'Audit Logs':          { 'System Admin': { view:true,  edit:true,  delete:true  }, 'Branch Manager': { view:true,  edit:false, delete:false }, Auditor: { view:true,  edit:false, delete:false }, 'Bank Teller': { view:false, edit:false, delete:false } },
  'Users & Accounts':    { 'System Admin': { view:true,  edit:true,  delete:true  }, 'Branch Manager': { view:false, edit:false, delete:false }, Auditor: { view:false, edit:false, delete:false }, 'Bank Teller': { view:false, edit:false, delete:false } },
};

export default function PermissionMatrix() {
  const [activeMenu,  setActiveMenu]  = useState('permission-matrix');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [permissions, setPermissions] = useState(permissionData);
  const router = useRouter();

  const togglePermission = (module: string, role: string, type: 'view' | 'edit' | 'delete') => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [role]: {
          ...prev[module][role],
          [type]: !prev[module][role][type]
        }
      }
    }));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pm-root    { display: flex; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Open Sans', sans-serif; }
        .pm-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* Topbar */
        .topbar { height: 66px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .topbar-title { font-size: 16px; font-weight: 600; color: #0f172a; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .notif-btn { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.18s; position: relative; }
        .notif-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .notif-dot { position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; background: #ef4444; border-radius: 50%; border: 1.5px solid #fff; }
        .profile-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 40px; padding: 5px 14px 5px 5px; cursor: pointer; transition: all 0.18s; }
        .profile-pill:hover { border-color: #2db9a3; background: #f0fdf9; }
        .profile-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #2db9a3, #6366f1); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; }
        .profile-name { font-size: 13px; font-weight: 500; color: #1e293b; }

        /* Main */
        .main-content { flex: 1; overflow-y: auto; padding: 32px 36px; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        /* Page header */
        .page-header { margin-bottom: 28px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #2db9a3; background: rgba(45,185,163,0.08); padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #2db9a3; }
        .page-header h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.02em; }
        .page-header p { font-size: 13px; color: #94a3b8; }

        /* Table card */
        .table-card {
          background: #fff;
          border: 1px solid #e8ecf2;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.05);
          overflow-x: auto;
        }

        /* ── Table ── */
        .pm-table { width: 100%; border-collapse: collapse; min-width: 860px; }

        /* Row 1: role group headers — teal uppercase bold, matching screenshot */
        .pm-table thead tr.row-roles { background: #f8fafc; }
        .pm-table thead tr.row-roles th {
          padding: 16px 10px 12px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
          border-bottom: 1px solid #edf0f5;
          font-family: 'Open Sans', sans-serif;
        }
        /* Module column header — grey */
        .pm-table thead tr.row-roles th.th-module {
          text-align: left;
          padding-left: 28px;
          color: #9aa5b4;
          min-width: 200px;
        }
        /* Role group headers — teal */
        .pm-table thead tr.row-roles th.th-role {
          color: #2db9a3;
        }

        /* Row 2: V / E / D sub-headers — light grey, small */
        .pm-table thead tr.row-sub { background: #f8fafc; }
        .pm-table thead tr.row-sub th {
          padding: 6px 10px 12px;
          text-align: center;
          font-size: 11px;
          font-weight: 400;
          color: #94a3b8;
          letter-spacing: 0.02em;
          border-bottom: 1.5px solid #edf0f5;
          font-family: 'Open Sans', sans-serif;
          white-space: nowrap;
        }
        .pm-table thead tr.row-sub th.th-module-empty {
          padding-left: 28px;
        }

        /* Vertical separator between role groups */
        .pm-table thead tr.row-roles th.sep-right,
        .pm-table thead tr.row-sub  th.sep-right,
        .pm-table tbody td.sep-right {
          border-right: 1px solid #edf0f5;
        }

        /* Body */
        .pm-table tbody tr { border-bottom: 1px solid #f0f3f7; transition: background 0.12s; }
        .pm-table tbody tr:last-child { border-bottom: none; }
        .pm-table tbody tr:hover { background: #fafbfc; }

        .pm-table tbody td {
          padding: 18px 10px;
          text-align: center;
          vertical-align: middle;
          font-family: 'Open Sans', sans-serif;
        }

        /* Module name cell — left-aligned, bold */
        .pm-table tbody td.td-module {
          text-align: left;
          padding-left: 28px;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
        }

        /* ── Permission circles ── */
        /* Granted: teal filled circle with white check — matching screenshot */
        .perm-yes {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: #2db9a3;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 1px 4px rgba(45,185,163,0.3);
          cursor: pointer;
          transition: all 0.2s;
        }
        .perm-yes:hover {
          background: #28a593;
          box-shadow: 0 2px 8px rgba(45,185,163,0.5);
          transform: scale(1.05);
        }

        /* Denied: light grey empty circle — matching screenshot */
        .perm-no {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: #e8edf3;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .perm-no:hover {
          background: #dce2ed;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .topbar { padding: 0 18px; }
          .main-content { padding: 18px; }
        }
      `}</style>

      <div className="pm-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={() => router.push('/')}
        />

        <div className="pm-content">
          {/* Topbar */}
          <div className="topbar">
            <span className="topbar-title">Permission Matrix</span>
            <div className="topbar-right">
              <button className="notif-btn">
                <Bell size={17} />
                <div className="notif-dot" />
              </button>
              <button onClick={() => router.push('/my-profile')} className="profile-pill" style={{ border: 'none' }}>
                <div className="profile-avatar">SJ</div>
                <span className="profile-name">Sarah Johnson</span>
              </button>
            </div>
          </div>

          {/* Main */}
          <div className="main-content">
            <div className="page-header">
              <div className="eyebrow"><span className="eyebrow-dot" />Permissions</div>
              <h1>Permission Matrix</h1>
              <p>Manage module access permissions by role</p>
            </div>

            <div className="table-card">
              <table className="pm-table">
                <thead>
                  {/* Row 1 — role group headers */}
                  <tr className="row-roles">
                    <th className="th-module">Module</th>
                    {roles.map((r, ri) => (
                      <th
                        key={r}
                        className={`th-role${ri < roles.length - 1 ? ' sep-right' : ''}`}
                        colSpan={3}
                      >
                        {r}
                      </th>
                    ))}
                  </tr>

                  {/* Row 2 — V / E / D sub-headers */}
                  <tr className="row-sub">
                    <th className="th-module-empty" />
                    {roles.map((r, ri) => (
                      <React.Fragment key={r}>
                        <th key={`${r}-v`}>View</th>
                        <th key={`${r}-e`}>Edit</th>
                        <th key={`${r}-d`} className={ri < roles.length - 1 ? 'sep-right' : ''}>Archive</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {modules.map(mod => (
                    <tr key={mod}>
                      <td className="td-module">{mod}</td>
                      {roles.map((role, ri) => {
                        const perms = permissions[mod][role];
                        const isLast = ri === roles.length - 1;
                        return (
                          <React.Fragment key={role}>
                            <td key={`${mod}-${role}-v`}>
                              <div 
                                className={perms.view ? 'perm-yes' : 'perm-no'}
                                onClick={() => togglePermission(mod, role, 'view')}
                              >
                                {perms.view && <Check size={14} strokeWidth={2.5} />}
                              </div>
                            </td>
                            <td key={`${mod}-${role}-e`}>
                              <div 
                                className={perms.edit ? 'perm-yes' : 'perm-no'}
                                onClick={() => togglePermission(mod, role, 'edit')}
                              >
                                {perms.edit && <Check size={14} strokeWidth={2.5} />}
                              </div>
                            </td>
                            <td key={`${mod}-${role}-d`} className={!isLast ? 'sep-right' : ''}>
                              <div 
                                className={perms.delete ? 'perm-yes' : 'perm-no'}
                                onClick={() => togglePermission(mod, role, 'delete')}
                              >
                                {perms.delete && <Check size={14} strokeWidth={2.5} />}
                              </div>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}