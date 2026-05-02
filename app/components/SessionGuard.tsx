'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/api';

const API_BASE = 'http://localhost:5026/api';

// Pages that should NOT trigger session enforcement
const PUBLIC_PATHS = ['/', '/2fa', '/register', '/forgot-password', '/reset-password', '/unlock-account'];

export function SessionGuard() {
  const router   = useRouter();
  const pathname = usePathname();
  const idleTimerRef    = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const settingsRef     = useRef<{ idleTimeoutMinutes: number; maxSessionHours: number } | null>(null);

  const isPublicPath = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  const logout = useCallback((reason: string) => {
    console.log(`[SessionGuard] Auto-logout: ${reason}`);
    auth.clear();
    router.push('/');
  }, [router]);

  const resetIdleTimer = useCallback(() => {
    if (!settingsRef.current) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    const ms = settingsRef.current.idleTimeoutMinutes * 60 * 1000;
    idleTimerRef.current = setTimeout(() => {
      logout(`Idle for ${settingsRef.current?.idleTimeoutMinutes} minutes`);
    }, ms);
  }, [logout]);

  useEffect(() => {
    // Don't run on public pages or when not logged in
    if (isPublicPath || !auth.isLoggedIn()) return;

    let mounted = true;

    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/sessions/settings`, {
          headers: { Authorization: `Bearer ${auth.getToken()}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        if (!mounted) return;

        settingsRef.current = {
          idleTimeoutMinutes: data.idleTimeoutMinutes ?? 15,
          maxSessionHours:    data.maxSessionHours    ?? 8,
        };

        // ── 1. IDLE TIMEOUT ──────────────────────────────────────────────
        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }));
        resetIdleTimer(); // start the timer immediately

        // ── 2. MAX SESSION DURATION ──────────────────────────────────────
        const sessionStartRaw = localStorage.getItem('nexum_session_start');
        if (sessionStartRaw) {
          const sessionStart  = parseInt(sessionStartRaw, 10);
          const maxMs         = settingsRef.current.maxSessionHours * 60 * 60 * 1000;
          const elapsedMs     = Date.now() - sessionStart;
          const remainingMs   = maxMs - elapsedMs;

          if (remainingMs <= 0) {
            // Already exceeded max session duration
            logout(`Max session duration of ${settingsRef.current.maxSessionHours}h exceeded`);
            return;
          }

          // Set timer for the remaining time
          sessionTimerRef.current = setTimeout(() => {
            logout(`Max session duration of ${settingsRef.current?.maxSessionHours}h reached`);
          }, remainingMs);
        }

        return () => {
          activityEvents.forEach(e => window.removeEventListener(e, resetIdleTimer));
          if (idleTimerRef.current)    clearTimeout(idleTimerRef.current);
          if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
        };
      } catch (err) {
        console.error('[SessionGuard] Failed to load session settings:', err);
      }
    };

    const cleanup = init();

    return () => {
      mounted = false;
      cleanup.then(fn => fn?.());
      if (idleTimerRef.current)    clearTimeout(idleTimerRef.current);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}