'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import { useAuth } from '@/contexts/AuthContext';

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationBtnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  return (
    <>
      <style>{`
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
      `}</style>

      <div className="topbar">
        <span className="topbar-title">{title}</span>
        <div className="topbar-right">
          <button 
            ref={notificationBtnRef}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="notif-btn"
          >
            <Bell size={17} />
            <div className="notif-dot" />
          </button>
          <button onClick={() => router.push('/my-profile')} className="profile-pill" style={{ border: 'none' }}>
            <div className="profile-avatar">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
            </div>
            <span className="profile-name">{user?.name || 'User'}</span>
          </button>
        </div>
      </div>

      <NotificationsDropdown 
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        triggerRef={notificationBtnRef}
      />
    </>
  );
}
