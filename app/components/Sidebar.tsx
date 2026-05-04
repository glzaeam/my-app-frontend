'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  LogOut, ChevronRight, LayoutDashboard, Lock, Users, Key, Eye, FileText,
  Settings, Shield, Layers, AlertCircle, Activity, ArrowRight,
  Download, UserPlus, UserMinus, Users2, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function getHDImageUrl(url: string | null | undefined, size = 400): string | null {
  if (!url) return null;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto:best,f_auto/`);
}

interface SidebarProps {
  activeMenu:      string;
  setActiveMenu:   (menu: string) => void;
  sidebarOpen:     boolean;
  setSidebarOpen?: (open: boolean) => void;
  onLogout:        () => void;
}

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, submenu: null },
  {
    id: 'authentication', label: 'Authentication', icon: Lock,
    submenu: [
      { id: 'login-settings',   label: 'Login Settings',   icon: Settings    },
      { id: 'mfa-settings',     label: 'MFA Settings',     icon: Shield      },
      { id: 'session-settings', label: 'Session Settings', icon: Users       },
      { id: 'password-policy',  label: 'Password Policy',  icon: Key         },
      { id: 'login-attempts',   label: 'Login Attempts',   icon: AlertCircle },
    ],
  },
  {
    id: 'role-management', label: 'Role Management', icon: Users,
    submenu: [
      { id: 'all-roles',      label: 'All Roles',      icon: Layers },
      { id: 'assign-role',    label: 'Assign Role',    icon: Users2 },
      { id: 'role-hierarchy', label: 'Role Hierarchy', icon: Layers },
    ],
  },
  {
    id: 'permissions', label: 'Permissions', icon: Key,
    submenu: [
      { id: 'permission-matrix', label: 'Permission Matrix', icon: Layers },
      { id: 'module-access',     label: 'Module Access',     icon: Lock   },
    ],
  },
  {
    id: 'security-monitoring', label: 'Security Monitoring', icon: Eye,
    submenu: [
      { id: 'live-alerts',         label: 'Live Alerts',         icon: AlertCircle },
      { id: 'failed-logins',       label: 'Failed Logins',       icon: AlertCircle },
      { id: 'suspicious-activity', label: 'Suspicious Activity', icon: Eye         },
      { id: 'device-tracking',     label: 'Device Tracking',     icon: Users       },
    ],
  },
  {
    id: 'audit-logs', label: 'Audit Logs', icon: FileText,
    submenu: [
      { id: 'activity-logs',     label: 'Activity Logs',     icon: Activity   },
      { id: 'transaction-trail', label: 'Transaction Trail', icon: ArrowRight },
      { id: 'export-reports',    label: 'Export Reports',    icon: Download   },
    ],
  },
  {
    id: 'users-accounts', label: 'Users & Accounts', icon: Users,
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
  const { user, hasAccess, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const menuItems = allMenuItems
    .map(item => {
      if (!item.submenu) return hasAccess(item.id) ? item : null;
      const visibleSubs = item.submenu.filter(sub => hasAccess(sub.id));
      return visibleSubs.length > 0 ? { ...item, submenu: visibleSubs } : null;
    })
    .filter(Boolean) as typeof allMenuItems;

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of menuItems) {
      if (item.submenu?.some(s => s.id === activeMenu)) initial.add(item.id);
    }
    return initial;
  });

  // Close drawer when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && setSidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleParentClick = (id: string, hasSubmenuItems: boolean) => {
    if (isCollapsed) { setIsCollapsed(false); return; }
    if (hasSubmenuItems) {
      toggleGroup(id);
    } else {
      setActiveMenu(id);
      const route = routeMap[id];
      if (route) router.push(route);
      if (setSidebarOpen) setSidebarOpen(false);
    }
  };

  const handleSubmenuClick = (submenuId: string) => {
    setActiveMenu(submenuId);
    const route = routeMap[submenuId];
    if (route) router.push(route);
    if (setSidebarOpen) setSidebarOpen(false);
  };

  const initials = user?.name
    ?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const sidebarContent = (
    <>
      <div className="sb-header">
        <div className="sb-logo-area">
          <img src="/images/logo.png" alt="Nexum" className="sb-logo" />
        </div>
        <button
          className="sb-toggle-btn sb-desktop-only"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="sb-nav">
        {menuItems.map(item => {
          const Icon           = item.icon;
          const hasSubmenuList = !!(item.submenu?.length);
          const isOpen         = openGroups.has(item.id);
          const hasActiveChild = hasSubmenuList && item.submenu!.some(s => s.id === activeMenu);
          const isSoloActive   = !hasSubmenuList && activeMenu === item.id;

          return (
            <div key={item.id}>
              <div
                className={[
                  'sb-parent',
                  isSoloActive             ? 'solo-active'      : '',
                  hasActiveChild           ? 'has-active-child' : '',
                  isOpen && hasSubmenuList ? 'open'             : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleParentClick(item.id, hasSubmenuList)}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={16} className="sb-parent-icon" />
                <span className="sb-parent-label">{item.label}</span>
                {hasSubmenuList && <ChevronRight size={14} className="sb-chevron" />}
              </div>

              {hasSubmenuList && item.submenu && (
                <div className={`sb-sub-wrap ${isOpen ? 'open' : ''}`}>
                  <div className="sb-sub-inner">
                    {item.submenu.map(sub => {
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
    </>
  );

  if (loading) {
    return (
      <aside className={`sb-wrap ${isCollapsed ? 'sb-collapsed' : ''}`}>
        <div className="sb-header">
          <div className="sb-logo-area">
            <img src="/images/logo.png" alt="Nexum" className="sb-logo" />
          </div>
          <button className="sb-toggle-btn sb-desktop-only" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <nav className="sb-nav" style={{ padding: '20px 16px', gap: 8 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 36, borderRadius: 10, background: '#f1f5f9', opacity: 1 - i * 0.1 }} />
          ))}
        </nav>
      </aside>
    );
  }

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
          --sb-full-width: 260px;
          --sb-icon-width: 68px;
        }
        .sb-wrap {
          width: var(--sb-full-width);
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--sidebar-border);
          font-family: 'DM Sans', sans-serif;
          flex-shrink: 0;
          overflow: hidden;
          transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
          position: sticky;
          top: 0;
          z-index: 95;
        }
        .sb-wrap.sb-collapsed { width: var(--sb-icon-width); }
        .sb-desktop-only { display: flex !important; }

        .sb-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
          z-index: 197;
        }
        .sb-backdrop.open { opacity: 1; pointer-events: auto; }

        .sb-mobile-drawer {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 280px;
          max-width: 85vw;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--sidebar-border);
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 198;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 2px 0 16px rgba(0,0,0,0.15);
        }
        .sb-mobile-drawer.open { transform: translateX(0); }

        .sb-header {
          height: 66px;
          padding: 0 14px;
          border-bottom: 1px solid var(--sidebar-border);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          overflow: hidden;
        }
        .sb-logo-area { flex: 1; overflow: hidden; display: flex; align-items: center; }
        .sb-logo { height: 34px; width: auto; display: block; transition: opacity 0.2s ease, width 0.25s ease; opacity: 1; }
        .sb-wrap.sb-collapsed .sb-logo { opacity: 0; width: 0; pointer-events: none; }

        .sb-toggle-btn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          background: transparent;
          border: 1.5px solid var(--sidebar-border);
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer; flex-shrink: 0;
          transition: all 0.18s; padding: 0;
        }
        .sb-toggle-btn:hover { background: var(--item-hover); color: var(--text-primary); border-color: #cbd5e1; }
        .sb-wrap.sb-collapsed .sb-toggle-btn { margin: 0 auto; }

        .sb-nav {
          flex: 1; overflow-y: auto;
          padding: 8px 8px 12px;
          display: flex; flex-direction: column; gap: 2px;
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
          white-space: nowrap; overflow: hidden; min-height: 40px;
        }
        .sb-wrap.sb-collapsed .sb-parent { padding: 10px; justify-content: center; gap: 0; }
        .sb-parent:hover { background: var(--item-hover); color: var(--text-primary); }
        .sb-parent.solo-active { background: var(--accent-light); color: var(--accent); font-weight: 600; }
        .sb-parent.solo-active::before {
          content: ''; position: absolute; left: 0; top: 50%;
          transform: translateY(-50%); width: 3px; height: 20px;
          background: var(--accent); border-radius: 0 3px 3px 0;
        }
        .sb-wrap.sb-collapsed .sb-parent.solo-active::before { display: none; }
        .sb-parent.has-active-child { color: var(--accent); font-weight: 600; }
        .sb-parent-icon { width: 17px; height: 17px; flex-shrink: 0; }
        .sb-parent-label { flex: 1; line-height: 1; transition: opacity 0.15s ease; }
        .sb-wrap.sb-collapsed .sb-parent-label { display: none; }
        .sb-chevron { width: 14px; height: 14px; flex-shrink: 0; color: var(--text-muted); transition: transform 0.22s ease; }
        .sb-wrap.sb-collapsed .sb-chevron { display: none; }
        .sb-parent.open .sb-chevron { transform: rotate(90deg); color: var(--accent); }

        .sb-sub-wrap { overflow: hidden; max-height: 0; transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1); }
        .sb-wrap.sb-collapsed .sb-sub-wrap { display: none; }
        .sb-sub-wrap.open { max-height: 500px; }
        .sb-sub-inner { margin: 2px 0 4px 24px; padding-left: 14px; border-left: 1.5px solid #e2e8f0; display: flex; flex-direction: column; gap: 1px; }
        .sb-sub-item {
          display: flex; align-items: center; gap: 9px;
          padding: 7px 10px; border-radius: 8px;
          cursor: pointer; font-size: 13px; font-weight: 500;
          color: var(--text-muted);
          transition: background 0.13s, color 0.13s; user-select: none;
        }
        .sb-sub-item:hover { background: var(--item-hover); color: var(--text-secondary); }
        .sb-sub-item.active { background: var(--accent-mid); color: var(--accent); font-weight: 600; }
        .sb-sub-icon { width: 13px; height: 13px; flex-shrink: 0; opacity: 0.8; }

        .sb-footer {
          border-top: 1px solid var(--sidebar-border);
          padding: 12px 14px;
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0; background: #fff; overflow: hidden;
        }
        .sb-wrap.sb-collapsed .sb-footer { padding: 12px 8px; justify-content: center; }
        .sb-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #2db9a3 0%, #6366f1 100%);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 13px;
          flex-shrink: 0; overflow: hidden;
        }
        .sb-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }
        .sb-user { flex: 1; min-width: 0; }
        .sb-wrap.sb-collapsed .sb-user { display: none; }
        .sb-user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sb-user-role { font-size: 11px; color: var(--text-muted); margin: 2px 0 0; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sb-logout {
          width: 32px; height: 32px; padding: 0;
          background: transparent; border: 1.5px solid var(--sidebar-border);
          border-radius: 8px; color: var(--text-muted);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.18s; flex-shrink: 0;
        }
        .sb-logout:hover { background: #fee2e2; border-color: #fecaca; color: #ef4444; }

        @media (max-width: 1279px) { :root { --sb-full-width: 240px; } }
        @media (max-width: 1023px) {
          :root { --sb-full-width: 220px; }
          .sb-parent { font-size: 13px; }
          .sb-sub-item { font-size: 12.5px; }
        }
        @media (max-width: 767px) {
          .sb-wrap { display: none !important; }
          .sb-desktop-only { display: none !important; }
          .sb-parent { font-size: 13.5px; min-height: 44px; }
          .sb-sub-item { font-size: 13px; min-height: 40px; }
        }
      `}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={`sb-wrap ${isCollapsed ? 'sb-collapsed' : ''}`}>
        {sidebarContent}
      </aside>

      {/* ── MOBILE DRAWER: renders at document.body via portal ── */}
      {mounted && createPortal(
        <>
          <div
            className={`sb-backdrop ${sidebarOpen ? 'open' : ''}`}
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div
            className={`sb-mobile-drawer ${sidebarOpen ? 'open' : ''}`}
            role="dialog"
            aria-modal="true"
          >
            {sidebarContent}
          </div>
        </>,
        document.body
      )}
    </>
  );
}