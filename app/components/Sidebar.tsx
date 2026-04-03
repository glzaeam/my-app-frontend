'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, LayoutDashboard, Lock, Users, Key, Eye, FileText, Settings, Shield, Users2, Layers, AlertCircle, Activity, ArrowRight, Download, UserPlus, UserMinus } from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen?: (open: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeMenu, setActiveMenu, sidebarOpen, setSidebarOpen, onLogout }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['dashboard']));
  const router = useRouter();

  const routeMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'login-settings': '/authentication/login-settings',
    'mfa-settings': '/authentication/mfa-settings',
    'session-settings': '/authentication/session-settings',
    'password-policy': '/authentication/password-policy',
    'login-attempts': '/authentication/login-attempts',
    'all-roles': '/role-management/all-roles',
    'assign-role': '/role-management/assign-role',
    'role-hierarchy': '/role-management/role-hierarchy',
    'permission-matrix': '/permissions/permission-matrix',
    'module-access': '/permissions/module-access',
    'live-alerts': '/security-monitoring/live-alerts',
    'failed-logins': '/security-monitoring/failed-logins',
    'suspicious-activity': '/security-monitoring/suspicious-activity',
    'device-tracking': '/security-monitoring/device-tracking',
    'activity-logs': '/audit-logs/activity-logs',
    'transaction-trail': '/audit-logs/transaction-trail',
    'export-reports': '/audit-logs/export-reports',
    'user-accounts': '/users-accounts/user-accounts',
    'add-user': '/users-accounts/add-user',
    'deactivate-user': '/users-accounts/deactivate-user',
    'my-profile': '/my-profile',
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, submenu: null },
    {
      id: 'authentication', label: 'Authentication', icon: Lock,
      submenu: [
        { id: 'login-settings',  label: 'Login Settings',  icon: Settings },
        { id: 'mfa-settings',    label: 'MFA Settings',    icon: Shield },
        { id: 'session-settings',label: 'Session Settings',icon: Users },
        { id: 'password-policy', label: 'Password Policy', icon: Key },
        { id: 'login-attempts',  label: 'Login Attempts',  icon: AlertCircle },
      ]
    },
    {
      id: 'role-management', label: 'Role Management', icon: Users,
      submenu: [
        { id: 'all-roles',      label: 'All Roles',      icon: Layers },
        { id: 'assign-role',    label: 'Assign Role',    icon: Users2 },
        { id: 'role-hierarchy', label: 'Role Hierarchy', icon: Layers },
      ]
    },
    {
      id: 'permissions', label: 'Permissions', icon: Key,
      submenu: [
        { id: 'permission-matrix', label: 'Permission Matrix', icon: Layers },
        { id: 'module-access',     label: 'Module Access',     icon: Lock },
      ]
    },
    {
      id: 'security-monitoring', label: 'Security Monitoring', icon: Eye,
      submenu: [
        { id: 'live-alerts',         label: 'Live Alerts',         icon: AlertCircle },
        { id: 'failed-logins',       label: 'Failed Logins',       icon: AlertCircle },
        { id: 'suspicious-activity', label: 'Suspicious Activity', icon: Eye },
        { id: 'device-tracking',     label: 'Device Tracking',     icon: Users },
      ]
    },
    {
      id: 'audit-logs', label: 'Audit Logs', icon: FileText,
      submenu: [
        { id: 'activity-logs',    label: 'Activity Logs',    icon: Activity },
        { id: 'transaction-trail',label: 'Transaction Trail',icon: ArrowRight },
        { id: 'export-reports',   label: 'Export Reports',   icon: Download },
      ]
    },
    {
      id: 'users-accounts', label: 'Users & Accounts', icon: Users,
      submenu: [
        { id: 'user-accounts',   label: 'User Accounts',   icon: Users },
        { id: 'add-user',        label: 'Add User',        icon: UserPlus },
        { id: 'deactivate-user', label: 'Deactivate User', icon: UserMinus },
      ]
    },
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      next.has(menuId) ? next.delete(menuId) : next.add(menuId);
      return next;
    });
  };

  const handleMenuClick = (menuId: string, hasSubmenu: boolean) => {
    if (!hasSubmenu) {
      setActiveMenu(menuId);
      const route = routeMap[menuId];
      if (route) router.push(route);
    } else {
      toggleMenu(menuId);
    }
  };

  const handleSubmenuClick = (submenuId: string) => {
    setActiveMenu(submenuId);
    const route = routeMap[submenuId];
    if (route) router.push(route);
    // Only close sidebar on mobile (≤768px)
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen?.(false);
    }
  };

  return (
    <>
      <style>{`
        .sidebar {
          width: 272px;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          padding: 20px 0 0;
          position: relative;
          z-index: 100;
          height: 100vh;
          overflow: hidden;
          flex-shrink: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .sidebar.closed {
          width: 0;
          padding: 0;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 0 20px 20px;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .sidebar-menu {
          flex: 1;
          overflow-y: auto;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }
        .sidebar-menu::-webkit-scrollbar { width: 4px; }
        .sidebar-menu::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

        .menu-section-label {
          font-size: 10px;
          font-weight: 800;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          padding: 10px 12px 4px;
        }

        .menu-item {
          padding: 10px 12px;
          border-radius: 9px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.18s;
          user-select: none;
          position: relative;
        }

        .menu-item:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        .menu-item.active {
          background: rgba(45, 185, 163, 0.08);
          color: #2db9a3;
          font-weight: 600;
        }

        .menu-item.parent-active {
          color: #2db9a3;
          font-weight: 600;
        }

        .menu-item-icon {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
          color: inherit;
          opacity: 0.85;
        }

        .menu-item-label { flex: 1; line-height: 1; }

        .menu-item-chevron {
          width: 15px;
          height: 15px;
          color: #cbd5e1;
          transition: transform 0.25s ease;
          flex-shrink: 0;
        }
        .menu-item.expanded .menu-item-chevron {
          transform: rotate(180deg);
          color: #2db9a3;
        }

        /* Active indicator dot */
        .menu-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 18px;
          background: #2db9a3;
          border-radius: 0 3px 3px 0;
        }

        /* Submenu */
        .submenu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.28s ease;
        }
        .submenu.open { max-height: 600px; }

        .submenu-inner {
          padding: 2px 0 4px 12px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          border-left: 1.5px solid #f1f5f9;
          margin-left: 20px;
        }

        .submenu-item {
          padding: 8px 10px;
          border-radius: 7px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          transition: all 0.15s;
          user-select: none;
        }

        .submenu-item:hover {
          background: #f8fafc;
          color: #475569;
        }

        .submenu-item.active {
          background: rgba(45, 185, 163, 0.08);
          color: #2db9a3;
          font-weight: 600;
        }

        .submenu-item-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          color: inherit;
          opacity: 0.8;
        }

        /* Footer */
        .sidebar-footer {
          border-top: 1px solid #f1f5f9;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-shrink: 0;
          background: #fafbfc;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2db9a3 0%, #6366f1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 12px;
          flex-shrink: 0;
          letter-spacing: 0.03em;
        }

        .user-details { min-width: 0; flex: 1; }
        .user-details h4 { font-size: 13px; color: #0f172a; font-weight: 700; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-details p { font-size: 11px; color: #94a3b8; margin: 2px 0 0; font-weight: 500; }

        .logout-btn {
          width: 34px; height: 34px; padding: 0;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 9px;
          color: #94a3b8;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s;
          flex-shrink: 0;
        }
        .logout-btn:hover { background: #fee2e2; border-color: #fecaca; color: #ef4444; }

        /* Mobile overlay — only visible on mobile */
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 99;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0; left: 0;
            height: 100%;
            z-index: 200;
            box-shadow: 4px 0 24px rgba(0,0,0,0.12);
            transform: translateX(0);
            transition: transform 0.25s ease;
          }
          .sidebar.closed {
            transform: translateX(-100%);
            width: 272px;
          }
          .sidebar-overlay.mobile-visible {
            display: block;
          }
        }
      `}</style>

      {/* Mobile overlay — only renders & closes sidebar on small screens */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'mobile-visible' : ''}`}
        onClick={() => setSidebarOpen?.(false)}
      />

      <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="sidebar-header">
          <img src="/images/logo.png" alt="Nexum Logo" style={{ height: '38px', width: 'auto' }} />
        </div>

        <nav className="sidebar-menu">
          {menuItems.map(item => {
            const IconComponent = item.icon;
            const hasSubmenu = !!(item.submenu?.length);
            const isExpanded = expandedMenus.has(item.id);
            const isParentActive = hasSubmenu && item.submenu!.some(s => s.id === activeMenu);

            return (
              <div key={item.id}>
                <div
                  className={`menu-item
                    ${!hasSubmenu && activeMenu === item.id ? 'active' : ''}
                    ${hasSubmenu && isParentActive ? 'parent-active' : ''}
                    ${isExpanded && hasSubmenu ? 'expanded' : ''}
                  `}
                  onClick={e => { e.stopPropagation(); handleMenuClick(item.id, hasSubmenu); }}
                >
                  <IconComponent size={17} className="menu-item-icon" />
                  <span className="menu-item-label">{item.label}</span>
                  {hasSubmenu && <ChevronDown size={15} className="menu-item-chevron" />}
                </div>

                {hasSubmenu && (
                  <div className={`submenu ${isExpanded ? 'open' : ''}`}>
                    <div className="submenu-inner">
                      {item.submenu!.map(subitem => {
                        const SubIcon = subitem.icon;
                        return (
                          <div
                            key={subitem.id}
                            className={`submenu-item ${activeMenu === subitem.id ? 'active' : ''}`}
                            onClick={e => { e.stopPropagation(); handleSubmenuClick(subitem.id); }}
                          >
                            <SubIcon size={14} className="submenu-item-icon" />
                            <span>{subitem.label}</span>
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

        <div className="sidebar-footer">
          <div className="user-section">
            <div className="user-avatar">SJ</div>
            <div className="user-details">
              <h4>Sarah Johnson</h4>
              <p>System Admin</p>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}