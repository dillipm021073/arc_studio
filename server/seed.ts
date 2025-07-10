import 'dotenv/config';
import { db } from "./db";
import { users, roles, permissions, rolePermissions, userRoles } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Simple password hashing (same as in auth.ts)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  try {
    console.log("Seeding database...");
    
    // Create a default admin user
    const hashedPassword = hashPassword("admin123");
    
    await db.insert(users).values({
      username: "admin",
      email: "admin@example.com",
      passwordHash: hashedPassword,
      name: "Administrator",
      role: "admin"
    }).onConflictDoNothing();
    
    // Create a test user
    const testUserPassword = hashPassword("test123");
    
    await db.insert(users).values({
      username: "testuser",
      email: "test@example.com", 
      passwordHash: testUserPassword,
      name: "Test User",
      role: "user"
    }).onConflictDoNothing();
    
    console.log("Database seeded successfully!");
    console.log("Default users created:");
    console.log("  - Username: admin, Password: admin123");
    console.log("  - Username: testuser, Password: test123");
    
    // Seed RBAC data
    console.log("\nSeeding RBAC data...");
    
    // Create default permissions
    const defaultPermissions = [
      // Applications (AML)
      { resource: "applications", action: "read", description: "View applications", apiEndpoint: "GET /api/applications" },
      { resource: "applications", action: "create", description: "Create applications", apiEndpoint: "POST /api/applications" },
      { resource: "applications", action: "update", description: "Update applications", apiEndpoint: "PUT /api/applications/:id" },
      { resource: "applications", action: "delete", description: "Delete applications", apiEndpoint: "DELETE /api/applications/:id" },
      { resource: "applications", action: "export", description: "Export applications", apiEndpoint: "GET /api/applications/export" },
      
      // Interfaces (IML)
      { resource: "interfaces", action: "read", description: "View interfaces", apiEndpoint: "GET /api/interfaces" },
      { resource: "interfaces", action: "create", description: "Create interfaces", apiEndpoint: "POST /api/interfaces" },
      { resource: "interfaces", action: "update", description: "Update interfaces", apiEndpoint: "PUT /api/interfaces/:id" },
      { resource: "interfaces", action: "delete", description: "Delete interfaces", apiEndpoint: "DELETE /api/interfaces/:id" },
      { resource: "interfaces", action: "export", description: "Export interfaces", apiEndpoint: "GET /api/interfaces/export" },
      
      // Business Processes
      { resource: "business_processes", action: "read", description: "View business processes", apiEndpoint: "GET /api/business-processes" },
      { resource: "business_processes", action: "create", description: "Create business processes", apiEndpoint: "POST /api/business-processes" },
      { resource: "business_processes", action: "update", description: "Update business processes", apiEndpoint: "PUT /api/business-processes/:id" },
      { resource: "business_processes", action: "delete", description: "Delete business processes", apiEndpoint: "DELETE /api/business-processes/:id" },
      
      // Technical Processes
      { resource: "technical_processes", action: "read", description: "View technical processes", apiEndpoint: "GET /api/technical-processes" },
      { resource: "technical_processes", action: "create", description: "Create technical processes", apiEndpoint: "POST /api/technical-processes" },
      { resource: "technical_processes", action: "update", description: "Update technical processes", apiEndpoint: "PUT /api/technical-processes/:id" },
      { resource: "technical_processes", action: "delete", description: "Delete technical processes", apiEndpoint: "DELETE /api/technical-processes/:id" },
      
      // Change Requests
      { resource: "change_requests", action: "read", description: "View change requests", apiEndpoint: "GET /api/change-requests" },
      { resource: "change_requests", action: "create", description: "Create change requests", apiEndpoint: "POST /api/change-requests" },
      { resource: "change_requests", action: "update", description: "Update change requests", apiEndpoint: "PUT /api/change-requests/:id" },
      { resource: "change_requests", action: "delete", description: "Delete change requests", apiEndpoint: "DELETE /api/change-requests/:id" },
      
      // Communications
      { resource: "communications", action: "read", description: "View communications", apiEndpoint: "GET /api/conversations" },
      { resource: "communications", action: "create", description: "Create communications", apiEndpoint: "POST /api/conversations" },
      { resource: "communications", action: "update", description: "Update communications", apiEndpoint: "PUT /api/conversations/:id" },
      { resource: "communications", action: "delete", description: "Delete communications", apiEndpoint: "DELETE /api/conversations/:id" },
      
      // Reports and Analysis
      { resource: "reports", action: "read", description: "View reports", apiEndpoint: "GET /api/reports/*" },
      { resource: "impact_analysis", action: "read", description: "View impact analysis", apiEndpoint: "GET /api/impact-analysis/*" },
      
      // User Management
      { resource: "users", action: "read", description: "View users", apiEndpoint: "GET /api/users" },
      { resource: "users", action: "create", description: "Create users", apiEndpoint: "POST /api/users" },
      { resource: "users", action: "update", description: "Update users", apiEndpoint: "PUT /api/users/:id" },
      { resource: "users", action: "delete", description: "Delete users", apiEndpoint: "DELETE /api/users/:id" },
      
      // Role Management
      { resource: "roles", action: "read", description: "View roles", apiEndpoint: "GET /api/roles" },
      { resource: "roles", action: "create", description: "Create roles", apiEndpoint: "POST /api/roles" },
      { resource: "roles", action: "update", description: "Update roles", apiEndpoint: "PUT /api/roles/:id" },
      { resource: "roles", action: "delete", description: "Delete roles", apiEndpoint: "DELETE /api/roles/:id" },
      { resource: "roles", action: "manage_permissions", description: "Manage role permissions", apiEndpoint: "PUT /api/roles/:id/permissions" },
    ];

    // Insert permissions
    for (const perm of defaultPermissions) {
      await db.insert(permissions).values({
        ...perm,
        isSystem: true
      }).onConflictDoNothing();
    }
    console.log("Permissions created");

    // Create default roles
    const defaultRoles = [
      {
        name: "Admin",
        description: "Full system administrator with all permissions",
        isSystem: true,
        isActive: true,
        createdBy: "system"
      },
      {
        name: "Manager", 
        description: "Can manage all resources but cannot manage users or roles",
        isSystem: true,
        isActive: true,
        createdBy: "system"
      },
      {
        name: "Developer",
        description: "Can create and update resources, view reports",
        isSystem: true,
        isActive: true,
        createdBy: "system"
      },
      {
        name: "Viewer",
        description: "Read-only access to all resources",
        isSystem: true,
        isActive: true,
        createdBy: "system"
      }
    ];

    // Insert roles
    for (const roleData of defaultRoles) {
      await db.insert(roles).values(roleData).onConflictDoNothing();
    }
    console.log("Roles created");

    // Get all permissions for role assignment
    const allPermissions = await db.select().from(permissions);
    const allRoles = await db.select().from(roles);

    // Assign permissions to roles
    for (const role of allRoles) {
      if (role.name === "Admin") {
        // Admin gets all permissions
        for (const perm of allPermissions) {
          await db.insert(rolePermissions).values({
            roleId: role.id,
            permissionId: perm.id,
            granted: true,
            grantedBy: "system"
          }).onConflictDoNothing();
        }
      } else if (role.name === "Manager") {
        // Manager gets all permissions except user and role management
        for (const perm of allPermissions) {
          if (!["users", "roles"].includes(perm.resource)) {
            await db.insert(rolePermissions).values({
              roleId: role.id,
              permissionId: perm.id,
              granted: true,
              grantedBy: "system"
            }).onConflictDoNothing();
          }
        }
      } else if (role.name === "Developer") {
        // Developer can read everything and create/update most resources
        for (const perm of allPermissions) {
          if (perm.action === "read" || 
              (["create", "update"].includes(perm.action) && !["users", "roles"].includes(perm.resource))) {
            await db.insert(rolePermissions).values({
              roleId: role.id,
              permissionId: perm.id,
              granted: true,
              grantedBy: "system"
            }).onConflictDoNothing();
          }
        }
      } else if (role.name === "Viewer") {
        // Viewer gets read-only permissions
        for (const perm of allPermissions) {
          if (perm.action === "read") {
            await db.insert(rolePermissions).values({
              roleId: role.id,
              permissionId: perm.id,
              granted: true,
              grantedBy: "system"
            }).onConflictDoNothing();
          }
        }
      }
    }
    console.log("Role permissions assigned");

    // Assign roles to users
    const [adminUser] = await db.select().from(users).where(eq(users.username, "admin"));
    const [testUser] = await db.select().from(users).where(eq(users.username, "testuser"));
    const adminRole = allRoles.find(r => r.name === "Admin");
    const viewerRole = allRoles.find(r => r.name === "Viewer");

    if (adminUser && adminRole) {
      await db.insert(userRoles).values({
        userId: adminUser.id,
        roleId: adminRole.id,
        assignedBy: "system"
      }).onConflictDoNothing();
      console.log("Assigned Admin role to admin user");
    }

    if (testUser && viewerRole) {
      await db.insert(userRoles).values({
        userId: testUser.id,
        roleId: viewerRole.id,
        assignedBy: "system"
      }).onConflictDoNothing();
      console.log("Assigned Viewer role to test user");
    }

    console.log("\nRBAC seeding completed!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}

seed();