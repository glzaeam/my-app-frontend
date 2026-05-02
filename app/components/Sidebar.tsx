'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut, ChevronRight, LayoutDashboard, Lock, Users, Key, Eye, FileText,
  Settings, Shield, Layers, AlertCircle, Activity, ArrowRight,
  Download, UserPlus, UserMinus, Users2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function getHDImageUrl(url: string | null | undefined, size = 400): string | null {
  if (!url) return null;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto:best,f_auto/`);
}

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen?: (open: boolean) => void;
  onLogout: () => void;
}

// Each id must match exactly the module Name in your Modules DB table
const allMenuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    submenu: null,
  },
  {
    id: 'authentication',
    label: 'Authentication',
    icon: Lock,
    submenu: [
      { id: 'login-settings',   label: 'Login Settings',   icon: Settings    },
      { id: 'mfa-settings',     label: 'MFA Settings',     icon: Shield      },
      { id: 'session-settings', label: 'Session Settings', icon: Users       },
      { id: 'password-policy',  label: 'Password Policy',  icon: Key         },
      { id: 'login-attempts',   label: 'Login Attempts',   icon: AlertCircle },
    ],
  },
  {
    id: 'role-management',
    label: 'Role Management',
    icon: Users,
    submenu: [
      { id: 'all-roles',      label: 'All Roles',      icon: Layers },
      { id: 'assign-role',    label: 'Assign Role',    icon: Users2 },
      { id: 'role-hierarchy', label: 'Role Hierarchy', icon: Layers },
    ],
  },
  {
    id: 'permissions',
    label: 'Permissions',
    icon: Key,
    submenu: [
      { id: 'permission-matrix', label: 'Permission Matrix', icon: Layers },
      { id: 'module-access',     label: 'Module Access',     icon: Lock   },
    ],
  },
  {
    id: 'security-monitoring',
    label: 'Security Monitoring',
    icon: Eye,
    submenu: [
      { id: 'live-alerts',         label: 'Live Alerts',         icon: AlertCircle },
      { id: 'failed-logins',       label: 'Failed Logins',       icon: AlertCircle },
      { id: 'suspicious-activity', label: 'Suspicious Activity', icon: Eye         },
      { id: 'device-tracking',     label: 'Device Tracking',     icon: Users       },
    ],
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    icon: FileText,
    submenu: [
      { id: 'activity-logs',     label: 'Activity Logs',     icon: Activity   },
      { id: 'transaction-trail', label: 'Transaction Trail', icon: ArrowRight },
      { id: 'export-reports',    label: 'Export Reports',    icon: Download   },
    ],
  },
  {
    id: 'users-accounts',
    label: 'Users & Accounts',
    icon: Users,
    submenu: [
      { id: 'access-requests', label: 'Access Requests', icon: UserPlus  },
      { id: 'user-accounts',   label: 'User Accounts',   icon: Users     },
      { id: 'deactivate-user', label: 'Deactivate User', icon: UserMinus },
    ],
  },
];

const routeMap: Record<string, string> = {
  'dashboard':           '/dashboard',
  'login-settings':      '/authentication/login-settings',
  'mfa-settings':        '/authentication/mfa-settings',
  'session-settings':    '/authentication/session-settings',
  'password-policy':     '/authentication/password-policy',
  'login-attempts':      '/authentication/login-attempts',
  'all-roles':           '/role-management/all-roles',
  'assign-role':         '/role-management/assign-role',
  'role-hierarchy':      '/role-management/role-hierarchy',
  'permission-matrix':   '/permissions/permission-matrix',
  'module-access':       '/permissions/module-access',
  'live-alerts':         '/security-monitoring/live-alerts',
  'failed-logins':       '/security-monitoring/failed-logins',
  'suspicious-activity': '/security-monitoring/suspicious-activity',
  'device-tracking':     '/security-monitoring/device-tracking',
  'activity-logs':       '/audit-logs/activity-logs',
  'transaction-trail':   '/audit-logs/transaction-trail',
  'export-reports':      '/audit-logs/export-reports',
  'access-requests':     '/users-accounts/access-requests',
  'user-accounts':       '/users-accounts/user-accounts',
  'deactivate-user':     '/users-accounts/deactivate-user',
};

export default function Sidebar({ activeMenu, setActiveMenu, sidebarOpen, setSidebarOpen, onLogout }: SidebarProps) {
  const router = useRouter();
  const { user, hasAccess } = useAuth(); // ✅ reads from DB permissions

  // ✅ Filter parent items — only show if user has access to that module id
  const menuItems = allMenuItems.filter(item => hasAccess(item.id));

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of menuItems) {
      if (item.submenu?.some(s => s.id === activeMenu)) {
        initial.add(item.id);
      }
    }
    return initial;
  });

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleParentClick = (id: string, hasSubmenuItems: boolean) => {
    if (hasSubmenuItems) {
      toggleGroup(id);
    } else {
      setActiveMenu(id);
      const route = routeMap[id];
      if (route) router.push(route);
    }
  };

  const handleSubmenuClick = (submenuId: string) => {
    setActiveMenu(submenuId);
    const route = routeMap[submenuId];
    if (route) router.push(route);
  };

  const initials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <>
      <style>{`
        :root {
          --accent: #2db9a3;
          --accent-light: rgba(45,185,163,0.10);
          --accent-mid: rgba(45,185,163,0.18);
          --sidebar-bg: #ffffff;
          --sidebar-border: #e8edf3;
          --text-primary: #111827;
          --text-secondary: #6b7280;
          --text-muted: #9ca3af;
          --item-hover: #f1f5f9;
          --radius: 10px;
        }
        .sb-wrap {
          width: 268px; height: 100vh;
          display: flex; flex-direction: column;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--sidebar-border);
          font-family: var(--font-dm-sans, 'DM Sans', sans-serif);
          flex-shrink: 0; position: relative; z-index: 100;
          overflow: hidden;
          transition: width 0.25s ease, opacity 0.25s ease;
        }
        .sb-wrap.closed { width: 0; opacity: 0; pointer-events: none; }
        .sb-header { padding: 22px 20px 18px; border-bottom: 1px solid var(--sidebar-border); flex-shrink: 0; }
        .sb-header img { height: 36px; width: auto; display: block; }
        .sb-nav {
          flex: 1; overflow-y: auto; padding: 8px 10px 12px;
          display: flex; flex-direction: column; gap: 1px;
          scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
        }
        .sb-nav::-webkit-scrollbar { width: 3px; }
        .sb-nav::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
        .sb-parent {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: var(--radius);
          cursor: pointer; font-size: 13.5px; font-weight: 500;
          color: var(--text-secondary);
          transition: background 0.15s, color 0.15s;
          user-select: none; position: relative;
        }
        .sb-parent:hover { background: var(--item-hover); color: var(--text-primary); }
        .sb-parent.solo-active { background: var(--accent-light); color: var(--accent); font-weight: 600; }
        .sb-parent.solo-active::before {
          content: ''; position: absolute; left: 0; top: 50%;
          transform: translateY(-50%); width: 3px; height: 20px;
          background: var(--accent); border-radius: 0 3px 3px 0;
        }
        .sb-parent.has-active-child { color: var(--accent); font-weight: 600; }
        .sb-parent-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.85; }
        .sb-parent-label { flex: 1; line-height: 1; }
        .sb-chevron {
          width: 14px; height: 14px; flex-shrink: 0;
          color: var(--text-muted);
          transition: transform 0.22s ease, color 0.15s;
        }
        .sb-parent.open .sb-chevron { transform: rotate(90deg); color: var(--accent); }
        .sb-sub-wrap { overflow: hidden; max-height: 0; transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1); }
        .sb-sub-wrap.open { max-height: 500px; }
        .sb-sub-inner {
          margin: 2px 0 4px 26px; padding-left: 12px;
          border-left: 1.5px solid #e2e8f0;
          display: flex; flex-direction: column; gap: 1px;
        }
        .sb-sub-item {
          display: flex; align-items: center; gap: 9px;
          padding: 7.5px 10px; border-radius: 8px;
          cursor: pointer; font-size: 13px; font-weight: 500;
          color: var(--text-muted);
          transition: background 0.13s, color 0.13s;
          user-select: none;
        }
        .sb-sub-item:hover { background: var(--item-hover); color: var(--text-secondary); }
        .sb-sub-item.active { background: var(--accent-mid); color: var(--accent); font-weight: 600; }
        .sb-sub-icon { width: 13px; height: 13px; flex-shrink: 0; opacity: 0.8; }
        .sb-footer {
          border-top: 1px solid var(--sidebar-border);
          padding: 14px; display: flex; align-items: center; gap: 11px;
          flex-shrink: 0; background: #ffffff;
        }
        .sb-avatar {
          width: 38px; height: 38px; border-radius: 10px;
          background: linear-gradient(135deg, #2db9a3 0%, #6366f1 100%);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 13px;
          flex-shrink: 0; letter-spacing: 0.04em; overflow: hidden;
        }
        .sb-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }
        .sb-user { flex: 1; min-width: 0; }
        .sb-user-name {
          font-size: 13px; font-weight: 600; color: var(--text-primary);
          margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sb-user-role {
          font-size: 11.5px; color: var(--text-muted); margin: 2px 0 0;
          font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sb-logout {
          width: 34px; height: 34px; padding: 0;
          background: transparent; border: 1.5px solid var(--sidebar-border);
          border-radius: 9px; color: var(--text-muted);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.18s; flex-shrink: 0;
        }
        .sb-logout:hover { background: #fee2e2; border-color: #fecaca; color: #ef4444; }
        .sb-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 99; cursor: pointer; }
        @media (max-width: 768px) {
          .sb-wrap {
            position: fixed; top: 0; left: 0; height: 100%; z-index: 200;
            box-shadow: 6px 0 32px rgba(0,0,0,0.12);
            transition: transform 0.25s ease, opacity 0.25s ease;
          }
          .sb-wrap.closed { transform: translateX(-100%); width: 268px; opacity: 1; pointer-events: none; }
          .sb-overlay.visible { display: block; }
        }
      `}</style>

      {sidebarOpen && (
        <div className="sb-overlay visible" onClick={() => setSidebarOpen?.(false)} />
      )}

      <aside className={`sb-wrap ${!sidebarOpen ? 'closed' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="sb-header">
          <img src="/images/logo.png" alt="Nexum" />
        </div>

        <nav className="sb-nav">
          {menuItems.map(item => {
            const Icon           = item.icon;
            const hasSubmenuList = !!(item.submenu?.length);
            const isOpen         = openGroups.has(item.id);
            const hasActiveChild = hasSubmenuList && item.submenu!.some(s => s.id === activeMenu);
            const isSoloActive   = !hasSubmenuList && activeMenu === item.id;

            // ✅ Filter submenus by DB permissions too
            const visibleSubmenus = item.submenu?.filter(sub => hasAccess(sub.id)) ?? [];

            return (
              <div key={item.id}>
                <div
                  className={[
                    'sb-parent',
                    isSoloActive         ? 'solo-active'      : '',
                    hasActiveChild       ? 'has-active-child' : '',
                    isOpen && hasSubmenuList ? 'open'         : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleParentClick(item.id, hasSubmenuList)}
                >
                  <Icon size={16} className="sb-parent-icon" />
                  <span className="sb-parent-label">{item.label}</span>
                  {hasSubmenuList && <ChevronRight size={14} className="sb-chevron" />}
                </div>

                {hasSubmenuList && visibleSubmenus.length > 0 && (
                  <div className={`sb-sub-wrap ${isOpen ? 'open' : ''}`}>
                    <div className="sb-sub-inner">
                      {visibleSubmenus.map(sub => {
                        const SubIcon = sub.icon;
                        return (
                          <div
                            key={sub.id}
                            className={`sb-sub-item ${activeMenu === sub.id ? 'active' : ''}`}
                            onClick={() => handleSubmenuClick(sub.id)}
                          >
                            <SubIcon size={13} className="sb-sub-icon" />
                            <span>{sub.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sb-footer">
          <div className="sb-avatar">
            {user?.profileImageUrl
              ? <img src={getHDImageUrl(user.profileImageUrl, 150) || ''} alt={user.name} />
              : initials
            }
          </div>
          <div className="sb-user">
            <p className="sb-user-name">{user?.name || 'User'}</p>
            <p className="sb-user-role">{user?.role || 'Bank Teller'}</p>
          </div>
          <button className="sb-logout" onClick={onLogout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}