'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Info, CheckCircle2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function RequestAccess() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '', employeeId: '', email: '',
    department: '', branch: '', requestedRole: '',
    password: '', confirmPassword: '', agreeTerms: false,
  });
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [errors, setErrors]               = useState<Record<string, string>>({});

  const update = (key: string, value: string | boolean) =>
    setForm(p => ({ ...p, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim())    e.fullName    = 'Required';
    if (!form.employeeId.trim())  e.employeeId  = 'Required';
    if (!form.email.trim())       e.email       = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.department)         e.department  = 'Required';
    if (!form.branch)             e.branch      = 'Required';
    if (!form.requestedRole)      e.requestedRole = 'Required';
    if (!form.password)           e.password    = 'Required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    if (!form.agreeTerms)         e.agreeTerms  = 'You must agree';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/access-requests`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fullName:      form.fullName,
          employeeId:    form.employeeId,
          email:         form.email,
          department:    form.department,
          branch:        form.branch,
          requestedRole: form.requestedRole,
          password:      form.password,
        }),
      });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else setError(data.message || 'Submission failed.');
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const inp = (key: string): React.CSSProperties => ({
    width: '100%', height: 40, padding: '0 12px',
    border: `1px solid ${errors[key] ? '#e55353' : '#e2e8f0'}`,
    borderRadius: 8, fontSize: 13, fontFamily: "'Open Sans',sans-serif",
    color: '#1a2332', background: '#fff', outline: 'none',
  });

  const departments  = ['IT', 'Finance', 'Operations', 'HR', 'Compliance', 'Customer Service'];
  const branches     = ['Headquarters', 'Downtown Branch', 'Main Street Branch', 'West Side Branch'];
  const roles        = ['Bank Teller', 'Branch Manager', 'Auditor', 'User'];

  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: "'Open Sans',sans-serif" }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a2332', marginBottom: 8 }}>Request Submitted!</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
          Your request is pending admin approval. You'll receive an email once it's reviewed.
        </p>
        <button onClick={() => router.push('/')}
          style={{ padding: '10px 24px', background: '#2db9a3', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Back to Login <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(/images/mny.jpg?v=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Open Sans',sans-serif",
      }}
    >
      {/* Left sidebar */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div>
          <img src="/images/logolgn.png" alt="Nexum" className="h-16 object-contain mb-8"
            style={{ maxWidth: 150, filter: 'brightness(1.8)' }} />
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
            {['256-bit Encryption', 'MFA Protected'].map(label => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(170,60%,50%)' }}>
                  <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                </div>
                <span style={{ color: 'hsl(210,15%,70%)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: 'hsl(210,15%,40%)' }} className="text-sm">
          © 2026 Nexum Banking ERP • All rights reserved
        </p>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md rounded-2xl p-8 lg:p-10 backdrop-blur-xl"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}>

          <div className="lg:hidden flex justify-center mb-6">
            <img src="/images/logolgn.png" alt="Nexum" className="h-28 object-contain"
              style={{ maxWidth: 300, filter: 'brightness(1.8)' }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px', textAlign: 'center' }}>Request Access</h2>
          <p style={{ fontSize: 13, color: 'hsl(210,15%,55%)', margin: '0 0 20px', textAlign: 'center' }}>Fill in your details to request system access</p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Full Name *</label>
                <input style={{ ...inp('fullName'), background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} placeholder="John Doe" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
                {errors.fullName && <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>{errors.fullName}</p>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Employee ID *</label>
                <input style={{ ...inp('employeeId'), background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} placeholder="EMP001" value={form.employeeId} onChange={e => update('employeeId', e.target.value)} />
                {errors.employeeId && <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>{errors.employeeId}</p>}
              </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Email Address *</label>
            <input style={{ ...inp('email'), background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} type="email" placeholder="john@bank.com" value={form.email} onChange={e => update('email', e.target.value)} />
            {errors.email && <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>{errors.email}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Department *</label>
              <select style={{ ...inp('department'), background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }} value={form.department} onChange={e => update('department', e.target.value)}>
                <option value="">Select</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>{errors.department}</p>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Branch *</label>
              <select style={{ ...inp('branch'), background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }} value={form.branch} onChange={e => update('branch', e.target.value)}>
                <option value="">Select</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.branch && <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>{errors.branch}</p>}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Role Requested *</label>
            <select style={{ ...inp('requestedRole'), background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }} value={form.requestedRole} onChange={e => update('requestedRole', e.target.value)}>
              <option value="">Select role</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.requestedRole && <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>{errors.requestedRole}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inp('password'), background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', paddingRight: 40 }} type={showPassword ? 'text' : 'password'} placeholder="Min 12 characters" value={form.password} onChange={e => update('password', e.target.value)} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {form.password && (() => {
                const score = [
                  form.password.length >= 12,
                  form.password.length >= 16,
                  /[A-Z]/.test(form.password),
                  /[a-z]/.test(form.password),
                  /[0-9]/.test(form.password),
                  /[!@#$%^&*()\-_=+\[\]{}|;':",.<>?/`~\\]/.test(form.password),
                ].filter(Boolean).length;
                const labels = ['Too Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
                const colors = ['#ef4444', '#f59e0b', '#f59e0b', '#3b82f6', '#10b981'];
                const strength = labels[Math.min(score, 4)];
                const color = colors[Math.min(score, 4)];
                return (
                  <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
                      <span style={{ color, fontWeight: 700 }}>{strength}</span>
                      <span style={{ color: 'hsl(210,15%,55%)' }}>{form.password.length}/128</span>
                    </div>
                    {[
                      { label: 'Min 12 characters', pass: form.password.length >= 12 },
                      { label: 'Max 128 characters', pass: form.password.length <= 128 },
                      { label: 'Uppercase letter (A–Z)', pass: /[A-Z]/.test(form.password) },
                      { label: 'Lowercase letter (a–z)', pass: /[a-z]/.test(form.password) },
                      { label: 'Number (0–9)', pass: /[0-9]/.test(form.password) },
                      { label: 'Special character (e.g. !@#$%^&*)', pass: /[!@#$%^&*()\-_=+\[\]{}|;':",.<>?/`~\\]/.test(form.password) },
                    ].map((rule, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: i < 5 ? 8 : 0 }}>
                        {rule.pass ? (
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</div>
                        ) : (
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✕</div>
                        )}
                        <span style={{ color: rule.pass ? '#10b981' : '#fca5a5' }}>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {errors.password && <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>{errors.password}</p>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input style={{ width: '100%', height: 40, padding: '0 12px', border: errors.confirmPassword ? '2px solid #fca5a5' : '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, fontFamily: "'Open Sans',sans-serif", color: 'white', background: 'rgba(255,255,255,0.06)', outline: 'none', paddingRight: 40 }} type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>✕</div>
                  <span style={{ fontSize: 12, color: '#fca5a5' }}>{errors.confirmPassword}</span>
                </div>
              )}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={form.agreeTerms} onChange={e => update('agreeTerms', e.target.checked)} style={{ accentColor: '#2db9a3' }} />
            <span style={{ fontSize: 12, color: 'hsl(210,15%,70%)' }}>I agree to the system terms and access policy</span>
          </label>
          {errors.agreeTerms && <p style={{ fontSize: 11, color: '#fca5a5', marginBottom: 12 }}>{errors.agreeTerms}</p>}

          {error && (
            <div style={{ fontSize: 13, color: '#fca5a5', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', height: 42, background: loading ? '#94a3b8' : '#2db9a3', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, fontFamily: "'Open Sans',sans-serif", cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? 'Submitting...' : 'Submit Request'} {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <div style={{ marginTop: 16, background: 'rgba(45,185,163,0.1)', border: '1px solid rgba(45,185,163,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8 }}>
          <Info size={14} color="#2db9a3" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'hsl(210,15%,70%)', margin: 0 }}>Your request will be reviewed by a System Admin before access is granted.</p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'hsl(210,15%,55%)', marginTop: 16 }}>
          Already have an account?{' '}
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#2db9a3', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Sign In</button>
        </p>
        </div>
      </div>
    </div>
  );
}
