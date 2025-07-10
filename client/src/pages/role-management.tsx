import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { withAuth } from "@/contexts/auth-context";
import { Plus, Edit, Trash2, Copy, Shield, Lock } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Role {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  permissions?: PermissionDetail[];
}

interface Permission {
  id: number;
  resource: string;
  action: string;
  description: string;
}

interface PermissionDetail {
  rolePermission: {
    roleId: number;
    permissionId: number;
    granted: boolean;
  };
  permission: Permission;
}

function RoleManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [duplicateRole, setDuplicateRole] = useState<Role | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
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

  // Fetch role details with permissions
  const fetchRoleDetails = async (roleId: number) => {
    const response = await fetch(`/api/roles/${roleId}`);
    if (!response.ok) throw new Error("Failed to fetch role details");
    return response.json();
  };

  // Create/Update role mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
      const method = editingRole ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save role");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: editingRole ? "Role updated" : "Role created",
        description: `Role ${formData.name} has been ${editingRole ? "updated" : "created"} successfully.`,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete role");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Role deleted",
        description: "Role has been deleted successfully.",
      });
      setDeleteRole(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Duplicate role mutation
  const duplicateMutation = useMutation({
    mutationFn: async ({ roleId, name }: { roleId: number; name: string }) => {
      const response = await fetch(`/api/roles/${roleId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to duplicate role");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Role duplicated",
        description: "Role has been duplicated successfully.",
      });
      setDuplicateRole(null);
      setDuplicateName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update permissions mutation
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
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Permissions updated",
        description: "Role permissions have been updated successfully.",
      });
      setIsPermissionDialogOpen(false);
      setEditingRole(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleEditPermissions = async (role: Role) => {
    const roleDetails = await fetchRoleDetails(role.id);
    setEditingRole(roleDetails);
    setSelectedPermissions(
      roleDetails.permissions
        ?.filter((p: PermissionDetail) => p.rolePermission.granted)
        .map((p: PermissionDetail) => p.permission.id) || []
    );
    setIsPermissionDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  const handleSubmit = () => {
    saveMutation.mutate(formData);
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleUpdatePermissions = () => {
    if (editingRole) {
      updatePermissionsMutation.mutate({
        roleId: editingRole.id,
        permissionIds: selectedPermissions,
      });
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (rolesLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Role Management</h1>
          <p className="text-gray-400">Manage system roles and permissions</p>
        </div>
        <Button onClick={handleCreateRole}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700" style={{ height: "calc(100vh - 300px)", minHeight: "400px" }}>
        <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-800 z-10">
              <TableRow>
                <TableHead className="text-gray-300">Role Name</TableHead>
                <TableHead className="text-gray-300">Description</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Created</TableHead>
                <TableHead className="text-gray-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} className="border-gray-700">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-200">{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{role.description}</TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />
                        System
                      </Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isActive ? "success" : "secondary"}>
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {new Date(role.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPermissions(role)}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                        disabled={role.isSystem}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDuplicateRole(role);
                          setDuplicateName(`${role.name} (Copy)`);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteRole(role)}
                        disabled={role.isSystem}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update role information."
                : "Create a new role with specific permissions."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
                disabled={editingRole?.isSystem}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Role Permissions</DialogTitle>
            <DialogDescription>
              Select the permissions for the {editingRole?.name} role.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <AccordionItem key={resource} value={resource}>
                  <AccordionTrigger className="capitalize">
                    {resource.replace(/_/g, " ")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                          <Label
                            htmlFor={`perm-${permission.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            <span className="font-medium capitalize">{permission.action}</span>
                            {permission.description && (
                              <span className="text-gray-500 ml-2">
                                - {permission.description}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              disabled={updatePermissionsMutation.isPending}
            >
              {updatePermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Role Dialog */}
      <Dialog open={duplicateRole !== null} onOpenChange={() => setDuplicateRole(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Duplicate Role</DialogTitle>
            <DialogDescription>
              Create a copy of the "{duplicateRole?.name}" role with all its permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duplicate-name" className="text-right">
                New Name
              </Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateRole(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                duplicateRole &&
                duplicateMutation.mutate({ roleId: duplicateRole.id, name: duplicateName })
              }
              disabled={duplicateMutation.isPending || !duplicateName}
            >
              {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteRole !== null}
        onOpenChange={() => setDeleteRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{deleteRole?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRole && deleteMutation.mutate(deleteRole.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default withAuth(RoleManagement);