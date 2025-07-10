import { storage } from "./storage";

async function seedCapabilitiesPermissions() {
  console.log("Adding capabilities permissions...");

  // Define new permissions for capabilities
  const capabilitiesPermissions = [
    // Application Capabilities
    { 
      resource: "applications", 
      action: "read", 
      description: "View application capabilities", 
      apiEndpoint: "GET /api/applications/:id/capabilities" 
    },
    { 
      resource: "applications", 
      action: "create", 
      description: "Create application capabilities", 
      apiEndpoint: "POST /api/applications/:id/capabilities" 
    },
    { 
      resource: "applications", 
      action: "update", 
      description: "Update application capabilities", 
      apiEndpoint: "PUT /api/capabilities/:id" 
    },
    { 
      resource: "applications", 
      action: "delete", 
      description: "Delete application capabilities", 
      apiEndpoint: "DELETE /api/capabilities/:id" 
    },
    { 
      resource: "applications", 
      action: "update", 
      description: "Upload capability documents", 
      apiEndpoint: "POST /api/applications/:id/upload-capabilities" 
    },
    { 
      resource: "applications", 
      action: "update", 
      description: "Match capability with IML", 
      apiEndpoint: "POST /api/capabilities/:id/match-iml" 
    },
    
    // Document management
    { 
      resource: "applications", 
      action: "read", 
      description: "View uploaded documents", 
      apiEndpoint: "GET /api/applications/:id/documents" 
    },
    { 
      resource: "applications", 
      action: "delete", 
      description: "Delete uploaded documents", 
      apiEndpoint: "DELETE /api/documents/:id" 
    },
    
    // Capability status filtering
    { 
      resource: "applications", 
      action: "read", 
      description: "View capabilities by status", 
      apiEndpoint: "GET /api/applications/:id/capabilities/by-status/:status" 
    },
    { 
      resource: "applications", 
      action: "read", 
      description: "View single capability", 
      apiEndpoint: "GET /api/capabilities/:id" 
    },
  ];

  // Insert new permissions
  console.log("Creating capabilities permissions...");
  let createdCount = 0;
  
  for (const perm of capabilitiesPermissions) {
    try {
      // Check if permission already exists
      const existing = await storage.getPermissionsByResource(perm.resource);
      const exists = existing.some(p => 
        p.action === perm.action && 
        p.apiEndpoint === perm.apiEndpoint
      );
      
      if (!exists) {
        await storage.createPermission({
          ...perm,
          isSystem: true
        });
        createdCount++;
        console.log(`Created permission: ${perm.description} (${perm.apiEndpoint})`);
      }
    } catch (error) {
      console.error(`Error creating permission ${perm.apiEndpoint}:`, error);
    }
  }
  
  console.log(`Created ${createdCount} new permissions`);

  // Now update existing roles to include these permissions
  console.log("Updating role permissions...");
  
  const allPermissions = await storage.getAllPermissions();
  const capabilityPermissions = allPermissions.filter(p => 
    capabilitiesPermissions.some(cp => 
      cp.apiEndpoint === p.apiEndpoint && 
      cp.resource === p.resource && 
      cp.action === p.action
    )
  );

  // Update Admin role - gets all permissions
  const adminRole = await storage.getRoleByName("Admin");
  if (adminRole) {
    for (const perm of capabilityPermissions) {
      const existing = await storage.getRolePermissions(adminRole.id);
      const hasPermission = existing.some(rp => rp.permissionId === perm.id);
      
      if (!hasPermission) {
        await storage.grantPermissionToRole({
          roleId: adminRole.id,
          permissionId: perm.id,
          granted: true,
          grantedBy: "system"
        });
      }
    }
    console.log("Updated Admin role with capabilities permissions");
  }

  // Update Manager role - gets all capabilities permissions
  const managerRole = await storage.getRoleByName("Manager");
  if (managerRole) {
    for (const perm of capabilityPermissions) {
      const existing = await storage.getRolePermissions(managerRole.id);
      const hasPermission = existing.some(rp => rp.permissionId === perm.id);
      
      if (!hasPermission) {
        await storage.grantPermissionToRole({
          roleId: managerRole.id,
          permissionId: perm.id,
          granted: true,
          grantedBy: "system"
        });
      }
    }
    console.log("Updated Manager role with capabilities permissions");
  }

  // Update Developer role - can read and create/update capabilities
  const developerRole = await storage.getRoleByName("Developer");
  if (developerRole) {
    for (const perm of capabilityPermissions) {
      if (perm.action === "read" || perm.action === "create" || perm.action === "update") {
        const existing = await storage.getRolePermissions(developerRole.id);
        const hasPermission = existing.some(rp => rp.permissionId === perm.id);
        
        if (!hasPermission) {
          await storage.grantPermissionToRole({
            roleId: developerRole.id,
            permissionId: perm.id,
            granted: true,
            grantedBy: "system"
          });
        }
      }
    }
    console.log("Updated Developer role with capabilities permissions");
  }

  // Update Viewer role - only read permissions
  const viewerRole = await storage.getRoleByName("Viewer");
  if (viewerRole) {
    for (const perm of capabilityPermissions) {
      if (perm.action === "read") {
        const existing = await storage.getRolePermissions(viewerRole.id);
        const hasPermission = existing.some(rp => rp.permissionId === perm.id);
        
        if (!hasPermission) {
          await storage.grantPermissionToRole({
            roleId: viewerRole.id,
            permissionId: perm.id,
            granted: true,
            grantedBy: "system"
          });
        }
      }
    }
    console.log("Updated Viewer role with read-only capabilities permissions");
  }

  // Also add API endpoints to the api_endpoints table
  console.log("Adding API endpoints...");
  const apiEndpoints = [
    { method: "GET", path: "/api/applications/:id/capabilities", resource: "applications", action: "read", requiresAuth: true },
    { method: "POST", path: "/api/applications/:id/capabilities", resource: "applications", action: "create", requiresAuth: true },
    { method: "PUT", path: "/api/capabilities/:id", resource: "applications", action: "update", requiresAuth: true },
    { method: "DELETE", path: "/api/capabilities/:id", resource: "applications", action: "delete", requiresAuth: true },
    { method: "POST", path: "/api/applications/:id/upload-capabilities", resource: "applications", action: "update", requiresAuth: true },
    { method: "POST", path: "/api/capabilities/:id/match-iml", resource: "applications", action: "update", requiresAuth: true },
    { method: "GET", path: "/api/applications/:id/documents", resource: "applications", action: "read", requiresAuth: true },
    { method: "DELETE", path: "/api/documents/:id", resource: "applications", action: "delete", requiresAuth: true },
    { method: "GET", path: "/api/applications/:id/capabilities/by-status/:status", resource: "applications", action: "read", requiresAuth: true },
    { method: "GET", path: "/api/capabilities/:id", resource: "applications", action: "read", requiresAuth: true },
    { method: "GET", path: "/api/test", resource: "applications", action: "read", requiresAuth: false }, // Test endpoint
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const existing = await storage.getAllApiEndpoints();
      const exists = existing.some(e => 
        e.method === endpoint.method && 
        e.path === endpoint.path
      );
      
      if (!exists) {
        await storage.createApiEndpoint({
          ...endpoint,
          description: `${endpoint.method} ${endpoint.path}`,
          isActive: true
        });
        console.log(`Created API endpoint: ${endpoint.method} ${endpoint.path}`);
      }
    } catch (error) {
      console.error(`Error creating API endpoint ${endpoint.method} ${endpoint.path}:`, error);
    }
  }

  console.log("Capabilities permissions seeding completed!");
}

// Run the seed function
seedCapabilitiesPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding capabilities permissions:", error);
    process.exit(1);
  });