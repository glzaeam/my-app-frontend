'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const glassInput = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
};

const focusGlow = '0 0 0 2px hsl(170,60%,50%), 0 0 20px -4px hsl(170,60%,50%,0.3)';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail]           = useState('');
  const [focused, setFocused]       = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId.trim()) {
      setError('Please enter your Employee ID.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      // TODO: wire to API endpoint when ready
      await new Promise(resolve => setTimeout(resolve, 1500)); // simulate API call
      setSuccess(true);
    } catch {
      setError('Cannot connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(/images/mny.jpg)',
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
            style={{ maxWidth: 150, filter: 'brightness(1.8)' }} />
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            <span style={{ color: 'white' }}>Secure</span><br />
            <span style={{ color: 'hsl(170,60%,50%)' }}>Banking</span><br />
            <span style={{ color: 'white' }}>Operations</span>
          </h1>
          <p className="text-base mb-8 leading-relaxed" style={{ color: 'hsl(210,15%,60%)' }}>
            Enterprise-grade security with role-based access, real-time monitoring, and tamper-proof audit trails.
          </p>
          <div className="flex gap-12 mb-12">
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
          © 2026 Nexum Banking ERP • All rights reserved
        </p>
      </div>

      {/* Right Reset Section */}
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
              Reset your password
            </h2>
            <p className="text-sm" style={{ color: 'hsl(210,15%,55%)' }}>
              Enter your Employee ID and registered email
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📧</div>
              <div className="rounded-xl px-4 py-4 text-sm" style={{
                background: 'rgba(52,211,153,0.15)',
                border: '1px solid rgba(52,211,153,0.3)',
                color: 'rgb(110,231,183)'
              }}>
                ✅ If an account exists with that Employee ID and email, a reset link has been sent.
                Please check your inbox.
              </div>
              <button onClick={() => router.push('/')} className="text-sm font-bold transition-colors"
                style={{ color: 'hsl(170,60%,55%)' }}>
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Employee ID */}
              <div className="space-y-2">
                <label className="text-sm font-semibold" style={{ color: 'hsl(210,15%,70%)' }}>
                  Employee ID
                </label>
                <div className="rounded-xl transition-all duration-300"
                  style={{ boxShadow: focused === 'employeeId' ? focusGlow : 'none' }}>
                  <input
                    placeholder="e.g. ADM001"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    onFocus={() => setFocused('employeeId')}
                    onBlur={() => setFocused(null)}
                    className="w-full px-4 h-12 rounded-xl text-sm outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                    style={glassInput}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold" style={{ color: 'hsl(210,15%,70%)' }}>
                  Email Address
                </label>
                <div className="rounded-xl transition-all duration-300"
                  style={{ boxShadow: focused === 'email' ? focusGlow : 'none' }}>
                  <input
                    type="email"
                    placeholder="john@bank.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    className="w-full px-4 h-12 rounded-xl text-sm outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                    style={glassInput}
                    required
                  />
                </div>
                <p className="text-xs" style={{ color: 'hsl(210,15%,45%)' }}>
                  Must match the email registered to your account.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: 'rgb(252,165,165)'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-300 mt-6"
                style={{
                  background: loading
                    ? 'hsl(170,30%,35%)'
                    : 'linear-gradient(135deg, hsl(170,65%,42%), hsl(170,60%,48%))',
                  color: 'white',
                  boxShadow: '0 4px 20px -4px hsl(170,60%,40%,0.5)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
            </form>
          )}

          {!success && (
            <p className="text-center text-sm mt-6" style={{ color: 'hsl(210,15%,50%)' }}>
              <button onClick={() => router.push('/')} className="font-bold transition-colors"
                style={{ color: 'hsl(170,60%,55%)' }}>
                Back to Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
