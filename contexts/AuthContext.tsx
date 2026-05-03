'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, fetchPermissions } from '@/lib/api';  // ✅ import fetchPermissions

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5026/api';

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

// ✅ Converts "Login Settings" → "login-settings" to match sidebar ids
function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = auth.getToken();
    if (!token) {
      console.warn('[AuthContext] No token found — user not logged in');
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user profile
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

      // 2. Fetch permissions using the dedicated helper
      const { isSystemAdmin, permissions: rawPerms } = await fetchPermissions(token);

      console.log('[AuthContext] isSystemAdmin:', isSystemAdmin);
      console.log('[AuthContext] raw permissions:', rawPerms);

      // 3. Slugify module names so they match sidebar item ids
      const permissions     = isSystemAdmin
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
      // Fall back to localStorage on network error
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

  const logout = () => { auth.clear(); setUser(null); };

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

  useEffect(() => {
    // Load from localStorage immediately to avoid flash
    const stored = auth.getUser();
    if (stored) {
      setUser({
        ...stored,
        role:            normalizeRole(stored.roles ?? []),
        permissions:     stored.permissions     ?? [],
        editPermissions: stored.editPermissions ?? [],
      });
    }
    // Then refresh from API
    refreshUser();
  }, []);

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