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
    <>
      <style>{`
        /* ─── GLOBAL RESPONSIVE RESET ─── */
        *, *::before, *::after { box-sizing: border-box; }

        /* ─── SCROLLABLE TABLES ─── */
        /* Any table inside a .table-card or wrapped in overflow-x:auto becomes scrollable */
        .table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
        }
        .table-responsive::-webkit-scrollbar { height: 5px; }
        .table-responsive::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        /* Make all existing table wrappers inside pages scrollable */
        [style*="overflowX: auto"],
        [style*="overflow-x: auto"] {
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
          -webkit-overflow-scrolling: touch;
        }
        [style*="overflowX: auto"]::-webkit-scrollbar,
        [style*="overflow-x: auto"]::-webkit-scrollbar { height: 5px; }
        [style*="overflowX: auto"]::-webkit-scrollbar-thumb,
        [style*="overflow-x: auto"]::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

        /* ─── CARDS ─── */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 900px) {
          .content-grid { grid-template-columns: 1fr; gap: 14px; }
        }

        .stats-row,
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }
        @media (max-width: 540px) {
          .stats-row,
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }

        /* ─── CONTROLS BAR ─── */
        .controls-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        @media (max-width: 540px) {
          .controls-bar { gap: 8px; }
          .controls-bar > * { flex: 1 1 auto; min-width: 0; }
          .search-wrap { min-width: 100% !important; max-width: 100% !important; }
        }

        /* ─── ICON BUTTONS — prevent shrinking ─── */
        .icon-btn,
        .resolve-btn,
        .revoke-btn,
        .terminate-btn,
        .terminate-all-btn {
          flex-shrink: 0;
        }

        /* ─── PAGE SCROLL AREAS ─── */
        .asr-scroll,
        .la-scroll,
        .sa-scroll,
        .dt-scroll,
        .main-content,
        .tt-content {
          overflow-x: hidden;
        }

        /* ─── DEVICE CARDS — stack on small screens ─── */
        .device-card {
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .device-card {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .device-right {
            align-items: flex-start !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            width: 100%;
          }
        }

        /* ─── ALERT CARDS ─── */
        @media (max-width: 640px) {
          .alert-card,
          .activity-card {
            flex-wrap: wrap;
            padding: 14px 14px !important;
          }
        }

        /* ─── TABLE CELLS — prevent layout break ─── */
        .tt-table {
          min-width: 800px;
        }

        /* ─── PAGINATION ─── */
        .pagination-bar {
          flex-wrap: wrap;
          gap: 8px;
        }
        @media (max-width: 540px) {
          .pagination-bar {
            justify-content: center !important;
            padding: 12px 16px !important;
          }
          .pagination-bar > span { width: 100%; text-align: center; }
        }

        /* ─── ASSIGN ROLE LAYOUT ─── */
        @media (max-width: 640px) {
          .assign-panel { padding: 14px !important; }
          .user-item { padding: 12px 14px !important; }
          .card-header { padding: 14px 16px 12px !important; }
        }

        /* ─── SESSION TABLE ─── */
        @media (max-width: 640px) {
          .session-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>

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
          <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}