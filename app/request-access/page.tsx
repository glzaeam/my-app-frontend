'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { validatePassword, checkPwnedPassword, PasswordValidation } from '@/lib/passwordValidator';
import PasswordStrengthMeter from '@/app/components/PasswordStrengthMeter';

const glassInput = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
};

const focusGlow = '0 0 0 2px hsl(170,60%,50%), 0 0 20px -4px hsl(170,60%,50%,0.3)';

// Auto-capitalize: first letter of every word
function autoCapitalize(value: string): string {
  return value
    .split(' ')
    .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
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
  const [passwordValidation, setPasswordValidation]   = useState<PasswordValidation | null>(null);

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

  // Real-time password validation
  useEffect(() => {
    if (formData.password) {
      setPasswordValidation(validatePassword(formData.password));
    } else {
      setPasswordValidation(null);
    }
  }, [formData.password]);

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
      // Auto-capitalize first letter of every word (handles spacebar for middle names)
      setFormData(prev => ({ ...prev, [name]: autoCapitalize(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      setError('Password requirements not met:\n' + validation.errors.join('\n'));
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

  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.75),rgba(0,0,0,0.75)),url(/images/mny.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Open Sans', sans-serif",
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
          <div className="flex gap-12">
            {['256-bit Encryption', 'MFA Protected'].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(170,60%,50%)' }}>
                  <span style={{ color: 'white', fontSize: '12px' }}>✔</span>
                </div>
                <span style={{ color: 'hsl(210,15%,70%)' }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, padding: '16px 20px', background: 'rgba(45,185,163,0.1)', border: '1px solid rgba(45,185,163,0.3)', borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(170,60%,60%)', marginBottom: 8 }}>How it works</div>
            <div style={{ fontSize: 12, color: 'hsl(210,15%,60%)', lineHeight: 1.6 }}>
              1. Submit your request below<br />
              2. An admin will review your request<br />
              3. You'll receive an email once approved<br />
              4. Your account will be ready to use
            </div>
          </div>
        </div>
        <p style={{ color: 'hsl(210,15%,40%)' }} className="text-sm">
          © 2026 Nexum Banking ERP · All rights reserved
        </p>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 lg:ml-auto flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
        <div
          className="w-full max-w-md rounded-2xl p-8 lg:p-10 backdrop-blur-xl my-8"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <img src="/images/logolgn.png" alt="Nexum Banking ERP" className="h-28 object-contain"
              style={{ maxWidth: '300px', filter: 'brightness(1.8)' }} />
          </div>

          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: 'white' }}>
              Request Access
            </h2>
            <p className="text-sm" style={{ color: 'hsl(210,15%,55%)' }}>
              Fill in your details — an admin will review and approve your request
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── First Name + Last Name ── */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'First Name', name: 'firstName', placeholder: 'Juan' },
                { label: 'Last Name',  name: 'lastName',  placeholder: 'Dela Cruz' },
              ].map(({ label, name, placeholder }) => (
                <div key={name} className="space-y-2">
                  <label className="text-xs font-semibold block" style={{ color: 'hsl(210,15%,70%)' }}>{label}</label>
                  <div className="rounded-xl transition-all duration-300"
                    style={{ boxShadow: focused === name ? focusGlow : 'none' }}>
                    <input
                      placeholder={placeholder}
                      name={name}
                      value={formData[name as keyof typeof formData] as string}
                      onChange={handleInputChange}
                      onFocus={() => setFocused(name)}
                      onBlur={() => setFocused(null)}
                      className="w-full px-3 h-10 rounded-xl text-xs outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                      style={glassInput}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Employee ID ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold block" style={{ color: 'hsl(210,15%,70%)' }}>Employee ID</label>
              <div className="rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'employeeId' ? focusGlow : 'none' }}>
                <input
                  placeholder="EMP001"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  onFocus={() => setFocused('employeeId')}
                  onBlur={() => setFocused(null)}
                  className="w-full px-3 h-10 rounded-xl text-xs outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                  style={glassInput}
                />
              </div>
            </div>

            {/* ── Email ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold" style={{ color: 'hsl(210,15%,70%)' }}>Email Address</label>
              <div className="rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'email' ? focusGlow : 'none' }}>
                <input
                  type="email" placeholder="john@bank.com" name="email"
                  value={formData.email} onChange={handleInputChange}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  className="w-full px-3 h-10 rounded-xl text-xs outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                  style={glassInput}
                />
              </div>
            </div>

            {/* ── Department + Branch ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold block" style={{ color: 'hsl(210,15%,70%)' }}>Department</label>
                <div className="rounded-xl" style={{ boxShadow: focused === 'department' ? focusGlow : 'none' }}>
                  <select name="department" value={formData.department} onChange={handleInputChange}
                    onFocus={() => setFocused('department')} onBlur={() => setFocused(null)}
                    className="w-full px-3 h-10 rounded-xl text-xs outline-none" style={glassInput}>
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
                <label className="text-xs font-semibold block" style={{ color: 'hsl(210,15%,70%)' }}>Assigned Branch</label>
                <div className="rounded-xl" style={{ boxShadow: focused === 'branch' ? focusGlow : 'none' }}>
                  <select name="branch" value={formData.branch} onChange={handleInputChange}
                    onFocus={() => setFocused('branch')} onBlur={() => setFocused(null)}
                    className="w-full px-3 h-10 rounded-xl text-xs outline-none" style={glassInput}>
                    <option value="">Select</option>
                    <option value="HO001">Head Office</option>
                    <option value="Branch 1">Branch 1</option>
                    <option value="Branch 2">Branch 2</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Role ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold" style={{ color: 'hsl(210,15%,70%)' }}>Role Requested</label>
              <div className="rounded-xl" style={{ boxShadow: focused === 'requestedRole' ? focusGlow : 'none' }}>
                <select name="requestedRole" value={formData.requestedRole} onChange={handleInputChange}
                  onFocus={() => setFocused('requestedRole')} onBlur={() => setFocused(null)}
                  className="w-full px-3 h-10 rounded-xl text-xs outline-none" style={glassInput}>
                  <option value="">Select role</option>
                  <option value="Branch Manager">Branch Manager</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Bank Teller">Bank Teller</option>
                </select>
              </div>
            </div>

            {/* ── Password ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold block" style={{ color: 'hsl(210,15%,70%)' }}>Password</label>
              <div className="relative rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'password' ? focusGlow : 'none' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 12 chars, uppercase, number, special"
                  name="password" value={formData.password} onChange={handleInputChange}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  maxLength={128}
                  className="w-full pl-3 pr-9 h-10 rounded-xl text-xs outline-none placeholder:text-[hsl(210,10%,35%)]"
                  style={glassInput}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'hsl(210,15%,50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              <PasswordStrengthMeter password={formData.password} validation={passwordValidation} />
              {pwnedWarning && (
                <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgb(252,165,165)' }}>
                  ⚠ This password was found in a known data breach. Please choose a different one.
                </div>
              )}
            </div>

            {/* ── Confirm Password ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold block" style={{ color: 'hsl(210,15%,70%)' }}>Confirm Password</label>
              <div className="relative rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'confirmPassword' ? focusGlow : 'none' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                  onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)}
                  maxLength={128}
                  className="w-full pl-3 pr-9 h-10 rounded-xl text-xs outline-none placeholder:text-[hsl(210,10%,35%)]"
                  style={glassInput}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'hsl(210,15%,50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className="text-xs" style={{ color: formData.password === formData.confirmPassword ? 'hsl(170,60%,50%)' : 'hsl(0,70%,65%)' }}>
                  {formData.password === formData.confirmPassword ? '✔ Passwords match' : '✘ Passwords do not match'}
                </p>
              )}
            </div>

            {/* ── Terms ── */}
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="terms" name="agreeToTerms"
                checked={formData.agreeToTerms} onChange={handleInputChange}
                className="w-4 h-4 rounded" style={{ accentColor: 'hsl(170,60%,50%)' }} />
              <label htmlFor="terms" className="text-xs" style={{ color: 'hsl(210,15%,60%)' }}>
                I agree to the system terms and access policy
              </label>
            </div>

            {/* ── Error ── */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-xs space-y-1" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgb(252,165,165)' }}>
                {error.split('\n').map((line, i) => (
                  <p key={i}>{i === 0 ? `⚠ ${line}` : `  • ${line}`}</p>
                ))}
              </div>
            )}

            {/* ── Success ── */}
            {success && (
              <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: 'rgb(110,231,183)' }}>
                ✔ Request submitted! An admin will review your request. Redirecting to login...
              </div>
            )}

            {/* ── Submit ── */}
            <button type="submit" disabled={loading || success}
              className="w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-300 mt-2"
              style={{
                background: loading || success ? 'hsl(170,30%,35%)' : 'linear-gradient(135deg, hsl(170,65%,42%), hsl(170,60%,48%))',
                color: 'white',
                boxShadow: '0 4px 20px -4px hsl(170,60%,40%,0.5)',
                cursor: loading || success ? 'not-allowed' : 'pointer',
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