'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

const glassInput = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
};

const focusGlow = '0 0 0 2px hsl(170,60%,50%), 0 0 20px -4px hsl(170,60%,50%,0.3)';

export default function RequestAccessPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    department: '',
    branch: '',
    role: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [focused, setFocused] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkboxInput = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkboxInput.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Access request:', formData);
  };

  const handleSignIn = () => {
    router.push('/');
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
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-1/2 lg:flex flex-col justify-between p-12">
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

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 lg:ml-auto flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
        <div
          className="w-full max-w-md rounded-2xl p-8 lg:p-10 backdrop-blur-lg my-8"
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

          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: 'white' }}>
              Request Access
            </h2>
            <p className="text-sm" style={{ color: 'hsl(210,15%,55%)' }}>
              Fill in your details to request system access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Full Name and Employee ID */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold block"
                  style={{ color: 'hsl(210,15%,70%)' }}
                >
                  Full Name
                </label>
                <div
                  className="rounded-xl transition-all duration-300"
                  style={{ boxShadow: focused === 'fullName' ? focusGlow : 'none' }}
                >
                  <input
                    placeholder="John Doe"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    onFocus={() => setFocused('fullName')}
                    onBlur={() => setFocused(null)}
                    className="w-full px-3 h-10 rounded-xl text-xs outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                    style={glassInput}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold block"
                  style={{ color: 'hsl(210,15%,70%)' }}
                >
                  Employee ID
                </label>
                <div
                  className="rounded-xl transition-all duration-300"
                  style={{ boxShadow: focused === 'employeeId' ? focusGlow : 'none' }}
                >
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
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                className="text-xs font-semibold"
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
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className="w-full px-3 h-10 rounded-xl text-xs outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                  style={glassInput}
                />
              </div>
            </div>

            {/* Row 2: Department and Branch */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold block"
                  style={{ color: 'hsl(210,15%,70%)' }}
                >
                  Department
                </label>
                <div
                  className="rounded-xl transition-all duration-300"
                  style={{ boxShadow: focused === 'department' ? focusGlow : 'none' }}
                >
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    onFocus={() => setFocused('department')}
                    onBlur={() => setFocused(null)}
                    className="w-full px-3 h-10 rounded-xl text-xs outline-none transition-colors"
                    style={glassInput}
                  >
                    <option value="">Select</option>
                    <option value="finance">Finance</option>
                    <option value="operations">Operations</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold block"
                  style={{ color: 'hsl(210,15%,70%)' }}
                >
                  Assigned Branch
                </label>
                <div
                  className="rounded-xl transition-all duration-300"
                  style={{ boxShadow: focused === 'branch' ? focusGlow : 'none' }}
                >
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    onFocus={() => setFocused('branch')}
                    onBlur={() => setFocused(null)}
                    className="w-full px-3 h-10 rounded-xl text-xs outline-none transition-colors"
                    style={glassInput}
                  >
                    <option value="">Select</option>
                    <option value="branch1">Branch 1</option>
                    <option value="branch2">Branch 2</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label
                className="text-xs font-semibold"
                style={{ color: 'hsl(210,15%,70%)' }}
              >
                Role Requested
              </label>
              <div
                className="rounded-xl transition-all duration-300"
                style={{ boxShadow: focused === 'role' ? focusGlow : 'none' }}
              >
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  onFocus={() => setFocused('role')}
                  onBlur={() => setFocused(null)}
                  className="w-full px-3 h-10 rounded-xl text-xs outline-none transition-colors"
                  style={glassInput}
                >
                  <option value="">Select role</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>

            {/* Row 3: Password and Confirm */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold block"
                  style={{ color: 'hsl(210,15%,70%)' }}
                >
                  Password
                </label>
                <div
                  className="relative rounded-xl transition-all duration-300"
                  style={{ boxShadow: focused === 'password' ? focusGlow : 'none' }}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    className="w-full pl-3 pr-9 h-10 rounded-xl text-xs outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                    style={glassInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'hsl(210,15%,50%)' }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold block"
                  style={{ color: 'hsl(210,15%,70%)' }}
                >
                  Confirm Password
                </label>
                <div
                  className="relative rounded-xl transition-all duration-300"
                  style={{ boxShadow: focused === 'confirmPassword' ? focusGlow : 'none' }}
                >
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onFocus={() => setFocused('confirmPassword')}
                    onBlur={() => setFocused(null)}
                    className="w-full pl-3 pr-9 h-10 rounded-xl text-xs outline-none transition-colors placeholder:text-[hsl(210,10%,35%)]"
                    style={glassInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'hsl(210,15%,50%)' }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="terms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'hsl(170,60%,50%)' }}
              />
              <label
                htmlFor="terms"
                className="text-xs"
                style={{ color: 'hsl(210,15%,60%)' }}
              >
                I agree to the system terms and access policy
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-300 mt-6"
              style={{
                background: 'linear-gradient(135deg, hsl(170,65%,42%), hsl(170,60%,48%))',
                color: 'white',
                boxShadow: '0 4px 20px -4px hsl(170,60%,40%,0.5)',
              }}
            >
              Submit Request
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs mt-4" style={{ color: 'hsl(210,15%,50%)' }}>
            Already have an account?{' '}
            <button
              onClick={handleSignIn}
              className="font-bold transition-colors"
              style={{ color: 'hsl(170,60%,55%)' }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
