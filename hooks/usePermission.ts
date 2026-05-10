import { useAuth } from '@/contexts/AuthContext';

export function usePermission(moduleSlug: string) {
  const { hasAccess, canEdit } = useAuth();
  return {
    canView: hasAccess(moduleSlug),
    canEdit: canEdit(moduleSlug),
  };
}
