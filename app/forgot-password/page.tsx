'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Reset password request:', { employeeId, email });
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

      {/* Right Reset Section */}
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
              Reset your password
            </h2>
            <p className="text-sm" style={{ color: 'hsl(210,15%,55%)' }}>
              Enter your details to receive a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee ID Field */}
            <div className="space-y-2">
              <label
                className="text-sm font-semibold"
                style={{ color: 'hsl(210,15%,70%)' }}
              >
                Employee ID
              </label>
              <div
                className="rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'employeeId' ? focusGlow : 'none' }}
              >
                <input
                  placeholder="e.g. ADM001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  onFocus={() => setFocused('employeeId')}
                  onBlur={() => setFocused(null)}
                  className="w-full px-4 h-12 rounded-xl text-sm outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                  style={glassInput}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label
                className="text-sm font-semibold"
                style={{ color: 'hsl(210,15%,70%)' }}
              >
                Email Address
              </label>
              <div
                className="rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'email' ? focusGlow : 'none' }}
              >
                <input
                  type="email"
                  placeholder="john@bank.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className="w-full px-4 h-12 rounded-xl text-sm outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                  style={glassInput}
                />
              </div>
            </div>

            {/* Send Reset Link Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-300 mt-6"
              style={{
                background: 'linear-gradient(135deg, hsl(170,65%,42%), hsl(170,60%,48%))',
                color: 'white',
                boxShadow: '0 4px 20px -4px hsl(170,60%,40%,0.5)',
              }}
            >
              Send Reset Link
            </motion.button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm mt-6" style={{ color: 'hsl(210,15%,50%)' }}>
            <button
              onClick={() => router.push('/')}
              className="font-bold transition-colors"
              style={{ color: 'hsl(170,60%,55%)' }}
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
