import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../auth";
import { parseIdParam } from "../middleware/validation";
import { 
  insertRoleSchema,
  insertUserSchema,
  insertUserRoleSchema,
  insertRolePermissionSchema
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

// Simple password hashing (same as in auth.ts)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function registerRBACRoutes(app: Express) {
  // ============ ROLE MANAGEMENT ============
  
  // Get all roles
  app.get("/api/roles", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Get role by ID with permissions
  app.get("/api/roles/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }
      
      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      const permissions = await storage.getRolePermissionsWithDetails(id);
      res.json({ ...role, permissions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  // Create new role
  app.post("/api/roles", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole({
        ...validatedData,
        createdBy: (req.user as any).username
      });
      
      // Audit log
      await storage.createPermissionAuditLog({
        actionType: "role_created",
        roleId: role.id,
        changedBy: (req.user as any).username,
        details: JSON.stringify({ roleName: role.name })
      });
      
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  // Update role
  app.put("/api/roles/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }
      
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.updateRole(id, validatedData);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      
      // Audit log
      await storage.createPermissionAuditLog({
        actionType: "role_updated",
        roleId: role.id,
        changedBy: (req.user as any).username,
        details: JSON.stringify({ updates: validatedData })
      });
      
      res.json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Delete role
  app.delete("/api/roles/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }
      
      const success = await storage.deleteRole(id);
      if (!success) {
        return res.status(404).json({ message: "Role not found or is a system role" });
      }
      
      // Audit log
      await storage.createPermissionAuditLog({
        actionType: "role_deleted",
        roleId: id,
        changedBy: (req.user as any).username
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // Duplicate role
  app.post("/api/roles/:id/duplicate", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }
      
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "New role name is required" });
      }
      
      const newRole = await storage.duplicateRole(id, name);
      if (!newRole) {
        return res.status(404).json({ message: "Source role not found" });
      }
      
      // Audit log
      await storage.createPermissionAuditLog({
        actionType: "role_created",
        roleId: newRole.id,
        changedBy: (req.user as any).username,
        details: JSON.stringify({ duplicatedFrom: id, newName: name })
      });
      
      res.status(201).json(newRole);
    } catch (error) {
      res.status(500).json({ message: "Failed to duplicate role" });
    }
  });

  // Update role permissions
  app.put("/api/roles/:id/permissions", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }
      
      const { permissionIds } = req.body;
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ message: "permissionIds must be an array" });
      }
      
      await storage.updateRolePermissions(id, permissionIds);
      
      // Audit log
      await storage.createPermissionAuditLog({
        actionType: "permission_updated",
        roleId: id,
        changedBy: (req.user as any).username,
        details: JSON.stringify({ permissionIds })
      });
      
      res.json({ message: "Permissions updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update role permissions" });
    }
  });

  // ============ USER MANAGEMENT ============
  
  // Get all users with roles
  app.get("/api/users", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsersWithRoles();
      // Remove password hashes from response
      const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user by ID with roles
  app.get("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }
      
      const user = await storage.getUserWithRoles(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password hash from response
      const { passwordHash, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create new user
  app.post("/api/users", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { password, ...userData } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      const validatedData = insertUserSchema.parse({
        ...userData,
        passwordHash: hashPassword(password)
      });
      
      const user = await storage.createUser(validatedData);
      
      // Assign roles if provided
      if (req.body.roleIds && Array.isArray(req.body.roleIds)) {
        await storage.updateUserRoles(user.id, req.body.roleIds);
      }
      
      // Audit log
      await storage.createPermissionAuditLog({
        actionType: "user_created",
        userId: user.id,
        changedBy: (req.user as any).username,
        details: JSON.stringify({ username: user.username })
      });
      
      const userWithRoles = await storage.getUserWithRoles(user.id);
      const { passwordHash, ...sanitizedUser } = userWithRoles!;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user
  app.put("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }
      
      const { password, roleIds, ...userData } = req.body;
      
      // If password is provided, hash it
      if (password) {
        userData.passwordHash = hashPassword(password);
      }
      
      const validatedData = insertUserSchema.partial().parse(userData);
      const user = await storage.updateUser(id, validatedData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update roles if provided
      if (roleIds !== undefined && Array.isArray(roleIds)) {
        await storage.updateUserRoles(id, roleIds);
      }
      
      // Audit log
      await storage.createPermissionAuditLog({
        actionType: "user_updated",
        userId: id,
        changedBy: (req.user as any).username,
        details: JSON.stringify({ updates: { ...userData, roleIds } })
      });
      
      const userWithRoles = await storage.getUserWithRoles(id);
      const { passwordHash, ...sanitizedUser } = userWithRoles!;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }
      
      // Don't allow deleting the current user
      if (id === (req.user as any).id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Audit log - create before deletion to avoid foreign key constraint
      await storage.createPermissionAuditLog({
        actionType: "user_deleted",
        userId: id,
        changedBy: (req.user as any).username
      });
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found or unable to delete due to dependencies" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Update user roles
  app.put("/api/users/:id/roles", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }
      
      const { roleIds } = req.body;
      if (!Array.isArray(roleIds)) {
        return res.status(400).json({ message: "roleIds must be an array" });
      }
      
      await storage.updateUserRoles(id, roleIds);
      
      // Audit log
      await storage.createPermissionAuditLog({
        actionType: "user_role_updated",
        userId: id,
        changedBy: (req.user as any).username,
        details: JSON.stringify({ roleIds })
      });
      
      res.json({ message: "User roles updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user roles" });
    }
  });

  // ============ PERMISSIONS ============
  
  // Get all permissions
  app.get("/api/permissions", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Get permissions by resource
  app.get("/api/permissions/by-resource/:resource", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const permissions = await storage.getPermissionsByResource(req.params.resource);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Get current user permissions
  app.get("/api/users/me/permissions", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // Create new permission
  app.post("/api/permissions", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const permission = await storage.createPermission(req.body);
      
      // Audit log
      await storage.createPermissionAuditLog({
        actionType: "permission_created",
        permissionId: permission.id,
        changedBy: (req.user as any).username,
        details: JSON.stringify(permission)
      });
      
      res.status(201).json(permission);
    } catch (error) {
      res.status(500).json({ message: "Failed to create permission" });
    }
  });

  // ============ API ENDPOINTS ============
  
  // Get all API endpoints
  app.get("/api/api-endpoints", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const endpoints = await storage.getAllApiEndpoints();
      res.json(endpoints);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API endpoints" });
    }
  });

  // Discover and register API endpoints
  app.post("/api/api-endpoints/discover", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const endpoints = await storage.discoverApiEndpoints();
      res.json({ discovered: endpoints.length, endpoints });
    } catch (error) {
      res.status(500).json({ message: "Failed to discover API endpoints" });
    }
  });

  // ============ AUDIT LOGS ============
  
  // Get permission audit logs
  app.get("/api/audit/permissions", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { roleId, userId, limit } = req.query;
      const logs = await storage.getPermissionAuditLogs({
        roleId: roleId ? parseInt(roleId as string) : undefined,
        userId: userId ? parseInt(userId as string) : undefined,
        limit: limit ? parseInt(limit as string) : 100
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ============ USER ACTIVITY LOGS ============
  
  // Get user activity logs
  app.get("/api/activity/logs", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { userId, username, activityType, resource, startDate, endDate, limit, offset } = req.query;
      
      const logs = await storage.getUserActivityLogs({
        userId: userId ? parseInt(userId as string) : undefined,
        username: username as string,
        activityType: activityType as string,
        resource: resource as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0
      });
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Get user activity summary
  app.get("/api/activity/summary", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.query;
      const summary = await storage.getUserActivitySummary(
        userId ? parseInt(userId as string) : undefined
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity summary" });
    }
  });

  // Get specific user's activity logs
  app.get("/api/users/:id/activity", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }
      
      const { activityType, resource, startDate, endDate, limit, offset } = req.query;
      
      const logs = await storage.getUserActivityLogs({
        userId: id,
        activityType: activityType as string,
        resource: resource as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0
      });
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user activity logs" });
    }
  });
}