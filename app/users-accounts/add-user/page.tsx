'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import TopBar from '@/app/components/TopBar';
import SelectDropdown from '@/app/components/SelectDropdown';
import { UserPlus, Info, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { auth } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak',       color: '#ef4444' };
  if (score <= 3) return { score, label: 'Fair',       color: '#f59e0b' };
  if (score <= 4) return { score, label: 'Strong',     color: '#3b82f6' };
  return              { score, label: 'Very Strong', color: '#10b981' };
}

interface Policy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  blockCommon: boolean;
}

export default function AddUser() {
  const router = useRouter();
  const [activeMenu, setActiveMenu]   = useState('user-accounts');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [policy, setPolicy]           = useState<Policy | null>(null);
  const [pwErrors, setPwErrors]       = useState<string[]>([]);
  const [validating, setValidating]   = useState(false);
  const [formData, setFormData] = useState({
    name: '', employeeId: '', email: '', department: '',
    branch: '', role: '', password: '', confirmPassword: '',
  });

  useEffect(() => {
    fetch(`${API}/password-policy`, { headers: { Authorization: `Bearer ${auth.getToken()}` } })
      .then(r => r.json())
      .then(d => setPolicy({
        minLength:        Math.max(12, d.minLength ?? 12),
        requireUppercase: d.requireUppercase ?? true,
        requireLowercase: d.requireLowercase ?? true,
        requireNumbers:   d.requireNumbers   ?? true,
        requireSpecial:   d.requireSpecial   ?? true,
        blockCommon:      d.blockCommon      ?? true,
      }))
      .catch(() => setPolicy({
        minLength: 12, requireUppercase: true, requireLowercase: true,
        requireNumbers: true, requireSpecial: true, blockCommon: true,
      }));
  }, []);

  const update = (field: string, value: string) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (field === 'password') validatePasswordRealtime(value);
  };

  const validatePasswordRealtime = (pw: string) => {
    if (!policy || !pw) { setPwErrors([]); return; }
    const errs: string[] = [];
    if (pw.length < policy.minLength)                        errs.push(`At least ${policy.minLength} characters`);
    if (pw.length > 128)                                     errs.push('Maximum 128 characters');
    if (policy.requireUppercase && !/[A-Z]/.test(pw))        errs.push('At least 1 uppercase letter');
    if (policy.requireLowercase && !/[a-z]/.test(pw))        errs.push('At least 1 lowercase letter');
    if (policy.requireNumbers   && !/[0-9]/.test(pw))        errs.push('At least 1 number');
    if (policy.requireSpecial   && !/[^A-Za-z0-9]/.test(pw)) errs.push('At least 1 special character');
    setPwErrors(errs);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!formData.name || !formData.employeeId || !formData.email || !formData.password)
      return setError('Please fill in all required fields.');
    if (formData.password !== formData.confirmPassword)
      return setError('Passwords do not match.');
    if (pwErrors.length > 0)
      return setError('Password does not meet policy requirements.');

    setValidating(true);
    try {
      const valRes  = await fetch(`${API}/password-policy/validate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: formData.password }),
      });
      const valData = await valRes.json();
      if (!valData.valid) {
        setError(valData.errors?.join(' ') || 'Password does not meet policy.');
        setValidating(false);
        return;
      }
    } catch {}
    setValidating(false);

    setLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({
          name:       formData.name,
          employeeId: formData.employeeId,
          email:      formData.email,
          password:   formData.password,
          department: formData.department,
          branch:     formData.branch,
          role:       formData.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/users-accounts/user-accounts'), 2000);
      } else {
        setError(data.message || 'Failed to create user.');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const pw       = formData.password;
  const strength = pw ? getStrength(pw) : null;

  return (
    <>
      <style>{`
        :root {
          --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        *, *::before, *::after {
          box-sizing: border-box;
          font-family: var(--font-sans);
        }

        /* ── layout ── */
        .au-root {
          display: flex;
          height: 100vh;
          background: #ffffff;
          overflow: hidden;
        }
        .au-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
        }

        /*
          au-scroll is a normal block container — no flex centering here.
          Centering only applies to .au-center inside it.
        */
        .au-scroll {
          flex: 1;
          overflow-y: auto;
          background: #ffffff;
          padding: 36px 32px;
          scrollbar-width: thin;
          scrollbar-color: #e5e7eb transparent;
        }
        .au-scroll::-webkit-scrollbar       { width: 5px; }
        .au-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }

        /* ── page header — left-aligned, full width ── */
        .au-page-header {
          margin-bottom: 24px;
        }
        .au-page-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.3px;
          margin: 0 0 3px;
        }
        .au-page-sub {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        /* ── card centered independently ── */
        .au-center {
          width: 100%;
          max-width: 780px;
          margin: 0 auto;
        }

        /* ── card ── */
        .au-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
        }
        .au-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 16px;
          margin-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .au-card-header-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        /* ── grid ── */
        .au-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .au-full { grid-column: 1 / -1; }

        /* ── form labels ── */
        .au-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 5px;
        }
        .au-req { color: #0d9488; }

        /* ── inputs ── */
        .au-input {
          width: 100%;
          height: 38px;
          padding: 0 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 13px;
          color: #111827;
          background: #fff;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .au-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13,148,136,.1);
        }
        .au-input::placeholder { color: #9ca3af; }

        /* ── password wrapper ── */
        .au-pw-wrap           { position: relative; }
        .au-pw-wrap .au-input { padding-right: 38px; }
        .au-eye {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          padding: 2px;
          transition: color .14s;
        }
        .au-eye:hover { color: #6b7280; }

        /* ── strength bar ── */
        .au-strength-bar {
          height: 3px;
          background: #f1f5f9;
          border-radius: 2px;
          margin-top: 7px;
          overflow: hidden;
        }
        .au-strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: width .3s, background .3s;
        }
        .au-strength-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 4px;
        }
        .au-strength-lbl { font-size: 11px; font-weight: 600; }
        .au-char-count   { font-size: 11px; color: #9ca3af; }

        /* ── rules checklist ── */
        .au-rules {
          margin-top: 8px;
          background: #f9fafb;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .au-rule {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 3px;
        }
        .au-rule:last-child { margin-bottom: 0; }
        .au-rule.pass { color: #10b981; }
        .au-rule.fail { color: #ef4444; }

        /* ── match hint ── */
        .au-match {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          margin-top: 6px;
        }
        .au-match.ok { color: #10b981; }
        .au-match.no { color: #ef4444; }

        /* ── notice banner ── */
        .au-notice {
          background: #f0fdf9;
          border: 1px solid #99f6e4;
          border-radius: 8px;
          padding: 11px 14px;
          display: flex;
          gap: 9px;
          margin-top: 4px;
        }
        .au-notice p {
          font-size: 12px;
          color: #134e4a;
          line-height: 1.55;
          margin: 0;
        }

        /* ── error bar ── */
        .au-error {
          font-size: 13px;
          color: #ef4444;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 13px;
          margin-top: 12px;
        }

        /* ── actions ── */
        .au-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }
        .au-btn-cancel {
          height: 36px;
          padding: 0 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background .14s;
        }
        .au-btn-cancel:hover { background: #f9fafb; }

        .au-btn-create {
          height: 36px;
          padding: 0 18px;
          border: none;
          border-radius: 8px;
          background: #0d9488;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background .14s;
        }
        .au-btn-create:hover:not(:disabled) { background: #0f766e; }
        .au-btn-create:disabled { opacity: .55; cursor: not-allowed; }

        /* ── success screen ── */
        .au-success    { text-align: center; padding: 60px 20px; }
        .au-success h2 { font-size: 20px; font-weight: 600; color: #111827; margin: 12px 0 6px; }
        .au-success p  { font-size: 13px; color: #6b7280; }
      `}</style>

      <div className="au-root">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={() => { auth.clear(); router.push('/'); }}
        />

        <div className="au-main">
          <TopBar title="Add User" />

          <div className="au-scroll">

            {/* ── page header: left-aligned, outside the centered wrapper ── */}
            <div className="au-page-header">
              <h1 className="au-page-title">Add user</h1>
              <p className="au-page-sub">Create a new user account in the system</p>
            </div>

            {/* ── card: centered ── */}
            <div className="au-center">
              {success ? (
                <div className="au-card">
                  <div className="au-success">
                    <CheckCircle size={44} color="#10b981" />
                    <h2>User created!</h2>
                    <p>Redirecting to user accounts…</p>
                  </div>
                </div>
              ) : (
                <div className="au-card">

                  <div className="au-card-header">
                    <UserPlus size={16} color="#0d9488" />
                    <span className="au-card-header-title">New user details</span>
                  </div>

                  <div className="au-grid">

                    <div>
                      <label className="au-label">Full name <span className="au-req">*</span></label>
                      <input
                        className="au-input"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={e => update('name', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="au-label">Employee ID <span className="au-req">*</span></label>
                      <input
                        className="au-input"
                        placeholder="EMP-001"
                        value={formData.employeeId}
                        onChange={e => update('employeeId', e.target.value)}
                      />
                    </div>

                    <div className="au-full">
                      <label className="au-label">Email address <span className="au-req">*</span></label>
                      <input
                        className="au-input"
                        type="email"
                        placeholder="employee@bank.com"
                        value={formData.email}
                        onChange={e => update('email', e.target.value)}
                      />
                    </div>

                    <div>
                      <SelectDropdown
                        label="Department"
                        options={['IT', 'Finance', 'Operations', 'HR', 'Compliance', 'Customer Service']}
                        value={formData.department}
                        onChange={v => update('department', v)}
                        placeholder="Select department"
                      />
                    </div>

                    <div>
                      <SelectDropdown
                        label="Role"
                        options={['Admin', 'Manager', 'Auditor', 'User']}
                        value={formData.role}
                        onChange={v => update('role', v)}
                        placeholder="Select role"
                      />
                    </div>

                    <div>
                      <label className="au-label">Temporary password <span className="au-req">*</span></label>
                      <div className="au-pw-wrap">
                        <input
                          className="au-input"
                          type={showPw ? 'text' : 'password'}
                          placeholder={`Min ${policy?.minLength ?? 12} – max 128 characters`}
                          value={formData.password}
                          onChange={e => update('password', e.target.value)}
                        />
                        <button type="button" className="au-eye" onClick={() => setShowPw(v => !v)}>
                          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {pw && strength && (
                        <>
                          <div className="au-strength-bar">
                            <div
                              className="au-strength-fill"
                              style={{ width: `${(strength.score / 6) * 100}%`, background: strength.color }}
                            />
                          </div>
                          <div className="au-strength-meta">
                            <span className="au-strength-lbl" style={{ color: strength.color }}>{strength.label}</span>
                            <span className="au-char-count">{pw.length}/128</span>
                          </div>
                        </>
                      )}

                      {pw && policy && (
                        <div className="au-rules">
                          {[
                            { label: `At least ${policy.minLength} characters`, pass: pw.length >= policy.minLength },
                            { label: 'Maximum 128 characters',                  pass: pw.length <= 128 },
                            { label: 'Uppercase letter (A–Z)',                  pass: !policy.requireUppercase || /[A-Z]/.test(pw) },
                            { label: 'Lowercase letter (a–z)',                  pass: !policy.requireLowercase || /[a-z]/.test(pw) },
                            { label: 'Number (0–9)',                            pass: !policy.requireNumbers   || /[0-9]/.test(pw) },
                            { label: 'Special character (e.g. !@#$%^&*)',       pass: !policy.requireSpecial   || /[^A-Za-z0-9]/.test(pw) },
                          ].map((r, i) => (
                            <div key={i} className={`au-rule ${r.pass ? 'pass' : 'fail'}`}>
                              {r.pass ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {r.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="au-label">Confirm password <span className="au-req">*</span></label>
                      <div className="au-pw-wrap">
                        <input
                          className="au-input"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Repeat password"
                          value={formData.confirmPassword}
                          onChange={e => update('confirmPassword', e.target.value)}
                        />
                        <button type="button" className="au-eye" onClick={() => setShowConfirm(v => !v)}>
                          {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {formData.confirmPassword && (
                        <div className={`au-match ${formData.password === formData.confirmPassword ? 'ok' : 'no'}`}>
                          {formData.password === formData.confirmPassword
                            ? <><CheckCircle size={12} /><span>Passwords match</span></>
                            : <><XCircle size={12} /><span>Passwords do not match</span></>}
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="au-notice">
                    <Info size={14} color="#0d9488" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p>The user will receive a welcome email with their login credentials. They should change their password on first login.</p>
                  </div>

                  {error && <div className="au-error">⚠ {error}</div>}

                  <div className="au-actions">
                    <button
                      className="au-btn-cancel"
                      onClick={() => router.push('/users-accounts/user-accounts')}
                    >
                      Cancel
                    </button>
                    <button
                      className="au-btn-create"
                      disabled={loading || validating || pwErrors.length > 0}
                      onClick={handleSubmit}
                    >
                      <CheckCircle size={13} />
                      {loading || validating ? 'Creating…' : 'Create user'}
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
