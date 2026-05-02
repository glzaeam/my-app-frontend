'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5026/api';

export type UserRole = 'System Admin' | 'Branch Manager' | 'Auditor' | 'Bank Teller';

interface User {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  status: string;
  role: UserRole;
  roles: string[];
  profileImageUrl?: string | null;
  permissions: string[];
  editPermissions: string[];
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  hasAccess: (module: string) => boolean;
  canEdit: (module: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(roles: string[]): UserRole {
  const raw = roles?.[0] ?? '';
  if (raw === 'System Admin')   return 'System Admin';
  if (raw === 'Branch Manager') return 'Branch Manager';
  if (raw === 'Auditor')        return 'Auditor';
  if (raw === 'Bank Teller')    return 'Bank Teller';
  const lower = raw.toLowerCase();
  if (lower.includes('admin'))   return 'System Admin';
  if (lower.includes('manager')) return 'Branch Manager';
  if (lower.includes('auditor')) return 'Auditor';
  if (lower.includes('teller'))  return 'Bank Teller';
  return 'Bank Teller';
}

async function fetchMyPermissions(token: string): Promise<{
  permissions: string[];
  editPermissions: string[];
}> {
  try {
    const res = await fetch(`${API_BASE}/permissions/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { permissions: [], editPermissions: [] };

    const data = await res.json();

    // System Admin wildcard
    if (data.isSystemAdmin === true) {
      return { permissions: ['*'], editPermissions: ['*'] };
    }

    // ✅ Your API returns { isSystemAdmin, permissions: [...] }
    // Each item: { module, canView, canEdit, canDelete }
    const list = data.permissions ?? [];

    const permissions = list
      .filter((p: any) => p.canView === true)
      .map((p: any) => p.module as string);

    const editPermissions = list
      .filter((p: any) => p.canEdit === true)
      .map((p: any) => p.module as string);

    return { permissions, editPermissions };
  } catch {
    return { permissions: [], editPermissions: [] };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = auth.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        auth.clear();
        setUser(null);
        setLoading(false);
        return;
      }

      const data         = await res.json();
      const resolvedRole = normalizeRole(data.roles ?? []);
      const { permissions, editPermissions } = await fetchMyPermissions(token);

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
      // ✅ Always save the FULL normalized user so editPermissions persists on refresh
      auth.saveToken(token, normalized);
    } catch {
      // ✅ On network error, fall back to localStorage but guarantee both arrays exist
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
  };

  const checkAccess = (module: string): boolean => {
    if (!user) return false;
    if (user.role === 'System Admin') return true;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(module);
  };

  const checkCanEdit = (module: string): boolean => {
    if (!user) return false;
    if (user.role === 'System Admin') return true;
    if (user.editPermissions?.includes('*')) return true;
    return user.editPermissions?.includes(module) ?? false;
  };

  useEffect(() => {
    // ✅ On mount: load stored user immediately (avoids flash),
    // then refreshUser() fetches fresh permissions from API
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}