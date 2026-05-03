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

type MfaMode = 'otp' | 'totp' | 'totp-setup';

export default function TwoFactorAuthPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [mode, setMode]         = useState<MfaMode>('otp');
  const [code, setCode]         = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(0);
  const [focused, setFocused]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  // totp-setup state
  const [qrUri, setQrUri]     = useState('');
  const [secret, setSecret]   = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    const userId = auth.getPendingUser();
    if (!userId) { router.push('/'); return; }

    const savedMode = (sessionStorage.getItem('mfaMode') as MfaMode) ?? 'otp';
    setMode(savedMode);

    if (savedMode === 'totp-setup') {
      // Fetch QR code from backend
      setQrLoading(true);
      fetch(`${API}/auth/totp-setup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.qrUri) {
            setQrUri(data.qrUri);
            setSecret(data.secret);
          } else {
            setError('Failed to generate QR code. Please log in again.');
          }
        })
        .catch(() => setError('Cannot connect to server.'))
        .finally(() => setQrLoading(false));
      return;
    }

    if (savedMode === 'otp') {
      setTimeLeft(99999);
      fetch(`${API}/auth/otp-expiry`)
        .then(r => r.json())
        .then(data => setTimeLeft((data.codeExpiryMinutes ?? 5) * 60))
        .catch(() => setTimeLeft(300));
    }
  }, [router]);

  // Countdown timer for OTP only
  useEffect(() => {
    if (mode !== 'otp' || timeLeft <= 0 || timeLeft === 99999) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, mode]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5)
      document.getElementById(`code-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0)
      document.getElementById(`code-${index - 1}`)?.focus();
  };

  const handleSuccess = async (data: any) => {
    auth.saveToken(data.token, data.user);
    auth.clearPendingUser();
    sessionStorage.removeItem('mfaMode');
    await refreshUser();
    router.push('/dashboard');
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

      let res: Response;
      let data: any;

      if (mode === 'totp' || mode === 'totp-setup') {
        // Both totp verify and totp-setup verify use the same endpoint
        const endpoint = mode === 'totp-setup'
          ? `${API}/auth/totp-setup/verify`
          : `${API}/auth/verify-totp`;

        res  = await fetch(endpoint, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ userId, code: fullCode }),
        });
        data = await res.json();
      } else {
        // Email/SMS OTP
        const result = await api.verifyOtp(userId, fullCode);
        res  = { ok: result.ok } as Response;
        data = result.data;
      }

      if (!data?.success) {
        setError(data?.message || 'Invalid or expired code. Please try again.');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
        setLoading(false);
        return;
      }

      await handleSuccess(data);

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

  const handleBack = () => {
    auth.clear();
    sessionStorage.removeItem('mfaMode');
    router.push('/');
  };

  // ── Render: TOTP Setup (QR screen + code input) ───────────────────────────
  if (mode === 'totp-setup') {
    return (
      <div
        className="min-h-screen w-full flex"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.75),rgba(0,0,0,0.75)),url(/images/mny.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
        }}
      >
        <div className="w-full flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl p-8 backdrop-blur-xl"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'white' }}>
                Set Up Authenticator
              </h2>
              <p className="text-sm mt-2" style={{ color: 'hsl(210,15%,55%)' }}>
                Your role requires Authenticator app verification
              </p>
            </div>

            {qrLoading ? (
              <p className="text-center text-sm" style={{ color: 'hsl(210,15%,55%)' }}>
                Generating QR code...
              </p>
            ) : (
              <>
                {/* Step 1 — Scan QR */}
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-2" style={{ color: 'hsl(170,60%,55%)' }}>
                    Step 1 — Scan this QR code
                  </p>
                  <p className="text-xs mb-4" style={{ color: 'hsl(210,15%,50%)' }}>
                    Open{' '}
                    <strong style={{ color: 'white' }}>Google Authenticator</strong> or{' '}
                    <strong style={{ color: 'white' }}>Microsoft Authenticator</strong> and scan:
                  </p>
                  <div className="flex justify-center mb-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUri)}`}
                      alt="QR Code"
                      style={{
                        borderRadius: 12,
                        border: '2px solid rgba(255,255,255,0.15)',
                        width: 180, height: 180,
                      }}
                    />
                  </div>
                  <p className="text-center text-xs"
                    style={{ color: 'hsl(210,15%,40%)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    Manual key: {secret}
                  </p>
                </div>

                {/* Step 2 — Enter code */}
                <form onSubmit={handleSubmit}>
                  <p className="text-sm font-semibold mb-3" style={{ color: 'hsl(170,60%,55%)' }}>
                    Step 2 — Enter the 6-digit code
                  </p>
                  <div className="flex gap-2 justify-center mb-2">
                    {code.map((digit, index) => (
                      <div key={index} className="rounded-xl transition-all duration-300"
                        style={{ boxShadow: focused === `code-${index}` ? focusGlow : 'none' }}>
                        <input
                          id={`code-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleCodeChange(index, e.target.value)}
                          onKeyDown={e => handleKeyDown(index, e)}
                          onFocus={() => setFocused(`code-${index}`)}
                          onBlur={() => setFocused(null)}
                          className="w-12 h-12 text-center text-lg font-bold rounded-xl outline-none"
                          style={glassInput}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs mb-4" style={{ color: 'hsl(210,15%,40%)' }}>
                    The code refreshes every 30 seconds in your app
                  </p>

                  {error && (
                    <div className="rounded-xl px-4 py-3 text-sm text-center mb-4" style={{
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: 'rgb(252,165,165)',
                    }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading || code.join('').length !== 6}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-12 rounded-xl text-sm font-bold transition-all duration-300"
                    style={{
                      background: loading || code.join('').length !== 6
                        ? 'hsl(170,30%,25%)'
                        : 'linear-gradient(135deg,hsl(170,65%,42%),hsl(170,60%,48%))',
                      color: code.join('').length !== 6 ? 'hsl(210,15%,45%)' : 'white',
                      border: 'none',
                      cursor: loading || code.join('').length !== 6 ? 'not-allowed' : 'pointer',
                      opacity: code.join('').length !== 6 ? 0.5 : 1,
                    }}
                  >
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </motion.button>
                </form>
              </>
            )}

            <div className="text-center mt-4">
              <button onClick={handleBack}
                style={{ color: 'hsl(170,60%,55%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: OTP or TOTP verify (existing screen) ──────────────────────────
  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(/images/mny.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
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
            {mode === 'totp' ? (
              <>
                <p className="text-sm" style={{ color: 'hsl(210,15%,55%)' }}>
                  Enter the 6-digit code from your
                </p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(170,60%,55%)' }}>
                  Google / Microsoft Authenticator
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'hsl(210,15%,55%)' }}>
                Enter the 6-digit code sent to your email
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code inputs */}
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
                    onChange={e => handleCodeChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onFocus={() => setFocused(`code-${index}`)}
                    onBlur={() => setFocused(null)}
                    className="w-12 h-12 text-center text-lg font-bold rounded-xl outline-none transition-colors"
                    style={glassInput}
                  />
                </div>
              ))}
            </div>

            {/* Timer — email OTP only */}
            {mode === 'otp' && (
              <div className="text-center">
                {timeLeft === 99999 ? (
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

            {/* TOTP hint */}
            {mode === 'totp' && (
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
                color: 'rgb(252,165,165)',
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Verify button */}
            <motion.button
              type="submit"
              disabled={loading || code.join('').length !== 6 || (mode === 'otp' && timeLeft === 0)}
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
              onClick={handleBack}
              className="text-sm transition-colors"
              style={{ color: 'hsl(170,60%,55%)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {mode === 'totp' ? 'Use a different method? ' : "Didn't receive a code? "}
              <span className="font-bold">Back to Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}