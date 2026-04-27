'use client';

import { validatePassword, PasswordValidation } from '@/lib/passwordValidator';
import { CheckCircle, XCircle } from 'lucide-react';

interface Props {
  password: string;
  validation: PasswordValidation | null;
}

export default function PasswordStrengthMeter({ password, validation }: Props) {
  if (!password || !validation) return null;

  // Create rules array to match reset-password design
  const rules = [
    { label: 'Min 12 characters', pass: password.length >= 12 },
    { label: 'Max 128 characters', pass: password.length <= 128 },
    { label: 'Uppercase letter (A–Z)', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a–z)', pass: /[a-z]/.test(password) },
    { label: 'Number (0–9)', pass: /[0-9]/.test(password) },
    { label: 'Special character (e.g. !@#$%^&*)', pass: /[!@#$%^&*()\-_=+\[\]{}|;':",.<>?/`~\\]/.test(password) },
  ];

  // Calculate strength score (0-6)
  const strength = (() => {
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
    if (score <= 4) return { score, label: 'Strong', color: '#3b82f6' };
    return { score, label: 'Very Strong', color: '#10b981' };
  })();

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Horizontal progress bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: '8px' }}>
        <div
          style={{
            height: '100%',
            width: `${(strength.score / 6) * 100}%`,
            background: strength.color,
            borderRadius: 2,
            transition: 'width 0.3s, background 0.3s',
          }}
        />
      </div>

      {/* Strength label and character count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: 11, color: strength.color, fontWeight: 700 }}>
          {strength.label}
        </span>
        <span style={{ fontSize: 11, color: 'hsl(210,15%,50%)' }}>
          {password.length}/128
        </span>
      </div>

      {/* Rules checklist */}
      <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
        {rules.map((rule, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: i < rules.length - 1 ? 4 : 0,
            }}
          >
            {rule.pass ? (
              <CheckCircle size={12} color="#10b981" />
            ) : (
              <XCircle size={12} color="#ef4444" />
            )}
            <span style={{ fontSize: 12, color: rule.pass ? '#10b981' : '#ef4444' }}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}