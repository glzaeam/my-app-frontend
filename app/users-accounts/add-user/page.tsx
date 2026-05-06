'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { useState, useEffect } from 'react';
import SelectDropdown from '@/app/components/SelectDropdown';
import { UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react';
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
  if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
  if (score <= 4) return { score, label: 'Strong', color: '#3b82f6' };
  return { score, label: 'Very Strong', color: '#10b981' };
}

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
}

interface ApiRole {
  id: string;
  name: string;
  description: string | null;
}

export default function AddUserPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [pwErrors, setPwErrors] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: '',
    email: '',
    department: '',
    branch: '',
    role: '',
    password: '',
    confirmPassword: '',
  });

  // Fetch roles
  useEffect(() => {
    setRolesLoading(true);
    fetch(`${API}/roles`, { headers: { Authorization: `Bearer ${auth.getToken()}` } })
      .then(r => r.json())
      .then(data => {
        const list: ApiRole[] = Array.isArray(data) ? data : (data.roles ?? data.items ?? data.data ?? []);
        setRoles(list);
      })
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false));
  }, []);

  // Fetch password policy
  useEffect(() => {
    fetch(`${API}/password-policy`, { headers: { Authorization: `Bearer ${auth.getToken()}` } })
      .then(r => r.json())
      .then(d => {
        const p: Policy = {
          minLength: Math.max(12, d.minLength ?? d.MinLength ?? 12),
          requireUppercase: d.requireUppercase ?? d.RequireUppercase ?? true,
          requireLowercase: d.requireLowercase ?? d.RequireLowercase ?? true,
          requireNumbers: d.requireNumbers ?? d.RequireNumbers ?? true,
          requireSpecial: d.requireSpecial ?? d.RequireSpecial ?? true,
        };
        setPolicy(p);
      })
      .catch(() => setPolicy({
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecial: true,
      }));
  }, []);

  const validatePassword = (pw: string, p: Policy | null) => {
    if (!p || !pw) { setPwErrors([]); return; }
    const errs: string[] = [];
    if (pw.length < p.minLength) errs.push(`At least ${p.minLength} characters`);
    if (pw.length > 128) errs.push('Maximum 128 characters');
    if (p.requireUppercase && !/[A-Z]/.test(pw)) errs.push('At least 1 uppercase letter');
    if (p.requireLowercase && !/[a-z]/.test(pw)) errs.push('At least 1 lowercase letter');
    if (p.requireNumbers && !/[0-9]/.test(pw)) errs.push('At least 1 number');
    if (p.requireSpecial && !/[^A-Za-z0-9]/.test(pw)) errs.push('At least 1 special character');
    setPwErrors(errs);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'firstName' || name === 'lastName') {
      setFormData(prev => ({ ...prev, [name]: autoCapitalize(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'password') validatePassword(value, policy);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First and last names are required.');
      return;
    }
    if (!formData.employeeId.trim() || !formData.email.trim()) {
      setError('Employee ID and email are required.');
      return;
    }
    if (!formData.department || !formData.branch || !formData.role) {
      setError('Department, branch, and role are required.');
      return;
    }
    if (pwErrors.length > 0) {
      setError('Password does not meet requirements.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    setLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.getToken()}` },
        body: JSON.stringify({
          name: fullName,
          employeeId: formData.employeeId,
          email: formData.email,
          password: formData.password,
          department: formData.department,
          branch: formData.branch,
          role: formData.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setFormData({
            firstName: '', lastName: '', employeeId: '', email: '',
            department: '', branch: '', role: '', password: '', confirmPassword: '',
          });
        }, 2000);
      } else {
        setError(data.message || 'Failed to create user.');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const pw = formData.password;
  const strength = pw ? getStrength(pw) : null;
  const roleNames = roles.map(r => r.name);

  return (
   <DashboardLayout title="Add User" activeMenu="add-user">
      <div style={{ maxWidth: 700 }}>
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <UserPlus size={20} color="#0d9488" />
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Create New User</h1>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CheckCircle size={44} color="#10b981" />
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: '12px 0 6px' }}>User created successfully!</h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>The new user account is ready to use.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                {/* First Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>First name *</label>
                  <input
                    style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: '#fff', outline: 'none' }}
                    name="firstName"
                    placeholder="Juan"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>Last name *</label>
                  <input
                    style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: '#fff', outline: 'none' }}
                    name="lastName"
                    placeholder="Dela Cruz"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>Employee ID *</label>
                  <input
                    style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: '#fff', outline: 'none' }}
                    name="employeeId"
                    placeholder="EMP-001"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>Email address *</label>
                  <input
                    style={{ width: '100%', height: 38, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: '#fff', outline: 'none' }}
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

                {/* Role */}
                <div style={{ gridColumn: '1 / -1' }}>
                  {rolesLoading ? (
                    <><label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>Role</label>
                    <div style={{ fontSize: 12, color: '#9ca3af', padding: '9px 0' }}>Loading roles…</div></>
                  ) : roleNames.length === 0 ? (
                    <><label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>Role</label>
                    <div style={{ fontSize: 12, color: '#9ca3af', padding: '9px 0' }}>No roles found</div></>
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
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ width: '100%', height: 38, padding: '0 38px 0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: '#fff', outline: 'none' }}
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button type="button" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }} onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {strength && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(strength.score / 6) * 100}%`, background: strength.color, transition: 'width .3s' }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: strength.color, marginTop: 4 }}>{strength.label}</div>
                    </div>
                  )}
                  {pwErrors.length > 0 && (
                    <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>
                      {pwErrors.map(err => <div key={err}>• {err}</div>)}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>Confirm Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ width: '100%', height: 38, padding: '0 38px 0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: '#fff', outline: 'none' }}
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                    <button type="button" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }} onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.password && formData.confirmPassword && (
                    <div style={{ fontSize: 12, marginTop: 4, color: formData.password === formData.confirmPassword ? '#10b981' : '#ef4444' }}>
                      {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 13px', marginTop: 16, fontSize: 13, color: '#ef4444' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" style={{ height: 36, padding: '0 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background .14s' }} onClick={() => setFormData({ firstName: '', lastName: '', employeeId: '', email: '', department: '', branch: '', role: '', password: '', confirmPassword: '' })}>
                  Clear
                </button>
                <button type="submit" disabled={loading} style={{ height: 36, padding: '0 18px', border: 'none', borderRadius: 8, background: '#0d9488', color: '#fff', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'background .14s' }}>
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
