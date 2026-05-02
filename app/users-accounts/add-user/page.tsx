'use client';

import { useState, useEffect, useRef } from 'react';
import SelectDropdown from '@/app/components/SelectDropdown';
import { UserPlus, Info, Eye, EyeOff, CheckCircle, XCircle, X } from 'lucide-react';
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

// Exact same function from RequestAccessPage
function autoCapitalize(value: string): string {
  return value
    .split(' ')
    .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}

interface Policy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  blockCommon: boolean;
}

interface ApiRole {
  id: string;
  name: string;
  description: string | null;
}

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function AddUserModal({ open, onClose, onCreated }: AddUserModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);
  const [showPw, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [policy, setPolicy]             = useState<Policy | null>(null);
  const [pwErrors, setPwErrors]         = useState<string[]>([]);
  const [validating, setValidating]     = useState(false);
  const [roles, setRoles]               = useState<ApiRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // firstName + lastName — same as RequestAccessPage, no "name" field
  const [formData, setFormData] = useState({
    firstName:       '',
    lastName:        '',
    employeeId:      '',
    email:           '',
    department:      '',
    branch:          '',
    role:            '',
    password:        '',
    confirmPassword: '',
  });

  // Fetch roles live from /roles (not hardcoded)
  useEffect(() => {
    if (!open) return;
    setRolesLoading(true);
    fetch(`${API}/roles`, { headers: { Authorization: `Bearer ${auth.getToken()}` } })
      .then(r => r.json())
      .then(data => {
        const list: ApiRole[] = Array.isArray(data)
          ? data
          : (data.roles ?? data.items ?? data.data ?? []);
        setRoles(list);
      })
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false));
  }, [open]);

  // Fetch password policy
  useEffect(() => {
    if (!open) return;
    fetch(`${API}/password-policy`, { headers: { Authorization: `Bearer ${auth.getToken()}` } })
      .then(r => r.json())
      .then(d => {
        const p: Policy = {
          minLength:        Math.max(12, d.minLength ?? d.MinLength ?? 12),
          requireUppercase: d.requireUppercase ?? d.RequireUppercase ?? true,
          requireLowercase: d.requireLowercase ?? d.RequireLowercase ?? true,
          requireNumbers:   d.requireNumbers   ?? d.RequireNumbers   ?? true,
          requireSpecial:   d.requireSpecial   ?? d.RequireSpecial   ?? true,
          blockCommon:      d.blockCommon       ?? true,
        };
        setPolicy(p);
        if (formData.password) validatePw(formData.password, p);
      })
      .catch(() => setPolicy({
        minLength: 12, requireUppercase: true, requireLowercase: true,
        requireNumbers: true, requireSpecial: true, blockCommon: true,
      }));
  }, [open]);

  const validatePw = (pw: string, p: Policy | null) => {
    if (!p || !pw) { setPwErrors([]); return; }
    const errs: string[] = [];
    if (pw.length < p.minLength)                         errs.push(`At least ${p.minLength} characters`);
    if (pw.length > 128)                                 errs.push('Maximum 128 characters');
    if (p.requireUppercase && !/[A-Z]/.test(pw))         errs.push('At least 1 uppercase letter');
    if (p.requireLowercase && !/[a-z]/.test(pw))         errs.push('At least 1 lowercase letter');
    if (p.requireNumbers   && !/[0-9]/.test(pw))         errs.push('At least 1 number');
    if (p.requireSpecial   && !/[^A-Za-z0-9]/.test(pw)) errs.push('At least 1 special character');
    setPwErrors(errs);
  };

  // handleInputChange mirrors RequestAccessPage exactly
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'firstName' || name === 'lastName') {
      setFormData(prev => ({ ...prev, [name]: autoCapitalize(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'password') validatePw(value, policy);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '', lastName: '', employeeId: '',
      email: '', department: '', branch: '',
      role: '', password: '', confirmPassword: '',
    });
    setPwErrors([]);
    setError(null);
    setSuccess(false);
    setShowPw(false);
    setShowConfirm(false);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation order matches RequestAccessPage
    if (!formData.firstName.trim())  return setError('Please enter your first name.');
    if (!formData.lastName.trim())   return setError('Please enter your last name.');
    if (!formData.employeeId.trim()) return setError('Please enter your Employee ID.');
    if (!formData.email.trim())      return setError('Please enter your email address.');
    if (!formData.password)          return setError('Please enter a password.');
    if (pwErrors.length > 0)         return setError('Password does not meet policy requirements.');
    if (formData.password !== formData.confirmPassword)
      return setError('Passwords do not match.');

    setValidating(true);
    try {
      const valRes  = await fetch(`${API}/password-policy/validate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: formData.password }),
      });
      const valData = await valRes.json();
      if (!valData.valid) {
        setError(valData.errors?.join(' ') || 'Password does not meet policy.');
        setValidating(false);
        return;
      }
    } catch {}
    setValidating(false);

    // Combine into full name for API — same as RequestAccessPage
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    setLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({
          name:       fullName,
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
        setTimeout(() => { onCreated?.(); handleClose(); }, 1500);
      } else {
        setError(data.message || 'Failed to create user.');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const pw        = formData.password;
  const strength  = pw ? getStrength(pw) : null;
  const roleNames = roles.map(r => r.name);

  return (
    <>
      <style>{`
        :root { --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        *, *::before, *::after { box-sizing: border-box; font-family: var(--font-sans); }
        .au-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06); }
        .au-card-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; }
        .au-card-header-left { display: flex; align-items: center; gap: 8px; }
        .au-card-header-title { font-size: 14px; font-weight: 600; color: #111827; }
        .au-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .au-full { grid-column: 1 / -1; }
        .au-label { display: block; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; }
        .au-req { color: #0d9488; }
        .au-input { width: 100%; height: 38px; padding: 0 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; background: #fff; outline: none; transition: border-color .15s, box-shadow .15s; }
        .au-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,.1); }
        .au-input::placeholder { color: #9ca3af; }
        .au-pw-wrap { position: relative; }
        .au-pw-wrap .au-input { padding-right: 38px; }
        .au-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 2px; transition: color .14s; }
        .au-eye:hover { color: #6b7280; }
        .au-strength-bar { height: 3px; background: #f1f5f9; border-radius: 2px; margin-top: 7px; overflow: hidden; }
        .au-strength-fill { height: 100%; border-radius: 2px; transition: width .3s, background .3s; }
        .au-strength-meta { display: flex; justify-content: space-between; margin-top: 4px; }
        .au-strength-lbl { font-size: 11px; font-weight: 600; }
        .au-char-count { font-size: 11px; color: #9ca3af; }
        .au-rules { margin-top: 8px; background: #f9fafb; border: 1px solid #f1f5f9; border-radius: 8px; padding: 10px 12px; }
        .au-rule { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280; margin-bottom: 3px; }
        .au-rule:last-child { margin-bottom: 0; }
        .au-rule.pass { color: #10b981; }
        .au-rule.fail { color: #ef4444; }
        .au-match { display: flex; align-items: center; gap: 5px; font-size: 12px; margin-top: 6px; }
        .au-match.ok { color: #10b981; }
        .au-match.no { color: #ef4444; }
        .au-notice { background: #f0fdf9; border: 1px solid #99f6e4; border-radius: 8px; padding: 11px 14px; display: flex; gap: 9px; margin-top: 4px; }
        .au-notice p { font-size: 12px; color: #134e4a; line-height: 1.55; margin: 0; }
        .au-error { font-size: 13px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 13px; margin-top: 12px; }
        .au-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
        .au-btn-cancel { height: 36px; padding: 0 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; color: #6b7280; font-size: 13px; font-weight: 500; cursor: pointer; transition: background .14s; }
        .au-btn-cancel:hover { background: #f9fafb; }
        .au-btn-create { height: 36px; padding: 0 18px; border: none; border-radius: 8px; background: #0d9488; color: #fff; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background .14s; }
        .au-btn-create:hover:not(:disabled) { background: #0f766e; }
        .au-btn-create:disabled { opacity: .55; cursor: not-allowed; }
        .au-success { text-align: center; padding: 60px 20px; }
        .au-success h2 { font-size: 20px; font-weight: 600; color: #111827; margin: 12px 0 6px; }
        .au-success p { font-size: 13px; color: #6b7280; }
        .au-role-hint { font-size: 12px; color: #9ca3af; padding: 9px 0; font-style: italic; }
        .au-close-btn { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; padding: 4px; border-radius: 6px; transition: color .14s; }
        .au-close-btn:hover { color: #6b7280; }
        .aum-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,0.45); backdrop-filter: blur(3px); animation: aum-fade .15s ease; }
        @keyframes aum-fade { from { opacity: 0 } to { opacity: 1 } }
        .aum-panel { width: 100%; max-width: 680px; max-height: 92vh; overflow-y: auto; animation: aum-slide .18s ease; scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
        .aum-panel::-webkit-scrollbar { width: 5px; }
        .aum-panel::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
        @keyframes aum-slide { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div className="aum-overlay" ref={overlayRef} onClick={handleOverlayClick}>
        <div className="aum-panel">
          <div className="au-card">

            <div className="au-card-header">
              <div className="au-card-header-left">
                <UserPlus size={16} color="#0d9488" />
                <span className="au-card-header-title">New user details</span>
              </div>
              <button type="button" className="au-close-btn" onClick={handleClose}>
                <X size={16} />
              </button>
            </div>

            {success ? (
              <div className="au-success">
                <CheckCircle size={44} color="#10b981" />
                <h2>User created!</h2>
                <p>Closing…</p>
              </div>
            ) : (
              <>
                <div className="au-grid">

                  {/* First Name — autoCapitalize on every word */}
                  <div>
                    <label className="au-label">First name <span className="au-req">*</span></label>
                    <input
                      className="au-input"
                      name="firstName"
                      placeholder="Juan"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Last Name — autoCapitalize on every word */}
                  <div>
                    <label className="au-label">Last name <span className="au-req">*</span></label>
                    <input
                      className="au-input"
                      name="lastName"
                      placeholder="Dela Cruz"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label className="au-label">Employee ID <span className="au-req">*</span></label>
                    <input
                      className="au-input"
                      name="employeeId"
                      placeholder="EMP-001"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="au-label">Email address <span className="au-req">*</span></label>
                    <input
                      className="au-input"
                      type="email"
                      name="email"
                      placeholder="employee@bank.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <SelectDropdown
                      label="Department"
                      options={['IT', 'Finance', 'Operations', 'HR', 'Compliance', 'Customer Service']}
                      value={formData.department}
                      onChange={v => setFormData(prev => ({ ...prev, department: v }))}
                      placeholder="Select department"
                    />
                  </div>

                  {/* Branch */}
                  <div>
                    <SelectDropdown
                      label="Branch"
                      options={['Head Office', 'Branch 1', 'Branch 2']}
                      value={formData.branch}
                      onChange={v => setFormData(prev => ({ ...prev, branch: v }))}
                      placeholder="Select branch"
                    />
                  </div>

                  {/* Role — live from /roles, not hardcoded */}
                  <div className="au-full">
                    {rolesLoading ? (
                      <>
                        <label className="au-label">Role</label>
                        <div className="au-role-hint">Loading roles…</div>
                      </>
                    ) : roleNames.length === 0 ? (
                      <>
                        <label className="au-label">Role</label>
                        <div className="au-role-hint">No roles found — create roles in Role Management first.</div>
                      </>
                    ) : (
                      <SelectDropdown
                        label="Role"
                        options={roleNames}
                        value={formData.role}
                        onChange={v => setFormData(prev => ({ ...prev, role: v }))}
                        placeholder="Select role"
                      />
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="au-label">Temporary password <span className="au-req">*</span></label>
                    <div className="au-pw-wrap">
                      <input
                        className="au-input"
                        type={showPw ? 'text' : 'password'}
                        name="password"
                        placeholder={`Min ${policy?.minLength ?? 12} – max 128 characters`}
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                      <button type="button" className="au-eye" onClick={() => setShowPw(v => !v)}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {pw && strength && (
                      <>
                        <div className="au-strength-bar">
                          <div className="au-strength-fill" style={{ width: `${(strength.score / 6) * 100}%`, background: strength.color }} />
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

                  {/* Confirm Password */}
                  <div>
                    <label className="au-label">Confirm password <span className="au-req">*</span></label>
                    <div className="au-pw-wrap">
                      <input
                        className="au-input"
                        type={showConfirm ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Repeat password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
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
                  <button className="au-btn-cancel" onClick={handleClose}>Cancel</button>
                  <button
                    className="au-btn-create"
                    disabled={loading || validating || pwErrors.length > 0}
                    onClick={handleSubmit}
                  >
                    <CheckCircle size={13} />
                    {loading || validating ? 'Creating…' : 'Create user'}
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