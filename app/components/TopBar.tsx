'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

function getHDImageUrl(url: string | null | undefined, size = 400): string | null {
  if (!url) return null;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto:best,f_auto/`);
}

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount]             = useState(0);
  const notificationBtnRef                        = useRef<HTMLButtonElement>(null);
  const router                                    = useRouter();
  const { user }                                  = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/security/alerts/summary`, {
        headers: { Authorization: `Bearer ${auth.getToken()}` }
      });
      const data = await res.json();
      setUnreadCount(data.active ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const initials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  // ✅ Get the actual role from AuthContext
  const roleName = user?.role || 'Bank Teller';

  return (
    <>
      <style>{`
        .topbar { height: 66px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .topbar-title { font-size: 16px; font-weight: 500; color: #0f172a; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .notif-btn { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.18s; position: relative; }
        .notif-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
        .notif-badge { position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; border-radius: 50%; min-width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(239,68,68,0.3); padding: 0 4px; }
        .profile-pill { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 40px; padding: 5px 14px 5px 5px; cursor: pointer; transition: all 0.18s; }
        .profile-pill:hover { border-color: #2db9a3; background: #f0fdf9; }
        .profile-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #2db9a3, #6366f1); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; overflow: hidden; flex-shrink: 0; }
        .profile-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .profile-info { display: flex; flex-direction: column; align-items: flex-start; }
        .profile-name { font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.2; }
        .profile-role { font-size: 11px; font-weight: 500; color: #64748b; line-height: 1.2; }
      `}</style>

      <div className="topbar">
        <span className="topbar-title">{title}</span>
        <div className="topbar-right">
          <button
            ref={notificationBtnRef}
            onClick={() => { setNotificationsOpen(v => !v); fetchUnreadCount(); }}
            className="notif-btn"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <div className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</div>
            )}
          </button>

          {/* ✅ Now shows name AND role */}
          <button onClick={() => router.push('/my-profile')} className="profile-pill" style={{ border: 'none' }}>
            <div className="profile-avatar">
              {user?.profileImageUrl
                ? <img src={getHDImageUrl(user.profileImageUrl, 100) || ''} alt={user.name} />
                : initials
              }
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'User'}</span>
              <span className="profile-role">{roleName}</span>
            </div>
          </button>
        </div>
      </div>

      <NotificationsDropdown
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        triggerRef={notificationBtnRef}
        onRead={fetchUnreadCount}
      />
    </>
  );
}