'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { checkPwnedPassword } from '@/lib/passwordValidator';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204';

const glassInput = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
};

const focusGlow = '0 0 0 2px hsl(170,60%,50%), 0 0 20px -4px hsl(170,60%,50%,0.3)';

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

function getStrengthLabel(score: number): { label: string; color: string } {
  if (score <= 1) return { label: 'Very Weak', color: 'hsl(0,70%,55%)' };
  if (score <= 2) return { label: 'Weak',      color: 'hsl(20,80%,55%)' };
  if (score <= 3) return { label: 'Fair',      color: 'hsl(40,80%,55%)' };
  if (score <= 4) return { label: 'Strong',    color: 'hsl(200,70%,55%)' };
  return               { label: 'Very Strong', color: 'hsl(170,60%,50%)' };
}

function calcScore(pw: string, policy: Policy | null): number {
  let score = 0;
  if (pw.length >= (policy?.minLength ?? 12)) score++;
  if (pw.length >= 16) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export default function RequestAccessPage() {
  const router = useRouter();
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused]                         = useState<string | null>(null);
  const [error, setError]                             = useState<string | null>(null);
  const [success, setSuccess]                         = useState(false);
  const [loading, setLoading]                         = useState(false);
  const [pwnedWarning, setPwnedWarning]               = useState(false);
  const [policy, setPolicy]                           = useState<Policy | null>(null);
  const [pwErrors, setPwErrors]                       = useState<string[]>([]);

  const [formData, setFormData] = useState({
    firstName:       '',
    lastName:        '',
    employeeId:      '',
    email:           '',
    department:      '',
    branch:          '',
    requestedRole:   '',
    password:        '',
    confirmPassword: '',
    agreeToTerms:    false,
  });

  // Fetch live password policy from backend
  useEffect(() => {
    fetch(`${API}/password-policy/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: '' }),
    }).catch(() => {});

    fetch(`${API}/password-policy`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setPolicy({
          minLength:        Math.max(12, d.minLength        ?? d.MinLength        ?? 12),
          requireUppercase: d.requireUppercase ?? d.RequireUppercase ?? true,
          requireLowercase: d.requireLowercase ?? d.RequireLowercase ?? true,
          requireNumbers:   d.requireNumbers   ?? d.RequireNumbers   ?? true,
          requireSpecial:   d.requireSpecial   ?? d.RequireSpecial   ?? true,
        });
      })
      .catch(() => setPolicy({
        minLength: 12, requireUppercase: true,
        requireLowercase: true, requireNumbers: true, requireSpecial: true,
      }));
  }, []);

  // Real-time password validation against fetched policy
  const validatePw = (pw: string, p: Policy | null) => {
    if (!pw || !p) { setPwErrors([]); return; }
    const errs: string[] = [];
    if (pw.length < p.minLength)                         errs.push(`At least ${p.minLength} characters`);
    if (pw.length > 128)                                 errs.push('Maximum 128 characters');
    if (p.requireUppercase && !/[A-Z]/.test(pw))         errs.push('At least 1 uppercase letter');
    if (p.requireLowercase && !/[a-z]/.test(pw))         errs.push('At least 1 lowercase letter');
    if (p.requireNumbers   && !/[0-9]/.test(pw))         errs.push('At least 1 number');
    if (p.requireSpecial   && !/[^A-Za-z0-9]/.test(pw)) errs.push('At least 1 special character');
    setPwErrors(errs);
  };

  // HIBP check (debounced 800ms)
  useEffect(() => {
    if (!formData.password || formData.password.length < 8) {
      setPwnedWarning(false);
      return;
    }
    const timer = setTimeout(async () => {
      const pwned = await checkPwnedPassword(formData.password);
      setPwnedWarning(pwned);
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const cb = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: cb.checked }));
    } else if (name === 'firstName' || name === 'lastName') {
      setFormData(prev => ({ ...prev, [name]: autoCapitalize(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'password') validatePw(value, policy);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.firstName.trim())  return setError('Please enter your first name.');
    if (!formData.lastName.trim())   return setError('Please enter your last name.');
    if (!formData.employeeId.trim()) return setError('Please enter your Employee ID.');
    if (!formData.email.trim())      return setError('Please enter your email address.');
    if (!formData.password)          return setError('Please enter a password.');

    if (pwErrors.length > 0) {
      setError('Password requirements not met:\n' + pwErrors.join('\n'));
      return;
    }

    if (pwnedWarning) {
      setError('This password was found in a known data breach. Please choose a different password.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and access policy.');
      return;
    }

    // Final backend validation
    try {
      const valRes  = await fetch(`${API}/password-policy/validate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: formData.password }),
      });
      const valData = await valRes.json();
      if (!valData.valid) {
        setError('Password requirements not met:\n' + (valData.errors ?? []).join('\n'));
        return;
      }
    } catch {}

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    setLoading(true);
    try {
      const { ok, data } = await api.submitAccessRequest({
        fullName,
        employeeId:    formData.employeeId,
        email:         formData.email,
        department:    formData.department,
        branch:        formData.branch,
        requestedRole: formData.requestedRole,
        password:      formData.password,
      });

      if (!ok || !data.success) {
        if (data.message?.toLowerCase().includes('email')) {
          setError('This email address is already registered. Please use a different email.');
        } else if (data.message?.toLowerCase().includes('employee')) {
          setError('This Employee ID is already in use or has a pending request.');
        } else {
          setError(data.message || 'Submission failed. Please try again.');
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/'), 3000);

    } catch {
      setError('Cannot connect to server. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  const pw      = formData.password;
  const score   = pw ? calcScore(pw, policy) : 0;
  const strength = pw ? getStrengthLabel(score) : null;

  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.75),rgba(0,0,0,0.75)),url(/images/mny.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
      }}
    >
      {/* Left Sidebar */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div>
          <img src="/images/logolgn.png" alt="Nexum" className="h-16 object-contain mb-8"
            style={{ maxWidth: '150px', filter: 'brightness(1.8)' }} />
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            <span style={{ color: 'white' }}>Secure</span><br />
            <span style={{ color: 'hsl(170,60%,50%)' }}>Banking</span><br />
            <span style={{ color: 'white' }}>Operations</span>
          </h1>
          <p className="text-base mb-8 leading-relaxed" style={{ color: 'hsl(210,15%,60%)' }}>
            Enterprise-grade security with role-based access, real-time monitoring,
            and tamper-proof audit trails.
          </p>
        

          <div style={{ marginTop: 32, padding: '16px 20px', background: 'rgba(45,185,163,0.1)', border: '1px solid rgba(45,185,163,0.3)', borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(170,60%,60%)', marginBottom: 8 }}>How it works</div>
            <div style={{ fontSize: 12, color: 'hsl(210,15%,60%)', lineHeight: 1.6 }}>
              1. Submit your request below<br />
              2. An admin will review your request<br />
              3. You'll receive an email once approved<br />
              4. Your account will be ready to use
            </div>
          </div>

          {/* Live policy display */}
          {policy && (
            <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(170,60%,60%)', marginBottom: 8 }}>Password Requirements</div>
              <div style={{ fontSize: 11, color: 'hsl(210,15%,60%)', lineHeight: 1.8 }}>
                • Minimum {policy.minLength} characters<br />
                {policy.requireUppercase && <>• Uppercase letter (A–Z)<br /></>}
                {policy.requireLowercase && <>• Lowercase letter (a–z)<br /></>}
                {policy.requireNumbers   && <>• Number (0–9)<br /></>}
                {policy.requireSpecial   && <>• Special character (!@#$%^&*)<br /></>}
              </div>
            </div>
          )}
        </div>
        <p style={{ color: 'hsl(210,15%,40%)' }} className="text-sm">
          © 2026 Nexum Banking ERP · All rights reserved
        </p>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 lg:ml-auto flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
        <div
          className="w-full max-w-md rounded-2xl backdrop-blur-xl my-8"
          style={{ 
            padding: 'var(--spacing-lg)',
            background: 'rgba(255,255,255,0.08)', 
            border: '1px solid rgba(255,255,255,0.2)' 
          }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-4">
            <img src="/images/logolgn.png" alt="Nexum Banking ERP" className="h-24 object-contain"
              style={{ maxWidth: '100%', filter: 'brightness(1.8)' }} />
          </div>

          <div className="text-center space-y-2 mb-6">
            <h2 
              className="font-bold leading-tight"
              style={{ 
                fontSize: 'var(--font-size-2xl)',
                color: 'white' 
              }}
            >
              Request Access
            </h2>
            <p 
              style={{ 
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(210,15%,55%)' 
              }}
            >
              Fill in your details — an admin will review and approve your request
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* First Name + Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'First Name', name: 'firstName', placeholder: 'Juan' },
                { label: 'Last Name',  name: 'lastName',  placeholder: 'Dela Cruz' },
              ].map(({ label, name, placeholder }) => (
                <div key={name} className="space-y-2">
                  <label 
                    className="font-semibold block" 
                    style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(210,15%,70%)' }}
                  >
                    {label}
                  </label>
                  <div className="rounded-xl transition-all duration-300"
                    style={{ boxShadow: focused === name ? focusGlow : 'none' }}>
                    <input
                      placeholder={placeholder}
                      name={name}
                      value={formData[name as keyof typeof formData] as string}
                      onChange={handleInputChange}
                      onFocus={() => setFocused(name)}
                      onBlur={() => setFocused(null)}
                      className="w-full px-4 rounded-xl outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                      style={{
                        ...glassInput,
                        height: 'var(--mobile-input-height)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Employee ID */}
            <div className="space-y-2">
              <label 
                className="font-semibold block" 
                style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(210,15%,70%)' }}
              >
                Employee ID
              </label>
              <div className="rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'employeeId' ? focusGlow : 'none' }}>
                <input
                  placeholder="EMP001"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  onFocus={() => setFocused('employeeId')}
                  onBlur={() => setFocused(null)}
                  className="w-full px-4 rounded-xl outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                  style={{
                    ...glassInput,
                    height: 'var(--mobile-input-height)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label 
                className="font-semibold block" 
                style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(210,15%,70%)' }}
              >
                Email Address
              </label>
              <div className="rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'email' ? focusGlow : 'none' }}>
                <input
                  type="email" placeholder="john@bank.com" name="email"
                  value={formData.email} onChange={handleInputChange}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  className="w-full px-4 rounded-xl outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                  style={{
                    ...glassInput,
                    height: 'var(--mobile-input-height)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
              </div>
            </div>

            {/* Department + Branch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="font-semibold block" style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(210,15%,70%)' }}>Department</label>
                <div className="rounded-xl" style={{ boxShadow: focused === 'department' ? focusGlow : 'none' }}>
                  <select name="department" value={formData.department} onChange={handleInputChange}
                    onFocus={() => setFocused('department')} onBlur={() => setFocused(null)}
                    className="w-full px-4 rounded-xl outline-none" style={{ ...glassInput, height: 'var(--mobile-input-height)', fontSize: 'var(--font-size-sm)' }}>
                    <option value="">Select</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold block" style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(210,15%,70%)' }}>Assigned Branch</label>
                <div className="rounded-xl" style={{ boxShadow: focused === 'branch' ? focusGlow : 'none' }}>
                  <select name="branch" value={formData.branch} onChange={handleInputChange}
                    onFocus={() => setFocused('branch')} onBlur={() => setFocused(null)}
                    className="w-full px-4 rounded-xl outline-none" style={{ ...glassInput, height: 'var(--mobile-input-height)', fontSize: 'var(--font-size-sm)' }}>
                    <option value="">Select</option>
                    <option value="HO001">Head Office</option>
                    <option value="Branch 1">Branch 1</option>
                    <option value="Branch 2">Branch 2</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="font-semibold block" style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(210,15%,70%)' }}>Role Requested</label>
              <div className="rounded-xl" style={{ boxShadow: focused === 'requestedRole' ? focusGlow : 'none' }}>
                <select name="requestedRole" value={formData.requestedRole} onChange={handleInputChange}
                  onFocus={() => setFocused('requestedRole')} onBlur={() => setFocused(null)}
                  className="w-full px-4 rounded-xl outline-none" style={{ ...glassInput, height: 'var(--mobile-input-height)', fontSize: 'var(--font-size-sm)' }}>
                  <option value="">Select role</option>
                  <option value="Branch Manager">Branch Manager</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Bank Teller">Bank Teller</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="font-semibold block" style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(210,15%,70%)' }}>Password</label>
              <div className="relative rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'password' ? focusGlow : 'none' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={`Min ${policy?.minLength ?? 12} chars, uppercase, number, special`}
                  name="password" value={formData.password} onChange={handleInputChange}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  maxLength={128}
                  className="w-full pl-4 pr-10 rounded-xl outline-none placeholder:text-[hsl(210,10%,35%)]"
                  style={{
                    ...glassInput,
                    height: 'var(--mobile-input-height)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'hsl(210,15%,50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {pw && strength && (
                <>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${(score / 6) * 100}%`, background: strength.color, transition: 'width .3s, background .3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: strength.color }}>{strength.label}</span>
                    <span style={{ fontSize: 11, color: 'hsl(210,15%,50%)' }}>{pw.length}/128</span>
                  </div>
                </>
              )}

              {/* Live policy checklist */}
              {pw && policy && (
                <div style={{ marginTop: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px' }}>
                  {[
                    { label: `At least ${policy.minLength} characters`, pass: pw.length >= policy.minLength },
                    { label: 'Maximum 128 characters',                   pass: pw.length <= 128 },
                    { label: 'Uppercase letter (A–Z)',                   pass: !policy.requireUppercase || /[A-Z]/.test(pw) },
                    { label: 'Lowercase letter (a–z)',                   pass: !policy.requireLowercase || /[a-z]/.test(pw) },
                    { label: 'Number (0–9)',                             pass: !policy.requireNumbers   || /[0-9]/.test(pw) },
                    { label: 'Special character (!@#$%^&*)',              pass: !policy.requireSpecial   || /[^A-Za-z0-9]/.test(pw) },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 2, color: r.pass ? 'hsl(170,60%,50%)' : 'hsl(0,70%,65%)' }}>
                      <span>{r.pass ? '✔' : '✘'}</span>
                      {r.label}
                    </div>
                  ))}
                </div>
              )}

              {pwnedWarning && (
                <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgb(252,165,165)' }}>
                  ⚠ This password was found in a known data breach. Please choose a different one.
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="font-semibold block" style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(210,15%,70%)' }}>Confirm Password</label>
              <div className="relative rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'confirmPassword' ? focusGlow : 'none' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                  onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)}
                  maxLength={128}
                  className="w-full pl-4 pr-10 rounded-xl outline-none placeholder:text-[hsl(210,10%,35%)]"
                  style={{
                    ...glassInput,
                    height: 'var(--mobile-input-height)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'hsl(210,15%,50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className="text-xs" style={{ color: formData.password === formData.confirmPassword ? 'hsl(170,60%,50%)' : 'hsl(0,70%,65%)' }}>
                  {formData.password === formData.confirmPassword ? '✔ Passwords match' : '✘ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="terms" name="agreeToTerms"
                checked={formData.agreeToTerms} onChange={handleInputChange}
                className="w-4 h-4 rounded" style={{ accentColor: 'hsl(170,60%,50%)' }} />
              <label htmlFor="terms" className="block" style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(210,15%,60%)' }}>
                I agree to the system terms and access policy
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 space-y-1" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgb(252,165,165)', fontSize: 'var(--font-size-sm)' }}>
                {error.split('\n').map((line, i) => (
                  <p key={i}>{i === 0 ? `⚠ ${line}` : `  • ${line}`}</p>
                ))}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: 'rgb(110,231,183)', fontSize: 'var(--font-size-sm)' }}>
                ✔ Request submitted! An admin will review your request. Redirecting to login...
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading || success || pwErrors.length > 0}
              className="w-full rounded-xl font-bold flex items-center justify-center transition-all duration-300 mt-3"
              style={{
                height: 'var(--mobile-button-height)',
                background: loading || success || pwErrors.length > 0 ? 'hsl(170,30%,35%)' : 'linear-gradient(135deg, hsl(170,65%,42%), hsl(170,60%,48%))',
                color: 'white',
                boxShadow: '0 4px 20px -4px hsl(170,60%,40%,0.5)',
                fontSize: 'var(--font-size-sm)',
                cursor: loading || success || pwErrors.length > 0 ? 'not-allowed' : 'pointer',
                border: 'none',
              }}>
              {loading ? 'Submitting...' : success ? 'Submitted! ✔' : 'Submit Request'}
            </button>
          </form>

          <p className="text-center text-xs mt-4" style={{ color: 'hsl(210,15%,50%)' }}>
            Already have an account?{' '}
            <button onClick={() => router.push('/')} className="font-bold transition-colors"
              style={{ color: 'hsl(170,60%,55%)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}