'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, CheckCircle, AlertCircle, Info } from 'lucide-react';

const notificationsData = [
  { id: 1, type: 'success', title: 'User Added Successfully', message: 'Sarah Johnson has been added to the system', time: '2 min ago', read: false },
  { id: 2, type: 'warning', title: 'Failed Login Attempt', message: 'Multiple failed login attempts detected from IP 192.168.1.105', time: '15 min ago', read: false },
  { id: 3, type: 'info', title: 'System Update', message: 'Security monitoring system updated to latest version', time: '1 hour ago', read: true },
  { id: 4, type: 'error', title: 'Account Locked', message: 'Employee EMP042 account has been locked due to security concerns', time: '2 hours ago', read: true },
  { id: 5, type: 'success', title: 'Role Updated', message: 'User permissions have been successfully updated', time: '3 hours ago', read: true },
];

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function NotificationsDropdown({ isOpen, onClose, triggerRef }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState(notificationsData);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current && mounted) {
      const rect = triggerRef.current.getBoundingClientRect();
      console.log('Bell position:', rect);
      setPosition({
        top: Math.round(rect.bottom + 10),
        left: Math.round(rect.right - 420),
      });
    }
  }, [isOpen, triggerRef, mounted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, triggerRef]);

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
        return <Info size={18} />;
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

  if (!isOpen || !mounted) return null;

  const content = (
    <div ref={dropdownRef} style={{
      position: 'fixed',
      top: position.top,
      left: position.left,
      width: '420px',
      background: '#fff',
      border: '1.5px solid #e2e8f0',
      borderRadius: '14px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
      overflow: 'hidden',
      zIndex: 50000,
      animation: 'slideDown 0.2s ease-out',
    }}>
      <div className="notifications-dropdown-header">
        <div className="notifications-dropdown-title">
          <h3>Notifications</h3>
          {unreadCount > 0 && <span className="notifications-unread-badge">{unreadCount}</span>}
        </div>
        <div className="notifications-dropdown-actions">
          {unreadCount > 0 && (
            <button className="notifications-action-btn" onClick={handleMarkAllAsRead}>
              <Check size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Mark all
            </button>
          )}
        </div>
      </div>

      {notifications.length > 0 ? (
        <>
          <div className="notifications-dropdown-content">
            {notifications.map((notification) => {
              const colors = getNotificationColor(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`notifications-item ${!notification.read ? 'unread' : ''}`}
                >
                  <div
                    className="notifications-item-icon"
                    style={{ '--icon-bg': colors.bg, '--icon-color': colors.icon } as any}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notifications-item-body">
                    <div className="notifications-item-header">
                      <span className="notifications-item-title">{notification.title}</span>
                      <span className="notifications-item-time">{notification.time}</span>
                    </div>
                    <p className="notifications-item-message">{notification.message}</p>
                    <div className="notifications-item-actions">
                      {!notification.read && (
                        <button
                          className="notifications-item-action-btn"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    className="notifications-item-delete-btn"
                    onClick={() => handleDelete(notification.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="notifications-dropdown-footer">
            <button className="notifications-view-all-btn">View all notifications</button>
          </div>
        </>
      ) : (
        <div className="notifications-empty-state">
          <div className="notifications-empty-state-icon">🔔</div>
          <p className="notifications-empty-state-text">No notifications</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notifications-dropdown-header {
          padding: 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fafbfc;
        }

        .notifications-dropdown-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notifications-dropdown-title h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .notifications-unread-badge {
          background: #ef4444;
          color: #fff;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .notifications-dropdown-actions {
          display: flex;
          gap: 8px;
        }

        .notifications-action-btn {
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

        .notifications-action-btn:hover {
          border-color: #2db9a3;
          color: #2db9a3;
          background: #f0fdf9;
        }

        .notifications-dropdown-content {
          max-height: 500px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }

        .notifications-dropdown-content::-webkit-scrollbar {
          width: 6px;
        }

        .notifications-dropdown-content::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }

        .notifications-dropdown-content::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }

        .notifications-item {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          transition: all 0.18s;
          cursor: pointer;
        }

        .notifications-item:hover {
          background: #f8fafc;
        }

        .notifications-item.unread {
          background: #f0fdf9;
          border-left: 3px solid #2db9a3;
        }

        .notifications-item-icon {
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

        .notifications-item-body {
          flex: 1;
          min-width: 0;
        }

        .notifications-item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .notifications-item-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          flex: 1;
        }

        .notifications-item-time {
          font-size: 11px;
          color: #94a3b8;
          white-space: nowrap;
        }

        .notifications-item-message {
          font-size: 12px;
          color: #64748b;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .notifications-item-actions {
          display: flex;
          gap: 8px;
          font-size: 11px;
        }

        .notifications-item-action-btn {
          background: none;
          border: none;
          color: #2db9a3;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.18s;
          padding: 0;
        }

        .notifications-item-action-btn:hover {
          color: #24a193;
        }

        .notifications-item-delete-btn {
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

        .notifications-item-delete-btn:hover {
          color: #ef4444;
        }

        .notifications-dropdown-footer {
          padding: 14px 20px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
          background: #fafbfc;
        }

        .notifications-view-all-btn {
          color: #2db9a3;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          background: none;
          border: none;
          padding: 0;
        }

        .notifications-view-all-btn:hover {
          color: #24a193;
        }

        .notifications-empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #94a3b8;
        }

        .notifications-empty-state-icon {
          font-size: 40px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .notifications-empty-state-text {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }
      `}</style>
      {createPortal(content, document.body)}
    </>
  );
}
