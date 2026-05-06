'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertCircle, Info, Shield, RefreshCw, UserPlus, X } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  description: string;
  status: string;
  createdAt: string;
  userName: string;
  employeeId: string;
  sourceType: 'alert' | 'access-request';
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onRead?: () => void;
}

function getIcon(item: Alert) {
  if (item.sourceType === 'access-request') return <UserPlus size={16} />;
  if (item.severity === 'critical' || item.severity === 'high') return <AlertCircle size={16} />;
  if (item.severity === 'medium') return <Shield size={16} />;
  return <Info size={16} />;
}

function getColors(item: Alert) {
  if (item.sourceType === 'access-request') return { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' };
  if (item.severity === 'critical') return { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' };
  if (item.severity === 'high')     return { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' };
  if (item.severity === 'medium')   return { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' };
  return                                   { bg: '#f0fdf9', color: '#2db9a3', dot: '#10b981' };
}

function formatTime(d: string) {
  const utc  = d.endsWith('Z') ? d : d + 'Z';
  const diff = Math.floor((Date.now() - new Date(utc).getTime()) / 60000);
  if (diff < 1)    return 'just now';
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

type FilterTab = 'all' | 'alerts' | 'requests' | 'resolved';

export default function NotificationsDropdown({
  isOpen, onClose, triggerRef, onRead,
}: NotificationsDropdownProps) {
  const [allItems,  setAllItems]  = useState<Alert[]>([]);
  const [filter,    setFilter]    = useState<FilterTab>('all');
  const [loading,   setLoading]   = useState(false);
  const [position,  setPosition]  = useState({ top: 0, left: 0, width: 420 });
  const [isMobile,  setIsMobile]  = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const dropdownRef               = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const filtered = allItems.filter(a => {
    if (filter === 'all')      return true;
    if (filter === 'alerts')   return a.sourceType === 'alert' && a.status === 'active';
    if (filter === 'requests') return a.sourceType === 'access-request';
    if (filter === 'resolved') return a.status === 'resolved';
    return true;
  });

  const activeAlertCount    = allItems.filter(a => a.sourceType === 'alert' && a.status === 'active').length;
  const pendingRequestCount = allItems.filter(a => a.sourceType === 'access-request' && a.status === 'active').length;
  const resolvedCount       = allItems.filter(a => a.status === 'resolved').length;
  const totalUnread         = activeAlertCount + pendingRequestCount;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${auth.getToken()}` };
      const [alertsRes, requestsRes] = await Promise.all([
        fetch(`${API}/security/alerts`, { headers }),
        fetch(`${API}/access-requests`, { headers }),
      ]);
      const alertsData   = alertsRes.ok   ? await alertsRes.json()   : [];
      const requestsData = requestsRes.ok ? await requestsRes.json() : [];

      const alerts: Alert[] = Array.isArray(alertsData)
        ? alertsData.map((a: any) => ({
            id: a.id, alertType: a.alertType, severity: a.severity,
            description: a.description, status: a.status, createdAt: a.createdAt,
            userName: a.userName ?? 'System', employeeId: a.employeeId ?? '—',
            sourceType: 'alert' as const,
          }))
        : [];

      const requests: Alert[] = Array.isArray(requestsData)
        ? requestsData.map((r: any) => ({
            id: r.id, alertType: 'Access Request', severity: 'low',
            description: `${r.fullName} (${r.employeeId}) requested access as ${r.requestedRole ?? 'User'} — ${r.department ?? ''}`,
            status: r.status === 'Pending' ? 'active' : 'resolved',
            createdAt: r.createdAt, userName: r.fullName, employeeId: r.employeeId,
            sourceType: 'access-request' as const,
          }))
        : [];

      const merged = [...alerts, ...requests].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllItems(merged);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isOpen) fetchAll(); }, [isOpen, fetchAll]);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current && mounted) {
      const rect = triggerRef.current.getBoundingClientRect();
      const vw   = window.innerWidth;

      if (vw < 640) {
        // Mobile: full-width bottom sheet style positioned below topbar
        setPosition({ top: rect.bottom + 8, left: 8, width: vw - 16 });
        setIsMobile(true);
      } else {
        const dropW = 420;
        const left  = Math.max(8, Math.min(rect.right - dropW, vw - dropW - 8));
        setPosition({ top: rect.bottom + 10, left, width: dropW });
        setIsMobile(false);
      }
    }
  }, [isOpen, triggerRef, mounted, isMobile]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current  && !triggerRef.current.contains(e.target as Node)
      ) onClose();
    };
    if (isOpen) {
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }
  }, [isOpen, onClose, triggerRef]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', h);
      return () => document.removeEventListener('keydown', h);
    }
  }, [isOpen, onClose]);

  const handleResolve = async (item: Alert) => {
    if (item.sourceType === 'alert') {
      try {
        await fetch(`${API}/security/alerts/${item.id}/resolve`, {
          method: 'PUT', headers: { Authorization: `Bearer ${auth.getToken()}` },
        });
        setAllItems(prev => prev.map(a => a.id === item.id ? { ...a, status: 'resolved' } : a));
        onRead?.();
      } catch {}
    } else {
      onClose();
      window.location.href = '/users-accounts/access-requests';
    }
  };

  const handleResolveAllAlerts = async () => {
    const active = allItems.filter(a => a.sourceType === 'alert' && a.status === 'active');
    await Promise.all(active.map(a =>
      fetch(`${API}/security/alerts/${a.id}/resolve`, {
        method: 'PUT', headers: { Authorization: `Bearer ${auth.getToken()}` },
      })
    ));
    setAllItems(prev => prev.map(a =>
      a.sourceType === 'alert' ? { ...a, status: 'resolved' } : a
    ));
    onRead?.();
  };

  if (!isOpen || !mounted) return null;

  const content = (
    <>
      {/* Backdrop for mobile */}
      {isMobile && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 49999,
          }}
        />
      )}

      <div ref={dropdownRef} style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: isMobile ? 'calc(100vh - 80px)' : '80vh',
        background: '#fff',
        border: '1.5px solid #e2e8f0',
        borderRadius: isMobile ? '16px' : '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.14)',
        overflow: 'hidden',
        zIndex: 50000,
        display: 'flex',
        flexDirection: 'column',
        animation: 'ndSlideDown 0.18s ease-out',
        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
      }}>
        <style>{`
          @keyframes ndSlideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
          .nd-header { padding: 14px 16px 0; background: #fafbfc; border-bottom: 1px solid #f1f5f9; flex-shrink: 0; }
          .nd-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; gap: 8px; }
          .nd-title { font-size: 14px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
          .nd-badge { background: #ef4444; color: #fff; border-radius: 12px; padding: 2px 7px; font-size: 11px; font-weight: 700; flex-shrink: 0; }
          .nd-actions { display: flex; gap: 6px; flex-shrink: 0; }
          .nd-action-btn { padding: 4px 10px; border: 1.5px solid #e2e8f0; background: #fff; border-radius: 8px; font-size: 11px; font-weight: 600; color: #64748b; cursor: pointer; font-family: var(--font-dm-sans, 'DM Sans', sans-serif); display: flex; align-items: center; gap: 4px; transition: all 0.15s; white-space: nowrap; }
          .nd-action-btn:hover { border-color: #2db9a3; color: #2db9a3; background: #f0fdf9; }
          .nd-close-btn { width: 28px; height: 28px; border: 1.5px solid #e2e8f0; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; flex-shrink: 0; transition: all 0.15s; padding: 0; }
          .nd-close-btn:hover { background: #fee2e2; border-color: #fecaca; color: #ef4444; }
          .nd-tabs { display: flex; gap: 0; overflow-x: auto; scrollbar-width: none; }
          .nd-tabs::-webkit-scrollbar { display: none; }
          .nd-tab { padding: 8px 10px; font-size: 11.5px; font-weight: 600; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; display: flex; align-items: center; gap: 4px; background: none; border-top: none; border-left: none; border-right: none; font-family: var(--font-dm-sans, 'DM Sans', sans-serif); white-space: nowrap; flex-shrink: 0; }
          .nd-tab:hover { color: #0f172a; }
          .nd-tab.active { color: #2db9a3; border-bottom-color: #2db9a3; }
          .nd-tab-count { background: #f1f5f9; color: #64748b; border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; }
          .nd-tab.active .nd-tab-count { background: #e6fdf8; color: #2db9a3; }
          .nd-list { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
          .nd-list::-webkit-scrollbar { width: 4px; }
          .nd-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
          .nd-item { padding: 12px 16px; border-bottom: 1px solid #f8fafc; display: flex; gap: 10px; align-items: flex-start; transition: background 0.13s; border-left: 3px solid transparent; }
          .nd-item:hover { background: #fafbfd; }
          .nd-item.active-item { border-left-color: var(--dot); }
          .nd-item.resolved-item { opacity: 0.6; }
          .nd-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .nd-body { flex: 1; min-width: 0; }
          .nd-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; margin-bottom: 3px; }
          .nd-type { font-size: 12px; font-weight: 700; color: #0f172a; }
          .nd-time { font-size: 10.5px; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }
          .nd-desc { font-size: 11.5px; color: #64748b; line-height: 1.4; margin-bottom: 6px; word-break: break-word; }
          .nd-user { font-size: 10.5px; color: #94a3b8; }
          .nd-status-badge { padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 700; flex-shrink: 0; }
          .nd-resolve-btn { padding: 3px 9px; border-radius: 6px; border: 1.5px solid #2db9a3; background: #fff; color: #2db9a3; font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--font-dm-sans, 'DM Sans', sans-serif); white-space: nowrap; flex-shrink: 0; transition: all 0.15s; }
          .nd-resolve-btn:hover { background: #2db9a3; color: #fff; }
          .nd-review-btn { padding: 3px 9px; border-radius: 6px; border: 1.5px solid #3b82f6; background: #fff; color: #3b82f6; font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--font-dm-sans, 'DM Sans', sans-serif); white-space: nowrap; flex-shrink: 0; transition: all 0.15s; }
          .nd-review-btn:hover { background: #3b82f6; color: #fff; }
          .nd-footer { padding: 10px 16px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafbfc; flex-shrink: 0; gap: 8px; flex-wrap: wrap; }
          .nd-view-all { color: #2db9a3; font-size: 12px; font-weight: 600; cursor: pointer; background: none; border: none; font-family: var(--font-dm-sans, 'DM Sans', sans-serif); padding: 0; white-space: nowrap; }
          .nd-empty { padding: 32px 16px; text-align: center; flex: 1; }
          .nd-empty-icon { font-size: 28px; margin-bottom: 8px; opacity: 0.5; }
          .nd-empty-text { font-size: 13px; color: #94a3b8; margin: 0; }
          .nd-loading { padding: 24px 0; text-align: center; color: #94a3b8; font-size: 13px; }
        `}</style>

        {/* Header */}
        <div className="nd-header">
          <div className="nd-top-row">
            <div className="nd-title">
              Notifications
              {totalUnread > 0 && <span className="nd-badge">{totalUnread}</span>}
            </div>
            <div className="nd-actions">
              <button className="nd-action-btn" onClick={fetchAll} title="Refresh">
                <RefreshCw size={11} />
              </button>
              {activeAlertCount > 0 && (
                <button className="nd-action-btn" onClick={handleResolveAllAlerts}>
                  <Check size={11} /> Resolve all
                </button>
              )}
              <button className="nd-close-btn" onClick={onClose} title="Close">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="nd-tabs">
            {([
              { key: 'all',      label: 'All',      count: allItems.length },
              { key: 'alerts',   label: 'Alerts',   count: activeAlertCount },
              { key: 'requests', label: 'Requests', count: pendingRequestCount },
              { key: 'resolved', label: 'Resolved', count: resolvedCount },
            ] as { key: FilterTab; label: string; count: number }[]).map(t => (
              <button
                key={t.key}
                className={`nd-tab ${filter === t.key ? 'active' : ''}`}
                onClick={() => setFilter(t.key)}
              >
                {t.label}
                <span className="nd-tab-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="nd-loading">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="nd-empty">
            <div className="nd-empty-icon">🔔</div>
            <p className="nd-empty-text">
              {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <div className="nd-list">
            {filtered.map(a => {
              const c         = getColors(a);
              const isActive  = a.status === 'active';
              const isRequest = a.sourceType === 'access-request';
              return (
                <div
                  key={`${a.sourceType}-${a.id}`}
                  className={`nd-item ${isActive ? 'active-item' : 'resolved-item'}`}
                  style={{ '--dot': c.dot, background: isActive ? c.bg + '33' : 'transparent' } as React.CSSProperties}
                >
                  <div className="nd-icon" style={{ background: c.bg, color: c.color }}>
                    {getIcon(a)}
                  </div>
                  <div className="nd-body">
                    <div className="nd-row">
                      <span className="nd-type">{a.alertType}</span>
                      <span className="nd-time">{formatTime(a.createdAt)}</span>
                    </div>
                    <p className="nd-desc">{a.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <span className="nd-user">{a.userName} · {a.employeeId}</span>
                      {isActive ? (
                        isRequest ? (
                          <button className="nd-review-btn" onClick={() => handleResolve(a)}>Review →</button>
                        ) : (
                          <button className="nd-resolve-btn" onClick={() => handleResolve(a)}>Resolve</button>
                        )
                      ) : (
                        <span className="nd-status-badge" style={{ background: '#f0fdf9', color: '#2db9a3' }}>
                          ✓ {isRequest ? 'Reviewed' : 'Resolved'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="nd-footer">
          <button className="nd-view-all"
            onClick={() => { onClose(); window.location.href = '/security-monitoring/live-alerts'; }}>
            View all alerts →
          </button>
          <button className="nd-view-all" style={{ color: '#3b82f6' }}
            onClick={() => { onClose(); window.location.href = '/users-accounts/access-requests'; }}>
            View all requests →
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}