import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  const { data: permissions = [], isLoading } = useQuery<Permission[]>({
    queryKey: ["permissions", "me"],
    queryFn: async () => {
      const response = await fetch("/api/users/me/permissions");
      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Admin users have all permissions
  const isAdmin = user?.role === "admin";

  const hasPermission = (resource: string, action: string): boolean => {
    // Admin has all permissions
    if (isAdmin) return true;
    
    // Check if user has the specific permission
    return permissions.some(p => p.resource === resource && p.action === action);
  };

  const canCreate = (resource: string): boolean => hasPermission(resource, "create");
  const canRead = (resource: string): boolean => hasPermission(resource, "read");
  const canUpdate = (resource: string): boolean => hasPermission(resource, "update");
  const canDelete = (resource: string): boolean => hasPermission(resource, "delete");

  return {
    permissions,
    isLoading,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isAdmin,
  };
}