'use client';

import { useState, useRef } from 'react';
import NotificationsDropdown from '@/app/components/NotificationsDropdown';
import { Bell, X, Check, AlertCircle, Info, CheckCircle } from 'lucide-react';

const notificationsData = [
  { id: 1, type: 'success', title: 'User Added Successfully', message: 'Sarah Johnson has been added to the system', time: '2 min ago', read: false },
  { id: 2, type: 'warning', title: 'Failed Login Attempt', message: 'Multiple failed login attempts detected from IP 192.168.1.105', time: '15 min ago', read: false },
  { id: 3, type: 'info', title: 'System Update', message: 'Security monitoring system updated to latest version', time: '1 hour ago', read: true },
  { id: 4, type: 'error', title: 'Account Locked', message: 'Employee EMP042 account has been locked due to security concerns', time: '2 hours ago', read: true },
  { id: 5, type: 'success', title: 'Role Updated', message: 'User permissions have been successfully updated', time: '3 hours ago', read: true },
];

export default function NotificationsPage() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationBtnRef = useRef<HTMLButtonElement>(null);
  const [notifications, setNotifications] = useState(notificationsData);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'warning':
        return <AlertCircle size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'info':
        return <Info size={18} />;
      default:
        return <Bell size={18} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return { bg: '#d1fae5', color: '#065f46', icon: '#10b981' };
      case 'warning':
        return { bg: '#fef3c7', color: '#92400e', icon: '#f59e0b' };
      case 'error':
        return { bg: '#fee2e2', color: '#991b1b', icon: '#ef4444' };
      case 'info':
        return { bg: '#dbeafe', color: '#1e40af', icon: '#3b82f6' };
      default:
        return { bg: '#f3f4f6', color: '#374151', icon: '#6b7280' };
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Open Sans', sans-serif;
          background: #f8fafc;
        }

        .page-wrapper {
          display: flex;
          min-height: 100vh;
        }

        .notifications-container {
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 20px;
        }

        .topbar {
          height: 66px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .topbar-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .notif-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.18s;
          position: relative;
        }

        .notif-btn:hover {
          border-color: #2db9a3;
          color: #2db9a3;
          background: #f0fdf9;
        }

        .dropdown-wrapper {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .dropdown-header {
          padding: 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fafbfc;
        }

        .dropdown-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dropdown-title h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .unread-badge {
          background: #ef4444;
          color: #fff;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .dropdown-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 6px 12px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.18s;
        }

        .action-btn:hover {
          border-color: #2db9a3;
          color: #2db9a3;
          background: #f0fdf9;
        }

        .dropdown-content {
          max-height: 600px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }

        .dropdown-content::-webkit-scrollbar {
          width: 6px;
        }

        .dropdown-content::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }

        .dropdown-content::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }

        .notification-item {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          transition: all 0.18s;
          cursor: pointer;
        }

        .notification-item:hover {
          background: #f8fafc;
        }

        .notification-item.unread {
          background: #f0fdf9;
          border-left: 3px solid #2db9a3;
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--icon-bg);
          color: var(--icon-color);
        }

        .notification-body {
          flex: 1;
          min-width: 0;
        }

        .notification-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .notification-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          flex: 1;
        }

        .notification-time {
          font-size: 11px;
          color: #94a3b8;
          white-space: nowrap;
        }

        .notification-message {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .notification-actions {
          display: flex;
          gap: 8px;
          font-size: 11px;
        }

        .notification-action-btn {
          background: none;
          border: none;
          color: #2db9a3;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.18s;
          padding: 0;
        }

        .notification-action-btn:hover {
          color: #24a193;
        }

        .notification-delete-btn {
          background: none;
          border: none;
          color: #cbd5e1;
          cursor: pointer;
          padding: 4px;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-delete-btn:hover {
          color: #ef4444;
        }

        .dropdown-footer {
          padding: 14px 20px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
          background: #fafbfc;
        }

        .view-all-btn {
          color: #2db9a3;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          background: none;
          border: none;
          padding: 0;
        }

        .view-all-btn:hover {
          color: #24a193;
        }

        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #94a3b8;
        }

        .empty-state-icon {
          font-size: 40px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .empty-state-text {
          font-size: 14px;
          color: #94a3b8;
        }
      `}</style>

      <div className="page-wrapper">
        <div className="topbar">
          <span className="topbar-title">Notifications</span>
          <div className="topbar-right">
            <button
              ref={notificationBtnRef}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="notif-btn"
            >
              <Bell size={17} />
            </button>
          </div>
        </div>
        <NotificationsDropdown
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          triggerRef={notificationBtnRef}
        />
      </div>
      <div className="notifications-container">
        <div className="dropdown-wrapper">
          <div className="dropdown-header">
            <div className="dropdown-title">
              <h3>Notifications</h3>
              {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </div>
            <div className="dropdown-actions">
              {unreadCount > 0 && (
                <button className="action-btn" onClick={handleMarkAllAsRead}>
                  <Check size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Mark all
                </button>
              )}
            </div>
          </div>

          {notifications.length > 0 ? (
            <>
              <div className="dropdown-content">
                {notifications.map((notification) => {
                  const colors = getNotificationColor(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    >
                      <div
                        className="notification-icon"
                        style={{ '--icon-bg': colors.bg, '--icon-color': colors.icon } as any}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-body">
                        <div className="notification-header">
                          <span className="notification-title">{notification.title}</span>
                          <span className="notification-time">{notification.time}</span>
                        </div>
                        <p className="notification-message">{notification.message}</p>
                        <div className="notification-actions">
                          {!notification.read && (
                            <button
                              className="notification-action-btn"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        className="notification-delete-btn"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="dropdown-footer">
                <button className="view-all-btn">View all notifications</button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔔</div>
              <p className="empty-state-text">No notifications</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
