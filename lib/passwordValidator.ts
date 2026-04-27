import zxcvbn from 'zxcvbn';

const COMMON_PASSWORDS = [
  'Password1!', 'Qwerty123!', 'Admin123!', 'Welcome1!',
  'Password123!', 'P@ssword1', 'P@ssw0rd', 'Passw0rd!',
  'Hello123!', 'Letmein1!', 'Monkey123!', 'Dragon123!',
  'Master123!', 'Superman1!', 'Batman123!'
];

export interface PasswordValidation {
  isValid: boolean;
  strength: 0 | 1 | 2 | 3 | 4;
  strengthLabel: 'Too Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  strengthColor: string;
  errors: string[];
  suggestions: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  // 1. Length
  const trimmed = password.trimStart().trimEnd();
  if (trimmed !== password)
    errors.push('Password cannot have leading or trailing spaces');
  if (password.length < 12)
    errors.push('Must be at least 12 characters');
  if (password.length > 128)
    errors.push('Cannot exceed 128 characters');

  // 2. Uppercase
  if (!/[A-Z]/.test(password))
    errors.push('Must include at least 1 uppercase letter (A–Z)');

  // 3. Lowercase
  if (!/[a-z]/.test(password))
    errors.push('Must include at least 1 lowercase letter (a–z)');

  // 4. Number
  if (!/[0-9]/.test(password))
    errors.push('Must include at least 1 number (0–9)');

  // 5. Special character
  if (!/[!@#$%^&*()\-_=+\[\]{}|;':",.<>?/`~\\]/.test(password))
    errors.push('Must include at least 1 special character (e.g. ! @ # $ % ^ & *)');

  // 6. Common passwords
  if (COMMON_PASSWORDS.includes(password))
    errors.push('This password is too common. Please choose a more unique one.');

  // 7. zxcvbn strength score
  const result = zxcvbn(password);
  const score  = result.score as 0 | 1 | 2 | 3 | 4;

  const labelMap: Record<number, 'Too Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong'> = {
    0: 'Too Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong',
  };

  const colorMap: Record<number, string> = {
    0: 'hsl(0,70%,55%)',
    1: 'hsl(20,80%,55%)',
    2: 'hsl(45,90%,50%)',
    3: 'hsl(150,60%,45%)',
    4: 'hsl(170,60%,45%)',
  };

  return {
    isValid:       errors.length === 0 && score >= 2,
    strength:      score,
    strengthLabel: labelMap[score],
    strengthColor: colorMap[score],
    errors,
    suggestions:   result.feedback.suggestions,
  };
}

export async function checkPwnedPassword(password: string): Promise<boolean> {
  try {
    // SHA1 hash the password
    const encoder = new TextEncoder();
    const data    = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    const hashHex    = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await res.text();

    return text.split('\n').some(line => line.startsWith(suffix));
  } catch {
    return false; // Don't block if API is unreachable
  }
}