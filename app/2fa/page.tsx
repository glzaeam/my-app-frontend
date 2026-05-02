'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api, auth } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const glassInput = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
};

const focusGlow = '0 0 0 2px hsl(170,60%,50%), 0 0 20px -4px hsl(170,60%,50%,0.3)';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function TwoFactorAuthPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [code, setCode]         = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(0); // starts at 0 until fetch completes
  const [focused, setFocused]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [isTotp, setIsTotp]     = useState(false);

  useEffect(() => {
    const userId = auth.getPendingUser();
    if (!userId) { router.push('/'); return; }
    const totp = sessionStorage.getItem('requiresTotp') === 'true';
    setIsTotp(totp);

    // ✅ Only fetch expiry for email OTP, not Authenticator TOTP
    if (!totp) {
      // Set high temp value so timer doesn't flash 5:00 while fetching
      setTimeLeft(99999);
      fetch(`${API}/auth/otp-expiry`)
        .then(r => r.json())
        .then(data => {
          const seconds = (data.codeExpiryMinutes ?? 5) * 60;
          setTimeLeft(seconds); // e.g. 600 for 10 minutes
        })
        .catch(() => setTimeLeft(300)); // fallback 5 min
    }
  }, [router]);

  // Timer only runs for email OTP
  useEffect(() => {
    if (isTotp || timeLeft <= 0 || timeLeft === 99999) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isTotp]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setError(null);
    setLoading(true);

    try {
      const userId = auth.getPendingUser();
      if (!userId) { router.push('/'); return; }

      let ok: boolean;
      let data: any;

      if (isTotp) {
        // ✅ Authenticator App flow — call verify-totp
        const res = await fetch(`${API}/auth/verify-totp`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ userId, code: fullCode }),
        });
        data = await res.json();
        ok   = res.ok;
      } else {
        // ✅ Email OTP flow — call verify-otp
        const result = await api.verifyOtp(userId, fullCode);
        ok   = result.ok;
        data = result.data;
      }

      if (!ok || !data || data.success !== true) {
        setError(data?.message || 'Invalid or expired code. Please try again.');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
        setLoading(false);
        return;
      }

      // ✅ Save token and redirect
      auth.saveToken(data.token, data.user);
      auth.clearPendingUser();
      sessionStorage.removeItem('requiresTotp');

      await refreshUser();
      router.push('/dashboard');

    } catch {
      setError('Cannot connect to server.');
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(/images/mny.jpg)',
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
          <div className="flex gap-12">
            {['256-bit Encryption', 'MFA Protected'].map((label) => (
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
          © 2026 Nexum Banking ERP · All rights reserved
        </p>
      </div>

      {/* Right 2FA Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div
          className="w-full max-w-md rounded-2xl p-8 lg:p-10 backdrop-blur-xl"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <div className="lg:hidden flex justify-center mb-6">
            <img src="/images/logolgn.png" alt="Nexum Banking ERP" className="h-28 object-contain"
              style={{ maxWidth: '300px', filter: 'brightness(1.8)' }} />
          </div>

          <div className="text-center space-y-2 mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: 'white' }}>
              Two-Factor Authentication
            </h2>

            {isTotp ? (
              // ✅ Authenticator App screen
              <>
                <p className="text-sm" style={{ color: 'hsl(210,15%,55%)' }}>
                  Enter the 6-digit code from your
                </p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(170,60%,55%)' }}>
                  Google / Microsoft Authenticator
                </p>
              </>
            ) : (
              // ✅ Email OTP screen
              <p className="text-sm" style={{ color: 'hsl(210,15%,55%)' }}>
                Enter the 6-digit code sent to your email
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code Inputs */}
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <div key={index} className="rounded-xl transition-all duration-300"
                  style={{ boxShadow: focused === `code-${index}` ? focusGlow : 'none' }}>
                  <input
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={() => setFocused(`code-${index}`)}
                    onBlur={() => setFocused(null)}
                    className="w-12 h-12 text-center text-lg font-bold rounded-xl outline-none transition-colors"
                    style={glassInput}
                  />
                </div>
              ))}
            </div>

            {/* ✅ Timer — reads CodeExpiryMinutes from DB, only for email OTP */}
            {!isTotp && (
              <div className="text-center">
                {timeLeft === 99999 ? (
                  // Still loading expiry from server
                  <p className="text-sm font-semibold" style={{ color: 'hsl(170,60%,50%)' }}>
                    Loading...
                  </p>
                ) : timeLeft > 0 ? (
                  <p className="text-sm font-semibold" style={{
                    color: timeLeft < 60 ? 'hsl(0,70%,60%)' : 'hsl(170,60%,50%)'
                  }}>
                    Code expires in {formatTime(timeLeft)}
                  </p>
                ) : (
                  <p className="text-sm font-semibold" style={{ color: 'hsl(0,70%,60%)' }}>
                    ⚠️ Code expired — please go back and login again
                  </p>
                )}
              </div>
            )}

            {/* Authenticator hint */}
            {isTotp && (
              <div className="text-center">
                <p className="text-xs" style={{ color: 'hsl(210,15%,45%)' }}>
                  The code refreshes every 30 seconds in your app
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-center" style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: 'rgb(252,165,165)'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Verify Button */}
            <motion.button
              type="submit"
              disabled={loading || code.join('').length !== 6 || (!isTotp && timeLeft === 0)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-300 mt-8"
              style={{
                background: loading
                  ? 'hsl(170,30%,35%)'
                  : 'linear-gradient(135deg, hsl(170,65%,42%), hsl(170,60%,48%))',
                color: 'white',
                boxShadow: '0 4px 20px -4px hsl(170,60%,40%,0.5)',
                cursor: loading || code.join('').length !== 6 ? 'not-allowed' : 'pointer',
                opacity: code.join('').length !== 6 ? 0.6 : 1,
                border: 'none',
              }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </motion.button>
          </form>

          <div className="flex flex-col gap-3 mt-6 text-center">
            <button
              type="button"
              onClick={() => { auth.clear(); sessionStorage.removeItem('requiresTotp'); router.push('/'); }}
              className="text-sm transition-colors"
              style={{ color: 'hsl(170,60%,55%)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {isTotp ? 'Use a different method? ' : "Didn't receive a code? "}
              <span className="font-bold">Back to Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}