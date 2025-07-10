import { storage } from "./storage";

async function seedRBAC() {
  console.log("Seeding RBAC data...");

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
    { resource: "business_processes", action: "export", description: "Export business processes", apiEndpoint: "GET /api/business-processes/export" },
    
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
    { resource: "change_requests", action: "export", description: "Export change requests", apiEndpoint: "GET /api/change-requests/export" },
    
    // Communications
    { resource: "communications", action: "read", description: "View communications", apiEndpoint: "GET /api/conversations" },
    { resource: "communications", action: "create", description: "Create communications", apiEndpoint: "POST /api/conversations" },
    { resource: "communications", action: "update", description: "Update communications", apiEndpoint: "PUT /api/conversations/:id" },
    { resource: "communications", action: "delete", description: "Delete communications", apiEndpoint: "DELETE /api/conversations/:id" },
    
    // Internal Activities
    { resource: "internal_activities", action: "read", description: "View internal activities", apiEndpoint: "GET /api/internal-activities" },
    { resource: "internal_activities", action: "create", description: "Create internal activities", apiEndpoint: "POST /api/internal-activities" },
    { resource: "internal_activities", action: "update", description: "Update internal activities", apiEndpoint: "PUT /api/internal-activities/:id" },
    { resource: "internal_activities", action: "delete", description: "Delete internal activities", apiEndpoint: "DELETE /api/internal-activities/:id" },
    
    // Business Process Sequences
    { resource: "business_process_sequences", action: "read", description: "View business process sequences", apiEndpoint: "GET /api/business-process-sequences" },
    { resource: "business_process_sequences", action: "create", description: "Create business process sequences", apiEndpoint: "POST /api/business-process-sequences" },
    { resource: "business_process_sequences", action: "update", description: "Update business process sequences", apiEndpoint: "PUT /api/business-process-sequences/:id" },
    { resource: "business_process_sequences", action: "delete", description: "Delete business process sequences", apiEndpoint: "DELETE /api/business-process-sequences/:id" },
    
    // Interface Response Scenarios
    { resource: "interface_response_scenarios", action: "read", description: "View interface response scenarios", apiEndpoint: "GET /api/interface-response-scenarios" },
    { resource: "interface_response_scenarios", action: "create", description: "Create interface response scenarios", apiEndpoint: "POST /api/interface-response-scenarios" },
    { resource: "interface_response_scenarios", action: "update", description: "Update interface response scenarios", apiEndpoint: "PUT /api/interface-response-scenarios/:id" },
    { resource: "interface_response_scenarios", action: "delete", description: "Delete interface response scenarios", apiEndpoint: "DELETE /api/interface-response-scenarios/:id" },
    
    // Decision Points
    { resource: "decision_points", action: "read", description: "View decision points", apiEndpoint: "GET /api/decision-points" },
    { resource: "decision_points", action: "create", description: "Create decision points", apiEndpoint: "POST /api/decision-points" },
    { resource: "decision_points", action: "update", description: "Update decision points", apiEndpoint: "PUT /api/decision-points/:id" },
    { resource: "decision_points", action: "delete", description: "Delete decision points", apiEndpoint: "DELETE /api/decision-points/:id" },
    
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
  console.log("Creating permissions...");
  const createdPermissions = [];
  for (const perm of defaultPermissions) {
    const existing = await storage.getPermissionsByResource(perm.resource);
    const exists = existing.some(p => p.action === perm.action);
    if (!exists) {
      const created = await storage.createPermission({
        ...perm,
        isSystem: true
      });
      createdPermissions.push(created);
    }
  }
  console.log(`Created ${createdPermissions.length} permissions`);

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

  // Insert roles and assign permissions
  console.log("Creating roles and assigning permissions...");
  for (const roleData of defaultRoles) {
    let role = await storage.getRoleByName(roleData.name);
    if (!role) {
      role = await storage.createRole(roleData);
      console.log(`Created role: ${role.name}`);

      // Assign permissions based on role
      const allPermissions = await storage.getAllPermissions();
      
      if (roleData.name === "Admin") {
        // Admin gets all permissions
        for (const perm of allPermissions) {
          await storage.grantPermissionToRole({
            roleId: role.id,
            permissionId: perm.id,
            granted: true,
            grantedBy: "system"
          });
        }
      } else if (roleData.name === "Manager") {
        // Manager gets all permissions except user and role management
        for (const perm of allPermissions) {
          if (!["users", "roles"].includes(perm.resource)) {
            await storage.grantPermissionToRole({
              roleId: role.id,
              permissionId: perm.id,
              granted: true,
              grantedBy: "system"
            });
          }
        }
      } else if (roleData.name === "Developer") {
        // Developer can read everything and create/update most resources
        for (const perm of allPermissions) {
          if (perm.action === "read" || 
              (["create", "update"].includes(perm.action) && !["users", "roles"].includes(perm.resource))) {
            await storage.grantPermissionToRole({
              roleId: role.id,
              permissionId: perm.id,
              granted: true,
              grantedBy: "system"
            });
          }
        }
      } else if (roleData.name === "Viewer") {
        // Viewer gets read-only permissions
        for (const perm of allPermissions) {
          if (perm.action === "read") {
            await storage.grantPermissionToRole({
              roleId: role.id,
              permissionId: perm.id,
              granted: true,
              grantedBy: "system"
            });
          }
        }
      }
    }
  }

  // Assign Admin role to existing admin user
  const adminUser = await storage.getUserByUsername("admin");
  if (adminUser) {
    const adminRole = await storage.getRoleByName("Admin");
    if (adminRole) {
      const userRoles = await storage.getUserRoles(adminUser.id);
      const hasAdminRole = userRoles.some(ur => ur.roleId === adminRole.id);
      if (!hasAdminRole) {
        await storage.assignRoleToUser({
          userId: adminUser.id,
          roleId: adminRole.id,
          assignedBy: "system"
        });
        console.log("Assigned Admin role to admin user");
      }
    }
  }

  // Assign Viewer role to test user
  const testUser = await storage.getUserByUsername("testuser");
  if (testUser) {
    const viewerRole = await storage.getRoleByName("Viewer");
    if (viewerRole) {
      const userRoles = await storage.getUserRoles(testUser.id);
      const hasViewerRole = userRoles.some(ur => ur.roleId === viewerRole.id);
      if (!hasViewerRole) {
        await storage.assignRoleToUser({
          userId: testUser.id,
          roleId: viewerRole.id,
          assignedBy: "system"
        });
        console.log("Assigned Viewer role to test user");
      }
    }
  }

  console.log("RBAC seeding completed!");
}

// Run the seed function
seedRBAC().catch(console.error);