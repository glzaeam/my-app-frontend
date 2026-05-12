'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, fetchPermissions } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://nexum.runasp.net/api';

export type UserRole = 'System Admin' | 'Branch Manager' | 'Auditor' | 'Bank Teller';

interface User {
  id:              string;
  name:            string;
  email:           string;
  employeeId:      string;
  department:      string;
  status:          string;
  role:            UserRole;
  roles:           string[];
  profileImageUrl?: string | null;
  permissions:     string[];
  editPermissions: string[];
}

interface AuthContextType {
  user:        User | null;
  setUser:     (user: User | null) => void;
  refreshUser: () => Promise<void>;
  logout:      () => void;
  hasAccess:   (module: string) => boolean;
  canEdit:     (module: string) => boolean;
  loading:     boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(roles: string[]): UserRole {
  const raw   = roles?.[0] ?? '';
  const lower = raw.toLowerCase();
  if (raw === 'System Admin'   || lower.includes('admin'))   return 'System Admin';
  if (raw === 'Branch Manager' || lower.includes('manager')) return 'Branch Manager';
  if (raw === 'Auditor'        || lower.includes('auditor')) return 'Auditor';
  return 'Bank Teller';
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

async function getClientIp(): Promise<string> {
  try {
    const res  = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Public routes that don't require authentication
const PUBLIC_PATHS = ['/', '/login', '/forgot-password', '/2fa', '/request-access'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    const token = auth.getToken();
    if (!token) {
      console.warn('[AuthContext] No token found — user not logged in');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('[auth/me]', res.status);

      if (!res.ok) {
        console.error('[auth/me] failed — clearing session');
        auth.clear();
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log('[auth/me] response:', data);

      const resolvedRole = normalizeRole(data.roles ?? []);

      const { isSystemAdmin, permissions: rawPerms } = await fetchPermissions(token);

      console.log('[AuthContext] isSystemAdmin:', isSystemAdmin);
      console.log('[AuthContext] raw permissions:', rawPerms);

      const permissions = isSystemAdmin
        ? ['*']
        : rawPerms.filter(p => p.canView).map(p => slugify(p.module));

      const editPermissions = isSystemAdmin
        ? ['*']
        : rawPerms.filter(p => p.canEdit).map(p => slugify(p.module));

      console.log('[AuthContext] slugified permissions:', permissions);
      console.log('[AuthContext] slugified editPermissions:', editPermissions);

      const normalized: User = {
        id:              data.id,
        name:            data.name,
        email:           data.email,
        employeeId:      data.employeeId,
        department:      data.department,
        status:          data.status,
        roles:           data.roles ?? [],
        role:            resolvedRole,
        profileImageUrl: data.profileImageUrl ?? null,
        permissions,
        editPermissions,
      };

      setUser(normalized);
      auth.saveToken(token, normalized);
    } catch (err) {
      console.error('[AuthContext] refreshUser error:', err);
      const stored = auth.getUser();
      if (stored) {
        setUser({
          ...stored,
          role:            normalizeRole(stored.roles ?? []),
          permissions:     stored.permissions     ?? [],
          editPermissions: stored.editPermissions ?? [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    auth.clear();
    setUser(null);
    router.replace('/');
  };

  const checkAccess = (module: string): boolean => {
    if (!user)                          return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(slugify(module));
  };

  const checkCanEdit = (module: string): boolean => {
    if (!user)                              return false;
    if (user.editPermissions.includes('*')) return true;
    return user.editPermissions.includes(slugify(module));
  };

  // Initial load — restore from localStorage then verify with API
  useEffect(() => {
    const stored = auth.getUser();
    if (stored) {
      setUser({
        ...stored,
        role:            normalizeRole(stored.roles ?? []),
        permissions:     stored.permissions     ?? [],
        editPermissions: stored.editPermissions ?? [],
      });
    }
    refreshUser();
  }, []);

  // ✅ Redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (loading) return; // wait for auth check to finish first
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!user && !isPublic) {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  // ✅ Auto-logout if user's IP gets blocked while logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const ip   = await getClientIp();
        const res  = await fetch(`${API_BASE}/login-settings/check-ip?ip=${ip}`);
        const data = await res.json();
        if (data.blocked) {
          auth.clear();
          setUser(null);
          router.push('/?reason=ip_blocked');
        }
      } catch (err) {
        console.error('[AuthContext] IP check error:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, router]);

  return (
    <AuthContext.Provider value={{
      user, setUser, refreshUser, logout,
      hasAccess: checkAccess,
      canEdit:   checkCanEdit,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}