'use client';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Lock, RotateCw, ChevronLeft, ChevronRight, ChevronDown,
  Shield, AlertCircle, CheckCircle, Info
} from 'lucide-react';
import { auth } from '@/lib/api';

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  blockCommon: boolean;
  expiryDays: number;
  historyCount: number;
}

interface PasswordHistory {
  id: number;
  employeeId: string;
  employeeName: string;
  changedAt: string;
  changedBy: string;
  reason: string;
}

type ToastType = 'success' | 'error';
function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const show = (msg: string, type: ToastType = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none',
      background: checked ? '#2db9a3' : '#cbd5e1',
      position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      }} />
    </button>
  );
}

function StyledSelect({ value, onChange, options }: {
  value: number | string;
  onChange: (v: string) => void;
  options: { label: string; value: number | string }[];
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: 'none', background: '#ffffff', border: '1.5px solid #e2e8f0',
        borderRadius: 8, padding: '7px 32px 7px 12px', fontSize: 13,
        color: '#1e293b', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', outline: 'none', minWidth: 140,
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '16px 22px', borderBottom: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#2db9a3' }}>{icon}</span>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{title}</span>
      </div>
      <div style={{ padding: '4px 22px 6px' }}>{children}</div>
    </div>
  );
}

function PolicyRow({ label, description, children, last }: { label: string; description?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 0', borderBottom: last ? 'none' : '1px solid #f1f5f9',
    }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13.5, fontWeight: 500, color: '#1e293b' }}>{label}</div>
        {description && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{description}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function PasswordPolicyPage() {
  const router = useRouter();
  const { toast, show } = useToast();
  const { logout, canEdit } = useAuth();
  const isEditable = canEdit('password-policy');

  const handleLogout = () => { logout(); router.push('/'); };  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'policy' | 'history'>('policy');
  const [history, setHistory] = useState<PasswordHistory[]>([]);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const HIST_PER_PAGE = 10;

  const API = process.env.NEXT_PUBLIC_API_URL;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${auth.getToken()}`,
  });

  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/password-policy`, { headers: getHeaders() });

      // ✅ FIX: handle 403 gracefully instead of crashing
      if (res.status === 403) {
        show('Access denied — insufficient permissions to view password policy', 'error');
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setPolicy({
        minLength:        data.minLength        ?? data.MinLength        ?? 12,
        requireUppercase: data.requireUppercase ?? data.RequireUppercase ?? true,
        requireLowercase: data.requireLowercase ?? data.RequireLowercase ?? true,
        requireNumbers:   data.requireNumbers   ?? data.RequireNumbers   ?? true,
        requireSpecial:   data.requireSpecial   ?? data.RequireSpecial   ?? false,
        blockCommon:      data.blockCommon      ?? data.BlockCommon      ?? true,
        expiryDays:       data.expiryDays       ?? data.ExpiryDays       ?? 90,
        historyCount:     data.historyCount     ?? data.HistoryCount     ?? 5,
      });
    } catch (e) {
      show(`Failed to load password policy (${e})`, 'error');
    } finally {
      setLoading(false);
    }
  }, [API]);

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const res = await fetch(`${API}/password-policy/history?page=${page}&pageSize=${HIST_PER_PAGE}`, { headers: getHeaders() });

      // ✅ FIX: handle 403 on history endpoint gracefully
      if (res.status === 403) {
        show('Access denied — insufficient permissions to view password history', 'error');
        setHistory([]);
        setHistTotal(0);
        return;
      }

      if (!res.ok) throw new Error();
      const data = await res.json();
      const items = (data.items ?? data).map((h: Record<string, unknown>) => ({
        id:           h.id           ?? h.Id,
        employeeId:   h.employeeId   ?? h.EmployeeId   ?? '',
        employeeName: h.employeeName ?? h.EmployeeName ?? '',
        changedAt:    h.changedAt    ?? h.ChangedAt,
        changedBy:    h.changedBy    ?? h.ChangedBy    ?? 'System',
        reason:       h.reason       ?? h.Reason       ?? 'Manual change',
      }));
      setHistory(items);
      setHistTotal(data.totalCount ?? data.TotalCount ?? items.length);
    } catch {
      setHistory([]);
      setHistTotal(0);
    }
  }, [API]);

  useEffect(() => { fetchPolicy(); }, [fetchPolicy]);
  useEffect(() => { if (activeTab === 'history') fetchHistory(histPage); }, [activeTab, histPage, fetchHistory]);

  const handleSave = async () => {
    if (!policy || !isEditable) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/password-policy`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          MinLength:        policy.minLength,
          RequireUppercase: policy.requireUppercase,
          RequireLowercase: policy.requireLowercase,
          RequireNumbers:   policy.requireNumbers,
          RequireSpecial:   policy.requireSpecial,
          BlockCommon:      policy.blockCommon,
          ExpiryDays:       policy.expiryDays,
          HistoryCount:     policy.historyCount,
        }),
      });
      if (res.status === 403) { show('Access denied — Admin role required to save policy', 'error'); return; }
      if (!res.ok) throw new Error();
      show('Password policy saved successfully');
    } catch {
      show('Failed to save password policy', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof PasswordPolicy, value: unknown) =>
    setPolicy(p => p ? { ...p, [key]: value } : p);

  const totalHistPages = Math.max(1, Math.ceil(histTotal / HIST_PER_PAGE));
  const safePage = Math.min(histPage, totalHistPages);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#ffffff', fontFamily: 'DM Sans, sans-serif' }}>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        
        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #2db9a3 0%, #22a090 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Password Policy</h1>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Configure password requirements and security rules</p>
              </div>
            </div>
            {!isEditable && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '5px 12px', borderRadius: 20, border: '1px solid #e2e8f0' }}>
                👁 View Only
              </span>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 22, borderBottom: '1.5px solid #e2e8f0' }}>
            {(['policy', 'history'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '9px 20px', border: 'none', background: 'none',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13.5,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? '#2db9a3' : '#64748b',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #2db9a3' : '2px solid transparent',
                marginBottom: -1.5,
              }}>
                {tab === 'policy' ? 'Policy Settings' : 'Password History'}
              </button>
            ))}
          </div>

          {activeTab === 'policy' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#f0fdf9', border: '1.5px solid #a7f3e8', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <Info size={16} color="#2db9a3" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12.5, color: '#0f766e', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                Changes apply to all users on their next password change. Minimum password length is enforced at 12 characters.
                {!isEditable && <strong> You have read-only access to this page.</strong>}
              </p>
            </div>
          )}

          {/* Policy Tab */}
          {activeTab === 'policy' && (
            loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <RotateCw size={24} color="#2db9a3" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : policy ? (
              <>
                <SectionCard title="Password Requirements" icon={<Shield size={16} />}>
                  <PolicyRow label="Minimum Length" description="Enforced minimum is 12 characters">
                    <StyledSelect
                      value={policy.minLength}
                      onChange={v => isEditable && update('minLength', Math.max(12, parseInt(v)))}
                      options={[12,14,16,18,20].map(n => ({ label: `${n} characters`, value: n }))}
                    />
                  </PolicyRow>
                  <PolicyRow label="Require Uppercase Letters" description="At least one uppercase letter (A–Z)">
                    <Toggle checked={policy.requireUppercase} onChange={v => isEditable && update('requireUppercase', v)} />
                  </PolicyRow>
                  <PolicyRow label="Require Lowercase Letters" description="At least one lowercase letter (a–z)">
                    <Toggle checked={policy.requireLowercase} onChange={v => isEditable && update('requireLowercase', v)} />
                  </PolicyRow>
                  <PolicyRow label="Require Numbers" description="At least one numeric digit (0–9)">
                    <Toggle checked={policy.requireNumbers} onChange={v => isEditable && update('requireNumbers', v)} />
                  </PolicyRow>
                  <PolicyRow label="Require Special Characters" description="At least one special character (!@#$%^&*)">
                    <Toggle checked={policy.requireSpecial} onChange={v => isEditable && update('requireSpecial', v)} />
                  </PolicyRow>
                  <PolicyRow label="Block Common Passwords" description="Reject commonly used or weak passwords" last>
                    <Toggle checked={policy.blockCommon} onChange={v => isEditable && update('blockCommon', v)} />
                  </PolicyRow>
                </SectionCard>

                <SectionCard title="Expiry & History" icon={<RotateCw size={16} />}>
                  <PolicyRow label="Password Expiry" description="Force password change after this many days (0 = never)">
                    <StyledSelect
                      value={policy.expiryDays}
                      onChange={v => isEditable && update('expiryDays', parseInt(v))}
                      options={[
                        { label: 'Never', value: 0 },
                        { label: '30 days', value: 30 },
                        { label: '60 days', value: 60 },
                        { label: '90 days', value: 90 },
                        { label: '180 days', value: 180 },
                        { label: '365 days', value: 365 },
                      ]}
                    />
                  </PolicyRow>
                  <PolicyRow label="Password History" description="Prevent reuse of last N passwords" last>
                    <StyledSelect
                      value={policy.historyCount}
                      onChange={v => isEditable && update('historyCount', parseInt(v))}
                      options={[0,3,5,8,10,15,20].map(n => ({ label: n === 0 ? 'Disabled' : `Last ${n} passwords`, value: n }))}
                    />
                  </PolicyRow>
                </SectionCard>

                {isEditable && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingBottom: 8 }}>
                    <button onClick={fetchPolicy} style={{ padding: '10px 24px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 500, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                      Reset
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, background: saving ? '#94a3b8' : '#2db9a3', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 24px', fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(45,185,163,0.25)' }}>
                      {saving ? <RotateCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={15} />}
                      {saving ? 'Saving…' : 'Save Policy'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              // ✅ FIX: show a friendly message if policy failed to load (e.g. 403)
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>
                Unable to load password policy. Please check your permissions or try again.
              </div>
            )
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 24 }}>
              <div style={{ padding: '20px 28px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Password Change History</div>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>Each change is recorded — threshold breach triggers a Security Alert</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2db9a3', background: 'rgba(45,185,163,0.1)', padding: '4px 12px', borderRadius: 20 }}>
                  {histTotal} records
                </span>
              </div>

              {history.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No password change records found</div>
              ) : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #f1f5f9' }}>
                        {['DATE & TIME', 'EMP ID', 'USER', 'CHANGED BY', 'REASON'].map(h => (
                          <th key={h} style={{ padding: '11px 20px', textAlign: 'center', fontWeight: 600, color: '#94a3b8', fontSize: 10.5, letterSpacing: '0.09em', textTransform: 'uppercase' as const }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((row) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.13s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafbfd')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}>
                          <td style={{ padding: '14px 20px', textAlign: 'center', color: '#64748b', fontSize: 13, fontWeight: 500, verticalAlign: 'middle' }}>
                            {new Date(row.changedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' })}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <span style={{ background: '#f1f5f9', color: '#475569', borderRadius: 5, padding: '3px 10px', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', display: 'inline-block' }}>
                              {row.employeeId || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'center', color: '#0f172a', fontWeight: 700, fontSize: 13.5, verticalAlign: 'middle' }}>{row.employeeName}</td>
                          <td style={{ padding: '14px 20px', textAlign: 'center', color: '#64748b', fontSize: 13, fontWeight: 500, verticalAlign: 'middle' }}>{row.changedBy || 'System'}</td>
                          <td style={{ padding: '14px 20px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <span style={{ background: '#f0fdf9', color: '#0f766e', border: '1px solid #a7f3e8', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500, display: 'inline-block' }}>
                              {row.reason || 'Manual change'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>
                      Showing <strong style={{ color: '#475569', fontWeight: 600 }}>{histTotal === 0 ? 0 : (safePage - 1) * HIST_PER_PAGE + 1}–{Math.min(safePage * HIST_PER_PAGE, histTotal)}</strong> of <strong style={{ color: '#475569', fontWeight: 600 }}>{histTotal}</strong> records
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => setHistPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                        style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: safePage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', opacity: safePage === 1 ? 0.35 : 1 }}>
                        <ChevronLeft size={15} />
                      </button>
                      <span style={{ minWidth: 50, textAlign: 'center', fontSize: 13, color: '#475569', fontWeight: 500 }}>{safePage} / {totalHistPages}</span>
                      <button onClick={() => setHistPage(p => Math.min(totalHistPages, p + 1))} disabled={safePage === totalHistPages}
                        style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: safePage === totalHistPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', opacity: safePage === totalHistPages ? 0.35 : 1 }}>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && createPortal(
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, background: toast.type === 'error' ? '#fef2f2' : '#f0fdf9', border: `1.5px solid ${toast.type === 'error' ? '#fca5a5' : '#a7f3e8'}`, color: toast.type === 'error' ? '#dc2626' : '#0f766e', borderRadius: 10, padding: '12px 18px', fontFamily: 'DM Sans, sans-serif', fontSize: 13.5, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>,
        document.body
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

