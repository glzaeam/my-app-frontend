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

export default function TwoFactorAuthPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(275);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      console.log('2FA verification code:', fullCode);
      router.push('/dashboard');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend = () => {
    setTimeLeft(275);
    console.log('Resend code requested');
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/images/bgg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: "'Open Sans', sans-serif",
      }}
    >
      {/* Left Sidebar */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div>
          <img
            src="/images/logolgn.png"
            alt="Nexum"
            className="h-40 object-contain mb-2"
            style={{ maxWidth: '400px', filter: 'brightness(1.8)' }}
          />
        </div>

        <div>
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
            Enterprise-grade security with role-based access, real-time monitoring, and
            tamper-proof audit trails.
          </p>

          <div className="flex gap-12 mb-12">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'hsl(170,60%,50%)' }}
              >
                <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
              </div>
              <span style={{ color: 'hsl(210,15%,70%)' }}>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'hsl(170,60%,50%)' }}
              >
                <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
              </div>
              <span style={{ color: 'hsl(210,15%,70%)' }}>MFA Protected</span>
            </div>
          </div>
        </div>

        <p style={{ color: 'hsl(210,15%,40%)' }} className="text-sm">
          © 2026 Nexum Banking ERP • All rights reserved
        </p>
      </div>

      {/* Right 2FA Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div
          className="w-full max-w-md rounded-2xl p-8 lg:p-10 backdrop-blur-md"
          style={{
            background: 'rgba(30,40,55,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-6">
            <img
              src="/images/logolgn.png"
              alt="Nexum Banking ERP"
              className="h-28 object-contain"
              style={{ maxWidth: '300px', filter: 'brightness(1.8)' }}
            />
          </div>

          <div className="text-center space-y-2 mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: 'white' }}>
              Two-Factor Authentication
            </h2>
            <p className="text-sm" style={{ color: 'hsl(210,15%,55%)' }}>
              We sent a 6-digit code to your registered phone/email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code Input Grid */}
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <div
                  key={index}
                  className="rounded-xl transition-all duration-300"
                  style={{ boxShadow: focused === `code-${index}` ? focusGlow : 'none' }}
                >
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

            {/* Timer */}
            <div className="text-center">
              <p style={{ color: 'hsl(170,60%,50%)' }} className="text-sm font-semibold">
                Code expires in {formatTime(timeLeft)}
              </p>
            </div>

            {/* Verify Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-300 mt-8"
              style={{
                background: 'linear-gradient(135deg, hsl(170,65%,42%), hsl(170,60%,48%))',
                color: 'white',
                boxShadow: '0 4px 20px -4px hsl(170,60%,40%,0.5)',
              }}
            >
              Verify
            </motion.button>
          </form>

          {/* Footer Links */}
          <div className="flex flex-col gap-3 mt-6 text-center">
            <button
              type="button"
              onClick={handleResend}
              className="text-sm transition-colors"
              style={{ color: 'hsl(170,60%,55%)' }}
            >
              Didn&apos;t receive a code?{' '}
              <span className="font-bold">Resend</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm font-medium transition-colors"
              style={{ color: 'hsl(210,15%,50%)' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
