'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, Lock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';
import { api, auth } from '@/lib/api';

const RECAPTCHA_SITE_KEY = '6LdsVrIsAAAAAKQcGn0pIeIORcgQnuLRkKeBOYXm';

const glassInput = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
};

const focusGlow = '0 0 0 2px hsl(170,60%,50%), 0 0 20px -4px hsl(170,60%,50%,0.3)';

export default function LoginPage() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId.trim() || !password.trim()) {
      setError('Please enter your Employee ID and password.');
      return;
    }

    if (!captchaToken) {
      setError('Please complete the reCAPTCHA verification first.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.login(employeeId, password, captchaToken);

      // Account locked due to too many failed attempts
      if (data.locked) {
        setIsLocked(true);
        setCountdown((data.remainingMinutes ?? 15) * 60);
        setError('Account temporarily locked. Check your email for details.');
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      if (!data.success) {
        setAttemptsLeft(data.attemptsLeft ?? null);
        setError('Invalid credentials.');
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      // ==================== SUCCESS CASES ====================

      // Grace login — no MFA required
      if (data.token) {
        auth.saveToken(data.token, data.user);
        router.push('/dashboard');
        return;
      }

      // Authenticator App — already set up (verify code)
      if (data.requiresTotp) {
        auth.savePendingUser(data.userId);
        sessionStorage.setItem('mfaMode', 'totp');
        router.push('/2fa');
        return;
      }

      // Authenticator App — first time setup (show QR code)
      if (data.requiresTotpSetup) {
        auth.savePendingUser(data.userId);
        sessionStorage.setItem('mfaMode', 'totp-setup');
        router.push('/2fa');
        return;
      }

      // SMS / Email OTP fallback
      auth.savePendingUser(data.userId);
      sessionStorage.setItem('mfaMode', 'otp');
      router.push('/2fa');
    } catch {
      setError('Cannot connect to server. Is the API running?');
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,0,0,0.75),rgba(0,0,0,0.75)),url(/images/mny.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
      }}
    >
      {/* Left sidebar */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div>
          <img
            src="/images/logolgn.png"
            alt="Nexum"
            className="h-16 object-contain mb-8"
            style={{ maxWidth: 150, filter: 'brightness(1.8)' }}
          />
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            <span style={{ color: 'white' }}>Secure</span>
            <br />
            <span style={{ color: 'hsl(170,60%,50%)' }}>Banking</span>
            <br />
            <span style={{ color: 'white' }}>Operations</span>
          </h1>
          <p
            className="text-base mb-8 leading-relaxed"
            style={{ color: 'hsl(210,15%,60%)' }}
          >
            Enterprise-grade security with role-based access, real-time monitoring,
            and tamper-proof audit trails.
          </p>
          <div className="flex gap-12">
            {['256-bit Encryption', 'MFA Protected'].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(170,60%,50%)' }}
                >
                  <Check className="w-3 h-3" style={{ color: 'white' }} />
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

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div
          className="w-full max-w-md rounded-2xl p-8 lg:p-10 backdrop-blur-xl"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <img
              src="/images/logolgn.png"
              alt="Nexum"
              className="h-28 object-contain"
              style={{ maxWidth: 300, filter: 'brightness(1.8)' }}
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: 'white' }}>
              Welcome back
            </h2>
            <p className="text-sm mt-1" style={{ color: 'hsl(210,15%,55%)' }}>
              Sign in to your account
            </p>
          </div>

          {/* Lockout banner */}
          {isLocked && (
            <div
              className="rounded-xl px-4 py-4 mb-6 text-center"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)',
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="w-4 h-4" style={{ color: 'rgb(252,165,165)' }} />
                <p className="text-sm font-bold" style={{ color: 'rgb(252,165,165)' }}>
                  Account Temporarily Locked
                </p>
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgb(252,165,165)' }}>
                Try again in <span className="font-bold text-white">{fmt(countdown)}</span>
              </p>
              <p className="text-xs mt-2" style={{ color: 'hsl(210,15%,55%)' }}>
                Check your email for details.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee ID */}
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: 'hsl(210,15%,70%)' }}>
                Employee ID
              </label>
              <div
                className="rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'emp' ? focusGlow : 'none' }}
              >
                <input
                  placeholder="e.g. ADM001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  onFocus={() => setFocused('emp')}
                  onBlur={() => setFocused(null)}
                  disabled={isLocked}
                  className="w-full px-4 h-12 rounded-xl text-sm outline-none placeholder:text-[hsl(210,10%,35%)]"
                  style={{ ...glassInput, opacity: isLocked ? 0.5 : 1 }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold" style={{ color: 'hsl(210,15%,70%)' }}>
                Password
              </label>
              <div
                className="relative rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'pw' ? focusGlow : 'none' }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('pw')}
                  onBlur={() => setFocused(null)}
                  disabled={isLocked}
                  className="w-full pl-4 pr-12 h-12 rounded-xl text-sm outline-none placeholder:text-[hsl(210,10%,35%)]"
                  style={{ ...glassInput, opacity: isLocked ? 0.5 : 1 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'hsl(210,15%,50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-between items-center">
                {attemptsLeft !== null && attemptsLeft > 0 && !isLocked && (
                  <div className="flex items-center gap-1" style={{ color: 'hsl(30,90%,60%)' }}>
                    <AlertTriangle className="w-3 h-3" />
                    <p className="text-xs">
                      {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before lockout
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm font-medium ml-auto"
                  style={{ color: 'hsl(170,60%,55%)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* reCAPTCHA */}
            {!isLocked && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  margin: '12px auto',
                }}
              >
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  theme="light"
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                />
              </div>
            )}

            {/* Error Message */}
            {error && !isLocked && (
              <div
                className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: 'rgb(252,165,165)',
                }}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || isLocked || !captchaToken}
              whileHover={{ scale: loading || isLocked || !captchaToken ? 1 : 1.01 }}
              whileTap={{ scale: loading || isLocked || !captchaToken ? 1 : 0.98 }}
              className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 mt-2"
              style={{
                background:
                  loading || isLocked || !captchaToken
                    ? 'hsl(170,30%,25%)'
                    : 'linear-gradient(135deg,hsl(170,65%,42%),hsl(170,60%,48%))',
                color: !captchaToken ? 'hsl(210,15%,45%)' : 'white',
                boxShadow: captchaToken ? '0 4px 20px -4px hsl(170,60%,40%,0.5)' : 'none',
                cursor: loading || isLocked || !captchaToken ? 'not-allowed' : 'pointer',
                opacity: !captchaToken ? 0.5 : 1,
                border: 'none',
              }}
            >
              {isLocked
                ? (
                  <>
                    <Lock className="w-4 h-4" /> Locked
                  </>
                )
                : loading
                  ? 'Signing in...'
                  : !captchaToken
                    ? 'Complete verification to sign in'
                    : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'hsl(210,15%,50%)' }}>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => router.push('/request-access')}
              className="font-bold"
              style={{ color: 'hsl(170,60%,55%)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Request Access
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}