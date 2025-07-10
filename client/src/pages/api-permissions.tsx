import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { withAuth } from "@/contexts/auth-context";
import { 
  Shield, 
  Lock, 
  Unlock, 
  Save, 
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Role {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
}

interface Permission {
  id: number;
  resource: string;
  action: string;
  apiEndpoint?: string;
  description: string;
  isSystem: boolean;
}

interface RolePermission {
  roleId: number;
  permissionId: number;
  granted: boolean;
}

interface ApiEndpoint {
  id: number;
  method: string;
  path: string;
  resource: string;
  action: string;
  description?: string;
  requiresAuth: boolean;
  isActive: boolean;
}

function ApiPermissions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<number, boolean>>({});
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPermission, setNewPermission] = useState({
    resource: "",
    action: "",
    apiEndpoint: "",
    description: ""
  });
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await fetch("/api/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");
      return response.json();
    },
  });

  // Fetch permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await fetch("/api/permissions");
      if (!response.ok) throw new Error("Failed to fetch permissions");
      return response.json();
    },
  });

  // Fetch role permissions
  const { data: roleDetails, isLoading: roleLoading } = useQuery({
    queryKey: ["rolePermissions", selectedRole],
    queryFn: async () => {
      if (!selectedRole) return null;
      const response = await fetch(`/api/roles/${selectedRole}`);
      if (!response.ok) throw new Error("Failed to fetch role permissions");
      return response.json();
    },
    enabled: !!selectedRole,
  });

  // Fetch API endpoints
  const { data: apiEndpoints = [] } = useQuery({
    queryKey: ["apiEndpoints"],
    queryFn: async () => {
      const response = await fetch("/api/api-endpoints");
      if (!response.ok) throw new Error("Failed to fetch API endpoints");
      return response.json();
    },
  });

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) => {
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update permissions");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
      toast({
        title: "Permissions updated",
        description: "Role permissions have been updated successfully.",
      });
      setEditMode(false);
      setPendingChanges({});
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create permission");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast({
        title: "Permission created",
        description: "New permission has been created successfully.",
      });
      setShowCreateDialog(false);
      setNewPermission({
        resource: "",
        action: "",
        apiEndpoint: "",
        description: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Filter permissions based on search
  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce((acc, [resource, perms]) => {
    const filtered = perms.filter(p => 
      p.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apiEndpoint?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[resource] = filtered;
    }
    return acc;
  }, {} as Record<string, Permission[]>);

  const currentPermissionIds = roleDetails?.permissions?.map((p: any) => p.permission.id) || [];
  const effectivePermissionIds = { ...currentPermissionIds.reduce((acc: any, id: number) => ({ ...acc, [id]: true }), {}), ...pendingChanges };

  const handlePermissionToggle = (permissionId: number) => {
    if (!editMode) return;
    
    const currentState = effectivePermissionIds[permissionId] || false;
    setPendingChanges(prev => ({
      ...prev,
      [permissionId]: !currentState
    }));
  };

  const handleSaveChanges = () => {
    if (!selectedRole) return;
    
    const newPermissionIds = Object.entries(effectivePermissionIds)
      .filter(([_, granted]) => granted)
      .map(([id]) => parseInt(id));
    
    updatePermissionsMutation.mutate({
      roleId: selectedRole,
      permissionIds: newPermissionIds
    });
  };

  const toggleResourceExpansion = (resource: string) => {
    setExpandedResources(prev => {
      const next = new Set(prev);
      if (next.has(resource)) {
        next.delete(resource);
      } else {
        next.add(resource);
      }
      return next;
    });
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-600";
      case "POST": return "bg-blue-600";
      case "PUT": return "bg-yellow-600";
      case "DELETE": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">API Permissions</h1>
          <p className="text-gray-400">Configure role-based API access permissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Permission
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setIsDiscovering(true);
              try {
                const response = await fetch('/api/api-endpoints/discover', {
                  method: 'POST',
                });
                if (response.ok) {
                  const result = await response.json();
                  toast({
                    title: "Discovery complete",
                    description: `Discovered ${result.discovered} API endpoints`,
                  });
                  queryClient.invalidateQueries({ queryKey: ["apiEndpoints"] });
                } else {
                  throw new Error("Failed to discover endpoints");
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to discover API endpoints",
                  variant: "destructive",
                });
              } finally {
                setIsDiscovering(false);
              }
            }}
            disabled={isDiscovering}
          >
            <Search className="mr-2 h-4 w-4" />
            {isDiscovering ? "Discovering..." : "Discover Endpoints"}
          </Button>
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="permissions" className="space-y-4">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          {/* Role Selection */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Label className="text-gray-300">Select Role:</Label>
                <Select
                  value={selectedRole?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedRole(parseInt(value));
                    setEditMode(false);
                    setPendingChanges({});
                  }}
                >
                  <SelectTrigger className="w-64 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Choose a role to configure" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role: Role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        <div className="flex items-center gap-2">
                          {role.name}
                          {role.isSystem && <Badge variant="secondary">System</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedRole && (
                <div className="flex items-center gap-2">
                  {!editMode ? (
                    <Button onClick={() => setEditMode(true)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Permissions
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleSaveChanges}
                        disabled={Object.keys(pendingChanges).length === 0}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          setPendingChanges({});
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Permission Matrix */}
          {selectedRole && !roleLoading && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
              <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <h3 className="text-lg font-semibold text-white">
                  Permissions for: {roleDetails?.name}
                </h3>
                {roleDetails?.description && (
                  <p className="text-sm text-gray-400 mt-1">{roleDetails.description}</p>
                )}
              </div>
              
              <div className="p-4 space-y-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {Object.entries(filteredGroupedPermissions).map(([resource, perms]) => (
                  <Collapsible
                    key={resource}
                    open={expandedResources.has(resource)}
                    onOpenChange={() => toggleResourceExpansion(resource)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedResources.has(resource) ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-white font-medium capitalize">
                          {resource.replace(/_/g, " ")}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {perms.length} permissions
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {perms.filter(p => effectivePermissionIds[p.id]).length > 0 && (
                          <Badge variant="success">
                            {perms.filter(p => effectivePermissionIds[p.id]).length} granted
                          </Badge>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="mt-2 ml-6">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-700">
                              <TableHead className="text-gray-300">Action</TableHead>
                              <TableHead className="text-gray-300">API Endpoint</TableHead>
                              <TableHead className="text-gray-300">Description</TableHead>
                              <TableHead className="text-gray-300 text-center">Granted</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {perms.map((permission) => {
                              const isGranted = effectivePermissionIds[permission.id] || false;
                              const hasChange = pendingChanges.hasOwnProperty(permission.id);
                              
                              return (
                                <TableRow key={permission.id} className="border-gray-700">
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {permission.action}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-gray-300 font-mono text-sm">
                                    {permission.apiEndpoint || "-"}
                                  </TableCell>
                                  <TableCell className="text-gray-300">
                                    {permission.description}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <Checkbox
                                        checked={isGranted}
                                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                                        disabled={!editMode}
                                        className={cn(
                                          "transition-all",
                                          hasChange && "ring-2 ring-blue-500"
                                        )}
                                      />
                                      {isGranted ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <X className="h-4 w-4 text-gray-500" />
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col" style={{ height: "calc(100vh - 300px)", minHeight: "500px" }}>
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">Registered API Endpoints</h3>
              <p className="text-sm text-gray-400 mt-1">All available API endpoints in the system</p>
            </div>
            
            <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Method</TableHead>
                    <TableHead className="text-gray-300">Path</TableHead>
                    <TableHead className="text-gray-300">Resource</TableHead>
                    <TableHead className="text-gray-300">Action</TableHead>
                    <TableHead className="text-gray-300">Auth Required</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiEndpoints.map((endpoint: ApiEndpoint) => (
                    <TableRow key={endpoint.id} className="border-gray-700">
                      <TableCell>
                        <Badge className={cn("text-white", getMethodBadgeColor(endpoint.method))}>
                          {endpoint.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {endpoint.path}
                      </TableCell>
                      <TableCell className="text-gray-300 capitalize">
                        {endpoint.resource.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {endpoint.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {endpoint.requiresAuth ? (
                          <Lock className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Unlock className="h-4 w-4 text-gray-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={endpoint.isActive ? "success" : "secondary"}>
                          {endpoint.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Permission Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>
              Add a new permission that can be assigned to roles.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="resource" className="text-right">
                Resource
              </Label>
              <Input
                id="resource"
                value={newPermission.resource}
                onChange={(e) =>
                  setNewPermission({ ...newPermission, resource: e.target.value })
                }
                className="col-span-3"
                placeholder="e.g., applications"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="action" className="text-right">
                Action
              </Label>
              <Input
                id="action"
                value={newPermission.action}
                onChange={(e) =>
                  setNewPermission({ ...newPermission, action: e.target.value })
                }
                className="col-span-3"
                placeholder="e.g., create"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endpoint" className="text-right">
                API Endpoint
              </Label>
              <Input
                id="endpoint"
                value={newPermission.apiEndpoint}
                onChange={(e) =>
                  setNewPermission({ ...newPermission, apiEndpoint: e.target.value })
                }
                className="col-span-3"
                placeholder="e.g., POST /api/applications"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={newPermission.description}
                onChange={(e) =>
                  setNewPermission({ ...newPermission, description: e.target.value })
                }
                className="col-span-3"
                placeholder="Brief description of this permission"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createPermissionMutation.mutate(newPermission)}
              disabled={!newPermission.resource || !newPermission.action}
            >
              Create Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(ApiPermissions);