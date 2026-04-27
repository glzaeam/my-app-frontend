'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import {
  Lock, RotateCw, CheckCircle, Circle, ChevronLeft, ChevronRight,
  ChevronDown, RefreshCw, Shield, Mail, Users
} from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface RolePolicy {
  id: string;
  name: string;
  userCount: number;
  minLength: number;
  expiryDays: number;
  historyCount: number;
  mfaRequired: boolean;
}

// ─── Custom Select ────────────────────────────────────────────────────────────
// Custom dropdown rendered via portal into document.body using fixed positioning
// calculated from getBoundingClientRect — works correctly in any scroll container.

function CustomSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen]   = useState(false);
  const [pos, setPos]     = useState({ top: 0, left: 0, width: 0 });
  const triggerRef        = useRef<HTMLButtonElement>(null);
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const selected          = options.find(o => o.value === value);

  const updatePos = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  };

  const handleToggle = () => {
    updatePos();
    setOpen(v => !v);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !triggerRef.current?.contains(t) &&
        !dropdownRef.current?.contains(t)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Sync position on scroll/resize
  useEffect(() => {
    if (!open) return;
    const sync = () => updatePos();
    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('scroll', sync, true);
      window.removeEventListener('resize', sync);
    };
  }, [open]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 8,
          border: `1px solid ${open ? '#1D9E75' : 'rgba(0,0,0,0.15)'}`,
          fontSize: 13,
          color: '#1a2332',
          background: '#ffffff',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontWeight: 400,
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{ color: '#1a2332' }}>{selected?.label ?? 'Select'}</span>
        <ChevronDown
          size={14}
          style={{
            color: '#94a3b8',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown — portaled to body so it is never clipped */}
      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 999999,
            overflow: 'hidden',
          }}
        >
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={e => {
                  e.preventDefault(); // prevent blur before click
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  fontSize: 13,
                  color: isSelected ? '#1D9E75' : '#1a2332',
                  background: isSelected ? 'rgba(29,158,117,0.07)' : 'transparent',
                  fontWeight: isSelected ? 500 : 400,
                  fontFamily: 'var(--font-sans)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'block',
                  letterSpacing: 0,
                  lineHeight: 1.5,
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.target as HTMLElement).style.background = 'rgba(0,0,0,0.03)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.target as HTMLElement).style.background = 'transparent';
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  msg,
  type,
  onDone,
}: {
  msg: string;
  type: 'success' | 'error';
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        padding: '12px 18px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        background: type === 'success' ? 'var(--color-background-success)' : 'var(--color-background-danger)',
        color: type === 'success' ? 'var(--color-text-success)' : 'var(--color-text-danger)',
        border: `0.5px solid ${type === 'success' ? 'var(--color-border-success)' : 'var(--color-border-danger)'}`,
      }}
    >
      {msg}
    </div>
  );
}

// ─── Rule Row ─────────────────────────────────────────────────────────────────

function RuleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 0',
        borderBottom: '0.5px solid rgba(0,0,0,0.06)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {value
        ? <CheckCircle size={16} style={{ color: '#1D9E75', flexShrink: 0 }} />
        : <Circle size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
      <span style={{ fontSize: 13, color: 'var(--color-text-primary)', flex: 1 }}>{label}</span>
      {/* Toggle */}
      <div
        onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: value ? '#1D9E75' : 'rgba(0,0,0,0.15)',
          position: 'relative',
          flexShrink: 0,
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: value ? 21 : 3,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid rgba(0,0,0,0.1)',
        borderRadius: 12,
        padding: 20,
        overflow: 'visible',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-background-info)',
            color: 'var(--color-text-info)',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: 6,
          display: 'block',
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 5 }}>{hint}</p>
      )}
    </div>
  );
}

// ─── Guide Card ───────────────────────────────────────────────────────────────

interface GuideItem {
  icon: string;
  text: string;
}

function GuideCard({
  icon,
  title,
  iconColor,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  iconColor: string;
  items: GuideItem[];
}) {
  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid rgba(0,0,0,0.08)',
        borderRadius: 12,
        padding: '20px 24px',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 16, paddingBottom: 14,
        borderBottom: '0.5px solid rgba(0,0,0,0.06)',
        color: iconColor, fontSize: 13, fontWeight: 500,
      }}>
        {icon}
        {title}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              paddingBottom: i < items.length - 1 ? 10 : 0,
              marginBottom: i < items.length - 1 ? 10 : 0,
              borderBottom: i < items.length - 1 ? '0.5px solid rgba(0,0,0,0.04)' : 'none',
            }}
          >
            <span style={{
              marginTop: 6,
              width: 5, height: 5, borderRadius: '50%',
              background: iconColor,
              flexShrink: 0,
              opacity: 0.45,
            }} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PasswordPolicy() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]   = useState('password-policy');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Global policy state
  const [minLength, setMinLength]             = useState('8');
  const [passwordExpiry, setPasswordExpiry]   = useState('90');
  const [passwordHistory, setPasswordHistory] = useState('5');
  const [uppercase, setUppercase]             = useState(true);
  const [lowercase, setLowercase]             = useState(true);
  const [numbers, setNumbers]                 = useState(true);
  const [special, setSpecial]                 = useState(true);
  const [blockCommon, setBlockCommon]         = useState(true);

  // Role policies
  const [roles, setRoles]             = useState<RolePolicy[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = auth.getToken();
      const [policyRes, rolesRes] = await Promise.all([
        fetch(`${API}/password-policy`,       { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/password-policy/roles`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const policy    = await policyRes.json();
      const rolesData = await rolesRes.json();

      setMinLength(String(policy.minLength ?? 8));
      setPasswordExpiry(String(policy.expiryDays ?? 90));
      setPasswordHistory(String(policy.historyCount ?? 5));
      setUppercase(policy.requireUppercase ?? true);
      setLowercase(policy.requireLowercase ?? true);
      setNumbers(policy.requireNumbers ?? true);
      setSpecial(policy.requireSpecial ?? true);
      setBlockCommon(policy.blockCommon ?? true);
      setRoles(rolesData);
    } catch {
      setToast({ msg: 'Failed to load policy', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/password-policy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.getToken()}`,
        },
        body: JSON.stringify({
          minLength:        parseInt(minLength),
          requireUppercase: uppercase,
          requireLowercase: lowercase,
          requireNumbers:   numbers,
          requireSpecial:   special,
          blockCommon,
          expiryDays:       parseInt(passwordExpiry),
          historyCount:     parseInt(passwordHistory),
        }),
      });
      const data = await res.json();
      if (data.success) setToast({ msg: 'Password policy saved', type: 'success' });
      else setToast({ msg: data.message || 'Save failed', type: 'error' });
    } catch {
      setToast({ msg: 'Server error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(roles.length / itemsPerPage));
  const safePage   = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paged      = roles.slice(startIndex, startIndex + itemsPerPage);

  const rules = [
    { label: 'Uppercase letters (A–Z)',     value: uppercase,   toggle: () => setUppercase(v => !v) },
    { label: 'Lowercase letters (a–z)',     value: lowercase,   toggle: () => setLowercase(v => !v) },
    { label: 'Numbers (0–9)',               value: numbers,     toggle: () => setNumbers(v => !v) },
    { label: 'Special characters (!@#$%)', value: special,     toggle: () => setSpecial(v => !v) },
    { label: 'Block common passwords',     value: blockCommon, toggle: () => setBlockCommon(v => !v) },
  ];

  const guidelines = [
    {
      icon: <Lock size={14} />,
      title: 'Password requirements',
      color: 'var(--color-text-info)',
      items: [
        { icon: '✓', text: '12–128 characters; never truncate silently' },
        { icon: '✓', text: 'At least one uppercase letter (A–Z)' },
        { icon: '✓', text: 'At least one lowercase letter (a–z)' },
        { icon: '✓', text: 'At least one number (0–9)' },
        { icon: '✓', text: 'At least one special character (!@#$%)' },
        { icon: '✓', text: 'Block common passwords via HaveIBeenPwned API' },
      ],
    },
    {
      icon: <Shield size={14} />,
      title: 'Brute force & lockout',
      color: 'var(--color-text-danger)',
      items: [
        { icon: '🔒', text: '5 failed attempts triggers lockout per account and IP' },
        { icon: '⏱', text: '15-minute minimum lockout; send unlock link to email' },
        { icon: '🔐', text: 'Generic error only: "Invalid email or password"' },
        { icon: '🤖', text: 'CAPTCHA after 3 attempts (reCAPTCHA v3)' },
        { icon: '⏰', text: 'Exponential backoff with Redis-cached state' },
      ],
    },
    {
      icon: <Shield size={14} />,
      title: 'Sessions & cookies',
      color: '#534AB7',
      items: [
        { icon: '🔐', text: 'HttpOnly, Secure, SameSite=Strict — JS cannot read' },
        { icon: '🔄', text: 'New session ID immediately after login' },
        { icon: '⏲', text: 'Auto-expire idle sessions after 30 minutes' },
        { icon: '🛡', text: 'Force HTTPS; HSTS header (max-age=31536000)' },
        { icon: '📱', text: 'Email alert on new device with IP, location, timestamp' },
      ],
    },
    {
      icon: <RotateCw size={14} />,
      title: 'Password reset tokens',
      color: '#BA7517',
      items: [
        { icon: '🔐', text: 'Cryptographically secure: crypto.randomBytes(32)' },
        { icon: '💾', text: 'Store only SHA-256 hash — raw tokens never in DB' },
        { icon: '⏰', text: '15-minute expiry; single-use; invalidated after click' },
        { icon: '🚫', text: 'Second-click rejection: "This link has already been used"' },
        { icon: '🔄', text: 'Cancel all previous tokens on new request' },
      ],
    },
    {
      icon: <Mail size={14} />,
      title: 'Email & anti-enumeration',
      color: '#185FA5',
      items: [
        { icon: '✓', text: 'Same response always: "If registered, a link was sent"' },
        { icon: '🚫', text: 'Max 3 resets/hour per email and per IP' },
        { icon: '📋', text: 'Honeypot field for bot detection — silent reject' },
        { icon: '📧', text: 'Confirmation email after password change with "Wasn\'t me" button' },
        { icon: '🔗', text: 'Referrer-Policy: no-referrer to prevent token leakage' },
      ],
    },
    {
      icon: <CheckCircle size={14} />,
      title: 'After password reset',
      color: 'var(--color-text-success)',
      items: [
        { icon: '🚪', text: 'Invalidate all active sessions immediately' },
        { icon: '✓', text: 'New password must pass the same strength rules' },
        { icon: '🔄', text: 'Check last 5 hashed passwords to prevent reuse' },
        { icon: '📝', text: 'Send confirmation email with "Secure my account" link' },
        { icon: '📊', text: 'Log all resets — retain 90+ days for audit' },
      ],
    },
    {
      icon: <Shield size={14} />,
      title: 'MFA & security alerts',
      color: '#1D9E75',
      items: [
        { icon: '🔐', text: 'MFA required for admin roles — TOTP or SMS OTP' },
        { icon: '📱', text: 'New device: email with device type, IP, city, timestamp' },
        { icon: '🚨', text: 'Admin "wasn\'t me" button auto-locks account' },
        { icon: '📋', text: 'Log all login attempts: IP, user-agent, timestamp' },
        { icon: '🗂', text: 'Retain logs 90+ days for compliance and forensics' },
      ],
    },
    {
      icon: <Users size={14} />,
      title: 'Admin review & onboarding',
      color: '#533AB7',
      items: [
        { icon: '👤', text: 'No auto-approval — all requests require manual review' },
        { icon: '📋', text: 'Immutable audit logs with admin name, time, reason' },
        { icon: '🔑', text: 'Least privilege: new accounts get lowest role' },
        { icon: '🎁', text: 'One-time invite link: 48-hour expiry, single-use' },
        { icon: '🔐', text: 'Force MFA on first login — no skip allowed' },
      ],
    },
  ];

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const s = {
    root: {
      display: 'flex',
      height: '100vh',
      background: 'var(--color-background-primary)',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
    } as React.CSSProperties,
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    } as React.CSSProperties,
    scroll: {
      flex: 1,
      overflowY: 'auto',
      padding: '28px 32px',
      scrollbarWidth: 'thin' as const,
      scrollbarColor: 'rgba(0,0,0,0.1) transparent',
    } as React.CSSProperties,
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div style={s.root}>
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={() => { auth.clear(); router.push('/'); }}
        />

        <div style={s.main}>
          <TopBar title="Authentication" />

          <div style={s.scroll}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#0F6E56',
                  background: '#E1F5EE',
                  border: '1px solid #9FE1CB',
                  padding: '4px 12px',
                  borderRadius: 999,
                  marginBottom: 10,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
                  Authentication
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                  Password policy
                </h1>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                  Define password complexity and rotation rules for all users
                </p>
              </div>

              <button
                onClick={fetchData}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', border: '0.5px solid rgba(0,0,0,0.15)',
                  borderRadius: 8, background: 'var(--color-background-primary)',
                  fontSize: 13, fontFamily: 'var(--font-sans)',
                  color: 'var(--color-text-secondary)', cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-tertiary)' }}>
                Loading policy…
              </div>
            ) : (
              <>
                {/* ── Top Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14, marginBottom: 14 }}>

                  {/* Complexity */}
                  <Card icon={<Lock size={14} />} title="Complexity requirements">
                    <Field label="Minimum password length" hint="Enforced on add user form and password reset">
                      <CustomSelect
                        options={[
                          { value: '8',  label: '8 characters' },
                          { value: '10', label: '10 characters' },
                          { value: '12', label: '12 characters' },
                          { value: '16', label: '16 characters' },
                        ]}
                        value={minLength}
                        onChange={setMinLength}
                      />
                    </Field>
                    <div>
                      {rules.map((rule, i) => (
                        <div key={i} style={{ borderBottom: i < rules.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                          <RuleRow label={rule.label} value={rule.value} onToggle={rule.toggle} />
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Rotation & History */}
                  <Card icon={<RotateCw size={14} />} title="Rotation & history">
                    <Field label="Password expiry" hint="Users must change passwords after this period">
                      <CustomSelect
                        options={[
                          { value: '30',  label: '30 days' },
                          { value: '60',  label: '60 days' },
                          { value: '90',  label: '90 days' },
                          { value: '180', label: '180 days' },
                        ]}
                        value={passwordExpiry}
                        onChange={setPasswordExpiry}
                      />
                    </Field>
                    <Field label="Password history" hint="Prevents reusing recent passwords">
                      <CustomSelect
                        options={[
                          { value: '3',  label: 'Remember last 3 passwords' },
                          { value: '5',  label: 'Remember last 5 passwords' },
                          { value: '10', label: 'Remember last 10 passwords' },
                          { value: '0',  label: 'Disabled' },
                        ]}
                        value={passwordHistory}
                        onChange={setPasswordHistory}
                      />
                    </Field>
                    <div style={{
                      marginTop: 14,
                      background: 'var(--color-background-success)',
                      border: '0.5px solid var(--color-border-success)',
                      borderRadius: 8,
                      padding: '11px 14px',
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-success)' }}>
                        Password strength meter: Enabled
                      </p>
                      <span style={{ fontSize: 12, color: 'var(--color-text-success)', opacity: 0.75, display: 'block', marginTop: 2 }}>
                        Visual feedback shown during password creation
                      </span>
                    </div>
                  </Card>
                </div>

                {/* ── Policy by Role Table ── */}
                <div style={{
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid rgba(0,0,0,0.08)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>Policy by role</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        Per-role requirements — global policy applies to all roles
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      color: 'var(--color-text-info)',
                      background: 'var(--color-background-info)',
                      padding: '3px 10px', borderRadius: 20,
                    }}>
                      {roles.length} roles
                    </span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-background-secondary)' }}>
                        {['Role', 'Users', 'Min length', 'Expiry', 'History', 'MFA required'].map(h => (
                          <th key={h} style={{
                            padding: '9px 16px', textAlign: 'center',
                            fontSize: 10.5, fontWeight: 500,
                            color: 'var(--color-text-secondary)',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '28px 0', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
                            No roles found.
                          </td>
                        </tr>
                      ) : paged.map(row => (
                        <tr key={row.id} style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }}>
                          <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'center' }}>{row.name}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center' }}>{row.userCount}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-primary)', textAlign: 'center' }}>{row.minLength} chars</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-primary)', textAlign: 'center' }}>{row.expiryDays} days</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-primary)', textAlign: 'center' }}>Last {row.historyCount}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                              background: row.mfaRequired ? 'var(--color-background-success)' : 'var(--color-background-secondary)',
                              color: row.mfaRequired ? 'var(--color-text-success)' : 'var(--color-text-secondary)',
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                              {row.mfaRequired ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px', borderTop: '0.5px solid rgba(0,0,0,0.06)',
                    background: 'var(--color-background-secondary)',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Showing{' '}
                      <strong style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {roles.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, roles.length)}
                      </strong>
                      {' '}of{' '}
                      <strong style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{roles.length}</strong> roles
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          border: '0.5px solid rgba(0,0,0,0.15)',
                          background: 'var(--color-background-primary)',
                          cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--color-text-secondary)', opacity: safePage === 1 ? 0.35 : 1,
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', minWidth: 50, textAlign: 'center' }}>
                        {safePage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          border: '0.5px solid rgba(0,0,0,0.15)',
                          background: 'var(--color-background-primary)',
                          cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--color-text-secondary)', opacity: safePage === totalPages ? 0.35 : 1,
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Security Guidelines ── */}
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    Security guidelines
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                    Best practices for authentication and access control
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
                  {guidelines.map((g, i) => (
                    <GuideCard
                      key={i}
                      icon={g.icon}
                      title={g.title}
                      iconColor={g.color}
                      items={g.items}
                    />
                  ))}
                </div>

                {/* ── Footer Actions ── */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={fetchData}
                    style={{
                      padding: '9px 22px', borderRadius: 8,
                      border: '0.5px solid rgba(0,0,0,0.15)',
                      background: 'var(--color-background-primary)',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer', fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Reset
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleSave}
                    style={{
                      padding: '9px 22px', borderRadius: 8, border: 'none',
                      background: saving ? '#9ca3af' : '#1D9E75',
                      color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: 13, fontWeight: 500,
                      fontFamily: 'var(--font-sans)',
                      transition: 'background 0.15s',
                    }}
                  >
                    {saving ? 'Saving…' : 'Save policy'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
