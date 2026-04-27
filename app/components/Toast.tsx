'use client';

import { useEffect } from 'react';

interface ToastProps {
  msg: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onDone: () => void;
  duration?: number;
}

export default function Toast({ msg, type, onDone, duration = 3200 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  const config = {
    success: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', dot: '#16a34a' },
    error:   { bg: '#fff1f2', color: '#dc2626', border: '#fecdd3', dot: '#ef4444' },
    warning: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', dot: '#f59e0b' },
    info:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' },
  }[type];

  return (
    <div style={{
      position:     'fixed',
      top:          80,        // below the TopBar (66px) + small gap
      right:        24,
      zIndex:       99999,
      padding:      '12px 18px',
      borderRadius: 12,
      fontSize:     13,
      fontWeight:   600,
      fontFamily:   "'DM Sans', 'Outfit', sans-serif",
      boxShadow:    '0 8px 32px rgba(0,0,0,0.13)',
      background:   config.bg,
      color:        config.color,
      border:       `1px solid ${config.border}`,
      display:      'flex',
      alignItems:   'center',
      gap:          8,
      minWidth:     220,
      maxWidth:     380,
      animation:    'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
      `}</style>
      <span style={{
        width:        8,
        height:       8,
        borderRadius: '50%',
        background:   config.dot,
        flexShrink:   0,
      }} />
      {msg}
    </div>
  );
}