'use client';
import { useState, useCallback } from 'react';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  activeMenu: string;
}

export default function DashboardLayout({ children, title, activeMenu: initialMenu }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu]   = useState(initialMenu);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    auth.clear();
    router.push('/');
  }, [router]);

  const handleToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleSetSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpen(open);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fff' }}>
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={handleSetSidebarOpen}
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar
          title={title}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={handleToggle}
        />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}