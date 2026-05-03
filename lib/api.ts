const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5026/api';

export const api = {
  async login(employeeId: string, password: string, captchaToken?: string | null) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, password, captchaToken }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },

  async verifyOtp(userId: string, code: string) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },

  async register(form: {
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    password: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },

  async submitAccessRequest(form: {
    fullName: string;
    employeeId: string;
    email: string;
    department?: string;
    branch?: string;
    requestedRole?: string;
    password: string;
  }) {
    const res = await fetch(`${API_BASE}/access-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },
};

// ✅ Dedicated permissions fetcher — never goes through fetchArray
// so the { isSystemAdmin, permissions } envelope is preserved intact
export async function fetchPermissions(token: string): Promise<{
  isSystemAdmin: boolean;
  permissions: { moduleId: string; module: string; canView: boolean; canEdit: boolean; canDelete: boolean }[];
}> {
  try {
    const res = await fetch(`${API_BASE}/permissions/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // ✅ Log clearly so you can see in console what's happening
    console.log('[permissions/my]', res.status, res.statusText);

    if (!res.ok) {
      console.error('[permissions/my] failed — token may be invalid or expired');
      return { isSystemAdmin: false, permissions: [] };
    }

    const data = await res.json();
    console.log('[permissions/my] response:', data);

    return {
      isSystemAdmin: data.isSystemAdmin === true,
      permissions:   Array.isArray(data.permissions) ? data.permissions : [],
    };
  } catch (err) {
    console.error('[permissions/my] network error:', err);
    return { isSystemAdmin: false, permissions: [] };
  }
}

// ✅ fetchArray is only for LIST endpoints — never use it for /permissions/my
export async function fetchArray(url: string): Promise<any[]> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${auth.getToken()}` },
  });

  if (!res.ok) {
    console.error(`fetchArray failed: ${res.status} ${res.statusText} — ${url}`);
    return [];
  }

  const data = await res.json();

  if (Array.isArray(data))      return data;
  if (Array.isArray(data.data)) return data.data;

  return (
    data.roles        ??
    data.users        ??
    data.modules      ??
    data.permissions  ??
    data.transactions ??
    data.failedLogins ??
    data.logs         ??
    data.records      ??
    []
  );
}

export const auth = {
  saveToken(token: string, user: object) {
    localStorage.setItem('nexum_token', token);
    localStorage.setItem('nexum_user', JSON.stringify(user));
    localStorage.setItem('nexum_session_start', Date.now().toString());
  },

  savePendingUser(userId: string) {
    localStorage.setItem('nexum_pending_user', userId);
  },

  getPendingUser(): string | null {
    return localStorage.getItem('nexum_pending_user');
  },

  clearPendingUser() {
    localStorage.removeItem('nexum_pending_user');
  },

  getToken(): string | null {
    return localStorage.getItem('nexum_token');
  },

  getUser() {
    const u = localStorage.getItem('nexum_user');
    return u ? JSON.parse(u) : null;
  },

  clear() {
    localStorage.removeItem('nexum_token');
    localStorage.removeItem('nexum_user');
    localStorage.removeItem('nexum_pending_user');
    localStorage.removeItem('nexum_session_start');
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem('nexum_token');
  },
};