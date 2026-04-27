'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_API_URL;

const glassInput = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
};
const focusGlow = '0 0 0 2px hsl(170,60%,50%), 0 0 20px -4px hsl(170,60%,50%,0.3)';

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 12) score++;   // was 8
  if (password.length >= 16) score++;   // was 12
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { score, label: 'Weak',      color: '#ef4444' };
  if (score <= 3) return { score, label: 'Fair',      color: '#f59e0b' };
  if (score <= 4) return { score, label: 'Strong',    color: '#3b82f6' };
  return              { score, label: 'Very Strong', color: '#10b981' };
}

interface Policy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
}

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [focused, setFocused]                 = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [validating, setValidating]           = useState(true);
  const [tokenValid, setTokenValid]           = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [success, setSuccess]                 = useState(false);
  const [policy, setPolicy]                   = useState<Policy | null>(null);

  useEffect(() => {
    if (!token) { setValidating(false); return; }
    Promise.all([
      fetch(`${API}/auth/validate-reset-token?token=${token}`).then(r => r.json()),
      fetch(`${API}/password-policy`).then(r => r.json()),
    ]).then(([tokenData, policyData]) => {
      setTokenValid(tokenData.valid);
      setPolicy({
        minLength:        Math.max(12, policyData.minLength ?? 12),
        requireUppercase: policyData.requireUppercase ?? true,
        requireLowercase: policyData.requireLowercase ?? true,
        requireNumbers:   policyData.requireNumbers   ?? true,
        requireSpecial:   policyData.requireSpecial   ?? true,
      });
      setValidating(false);
    }).catch(() => {
      setPolicy({ minLength:12, requireUppercase:true, requireLowercase:true, requireNumbers:true, requireSpecial:true });
      setValidating(false);
    });
  }, [token]);

  const rules = policy ? [
    { label: `Min ${policy.minLength} characters`,      pass: newPassword.length >= policy.minLength },
    { label: 'Max 128 characters',                      pass: newPassword.length <= 128 },
    { label: 'Uppercase letter (A–Z)',                  pass: !policy.requireUppercase || /[A-Z]/.test(newPassword) },
    { label: 'Lowercase letter (a–z)',                  pass: !policy.requireLowercase || /[a-z]/.test(newPassword) },
    { label: 'Number (0–9)',                            pass: !policy.requireNumbers   || /[0-9]/.test(newPassword) },
    { label: 'Special character (e.g. !@#$%^&*)',      pass: !policy.requireSpecial   || /[^A-Za-z0-9]/.test(newPassword) },
  ] : [];

  const allPassed = rules.every(r => r.pass) && newPassword.length > 0;
  const strength  = newPassword ? getStrength(newPassword) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allPassed)                            { setError('Password does not meet all requirements.'); return; }
    if (newPassword !== confirmPassword)       { setError('Passwords do not match.'); return; }
    if (newPassword.length > 128)             { setError('Password must not exceed 128 characters.'); return; }

    try {
      const valRes  = await fetch(`${API}/password-policy/validate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: newPassword }),
      });
      const valData = await valRes.json();
      if (!valData.valid) { setError(valData.errors?.join(' ') || 'Password does not meet policy.'); return; }
    } catch {}

    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (data.success) { setSuccess(true); setTimeout(() => router.push('/'), 3000); }
      else setError(data.message || 'Failed to reset password.');
    } catch { setError('Cannot connect to server.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full flex" style={{ backgroundImage:'linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)),url(/images/bgg.jpg)',backgroundSize:'cover',backgroundPosition:'center',backgroundAttachment:'fixed',fontFamily:"'Open Sans',sans-serif" }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div><img src="/images/logolgn.png" alt="Nexum" className="h-40 object-contain mb-2" style={{ maxWidth:'400px',filter:'brightness(1.8)' }}/></div>
        <div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            <span style={{ color:'white' }}>Secure</span><br/>
            <span style={{ color:'hsl(170,60%,50%)' }}>Banking</span><br/>
            <span style={{ color:'white' }}>Operations</span>
          </h1>
          <p className="text-base mb-8 leading-relaxed" style={{ color:'hsl(210,15%,60%)' }}>Enterprise-grade security with role-based access, real-time monitoring, and tamper-proof audit trails.</p>
          <div className="flex gap-12 mb-12">
            {['256-bit Encryption','MFA Protected'].map(label => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background:'hsl(170,60%,50%)' }}>
                  <span style={{ color:'white',fontSize:'12px' }}>✓</span>
                </div>
                <span style={{ color:'hsl(210,15%,70%)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color:'hsl(210,15%,40%)' }} className="text-sm">© 2026 Nexum Banking ERP • All rights reserved</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md rounded-2xl p-8 lg:p-10 backdrop-blur-md" style={{ background:'rgba(30,40,55,0.4)',border:'1px solid rgba(255,255,255,0.1)' }}>
          {validating ? (
            <div className="text-center py-12"><p className="text-sm" style={{ color:'hsl(210,15%,55%)' }}>Validating reset link...</p></div>
          ) : !tokenValid ? (
            <div className="text-center space-y-4 py-6">
              <div className="text-5xl">⛔</div>
              <h2 className="text-2xl font-bold" style={{ color:'white' }}>Link Invalid or Expired</h2>
              <p className="text-sm" style={{ color:'hsl(210,15%,60%)' }}>This reset link is invalid or has already expired.</p>
              <button onClick={() => router.push('/forgot-password')} className="text-sm font-bold" style={{ color:'hsl(170,60%,55%)' }}>Request new link →</button>
            </div>
          ) : success ? (
            <div className="text-center space-y-4 py-6">
              <div className="text-5xl">✅</div>
              <h2 className="text-2xl font-bold" style={{ color:'white' }}>Password Reset!</h2>
              <p className="text-sm" style={{ color:'hsl(210,15%,60%)' }}>Your password has been updated. Redirecting to login...</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl lg:text-3xl font-bold" style={{ color:'white' }}>Set new password</h2>
                <p className="text-sm" style={{ color:'hsl(210,15%,55%)' }}>Must meet all security requirements below</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color:'hsl(210,15%,70%)' }}>New Password</label>
                  <div className="relative rounded-xl transition-all duration-300" style={{ boxShadow:focused==='new'?focusGlow:'none' }}>
                    <input type={showNew?'text':'password'}
                      placeholder={`Min ${policy?.minLength??12} – max 128 characters`}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      onFocus={() => setFocused('new')} onBlur={() => setFocused(null)}
                      className="w-full pl-4 pr-12 h-12 rounded-xl text-sm outline-none placeholder:text-[hsl(210,10%,35%)]"
                      style={glassInput} required maxLength={128}/>
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color:'hsl(210,15%,50%)' }}>
                      {showNew?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                    </button>
                  </div>

                  {newPassword && strength && (
                    <div>
                      <div style={{ height:4,background:'rgba(255,255,255,0.1)',borderRadius:2,overflow:'hidden' }}>
                        <div style={{ height:'100%',width:`${(strength.score/6)*100}%`,background:strength.color,borderRadius:2,transition:'width 0.3s,background 0.3s' }}/>
                      </div>
                      <div style={{ display:'flex',justifyContent:'space-between',marginTop:3 }}>
                        <span style={{ fontSize:11,color:strength.color,fontWeight:700 }}>{strength.label}</span>
                        <span style={{ fontSize:11,color:'hsl(210,15%,50%)' }}>{newPassword.length}/128</span>
                      </div>
                    </div>
                  )}

                  {newPassword && rules.length > 0 && (
                    <div style={{ padding:'10px 12px',background:'rgba(255,255,255,0.04)',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)' }}>
                      {rules.map((r, i) => (
                        <div key={i} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:i<rules.length-1?4:0 }}>
                          {r.pass?<CheckCircle size={12} color="#10b981"/>:<XCircle size={12} color="#ef4444"/>}
                          <span style={{ fontSize:12,color:r.pass?'#10b981':'#ef4444' }}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold" style={{ color:'hsl(210,15%,70%)' }}>Confirm Password</label>
                  <div className="relative rounded-xl transition-all duration-300" style={{ boxShadow:focused==='confirm'?focusGlow:'none' }}>
                    <input type={showConfirm?'text':'password'} placeholder="Repeat password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
                      className="w-full pl-4 pr-12 h-12 rounded-xl text-sm outline-none placeholder:text-[hsl(210,10%,35%)]"
                      style={glassInput} required maxLength={128}/>
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color:'hsl(210,15%,50%)' }}>
                      {showConfirm?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                  {confirmPassword && (
                    <>
                      <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:8 }}>
                        {newPassword===confirmPassword
                          ?<><CheckCircle size={12} color="#10b981"/><span style={{ fontSize:12,color:'#10b981' }}>Passwords match</span></>
                          :<><XCircle size={12} color="#ef4444"/><span style={{ fontSize:12,color:'#ef4444' }}>Passwords do not match</span></>}
                      </div>

                      {(() => {
                        const confirmStrength = getStrength(confirmPassword);
                        return (
                          <>
                            <div style={{ height:4,background:'rgba(255,255,255,0.1)',borderRadius:2,overflow:'hidden',marginBottom:8 }}>
                              <div style={{ height:'100%',width:`${(confirmStrength.score/6)*100}%`,background:confirmStrength.color,borderRadius:2,transition:'width 0.3s,background 0.3s' }}/>
                            </div>
                            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:12 }}>
                              <span style={{ fontSize:11,color:confirmStrength.color,fontWeight:700 }}>{confirmStrength.label}</span>
                              <span style={{ fontSize:11,color:'hsl(210,15%,50%)' }}>{confirmPassword.length}/128</span>
                            </div>

                            <div style={{ padding:'10px 12px',background:'rgba(255,255,255,0.04)',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)' }}>
                              {rules.map((r, i) => (
                                <div key={i} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:i<rules.length-1?4:0 }}>
                                  {r.pass?<CheckCircle size={12} color="#10b981"/>:<XCircle size={12} color="#ef4444"/>}
                                  <span style={{ fontSize:12,color:r.pass?'#10b981':'#ef4444' }}>{r.label}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm" style={{ background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'rgb(252,165,165)' }}>
                    ⚠️ {error}
                  </div>
                )}

                <motion.button type="submit"
                  disabled={loading || !allPassed || newPassword !== confirmPassword}
                  whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-300 mt-2"
                  style={{ background:(!allPassed||newPassword!==confirmPassword)?'hsl(170,20%,30%)':loading?'hsl(170,30%,35%)':'linear-gradient(135deg,hsl(170,65%,42%),hsl(170,60%,48%))',color:'white',boxShadow:'0 4px 20px -4px hsl(170,60%,40%,0.5)',cursor:loading?'not-allowed':'pointer' }}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </motion.button>
              </form>
            </>
          )}
          <p className="text-center text-sm mt-6" style={{ color:'hsl(210,15%,50%)' }}>
            <button onClick={() => router.push('/')} className="font-bold" style={{ color:'hsl(170,60%,55%)' }}>Back to Login</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background:'#0f1a2e' }}><p style={{ color:'white' }}>Loading...</p></div>}>
      <ResetPasswordForm/>
    </Suspense>
  );
}
