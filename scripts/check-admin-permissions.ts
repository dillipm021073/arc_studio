import { db } from "../server/db";
import { users, roles, rolePermissions, permissions } from "@db/schema";
import { eq, and } from "drizzle-orm";

async function checkAdminPermissions() {
  console.log("Checking admin user permissions...\n");

  // Get admin user
  const adminUsers = await db.select()
    .from(users)
    .where(eq(users.username, "admin"));
  
  if (adminUsers.length === 0) {
    console.log("No admin user found!");
    process.exit(1);
  }

  const adminUser = adminUsers[0];
  console.log(`Admin user found:`);
  console.log(`  ID: ${adminUser.id}`);
  console.log(`  Username: ${adminUser.username}`);
  console.log(`  Name: ${adminUser.name}`);
  console.log(`  Role: ${adminUser.role}`);
  console.log(`  Active: ${adminUser.isActive}`);
  console.log("\n");

  // First get the admin role
  console.log("Looking for 'admin' role...");
  const adminRoles = await db.select()
    .from(roles)
    .where(eq(roles.name, "admin"));
  
  if (adminRoles.length === 0) {
    console.log("WARNING: No 'admin' role found in roles table!");
    process.exit(1);
  }

  const adminRole = adminRoles[0];
  console.log(`Admin role found: ID=${adminRole.id}, Name=${adminRole.name}`);

  // Check role permissions
  console.log("\nChecking permissions for admin role...");
  const adminRolePerms = await db.select({
    permission: permissions,
    rolePermission: rolePermissions
  })
  .from(rolePermissions)
  .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
  .where(eq(rolePermissions.roleId, adminRole.id));

  console.log(`\nFound ${adminRolePerms.length} permissions for admin role:`);
  
  if (adminRolePerms.length === 0) {
    console.log("WARNING: No permissions found for admin role!");
  } else {
    // Group permissions by resource
    const permsByResource: Record<string, string[]> = {};
    
    for (const { permission } of adminRolePerms) {
      if (!permsByResource[permission.resource]) {
        permsByResource[permission.resource] = [];
      }
      permsByResource[permission.resource].push(permission.action);
    }

    // Display permissions by resource
    for (const [resource, actions] of Object.entries(permsByResource)) {
      console.log(`\n  ${resource}:`);
      for (const action of actions.sort()) {
        console.log(`    - ${action}`);
      }
    }
  }

  // Check if all expected permissions exist
  console.log("\n\nChecking for expected API permissions...");
  const expectedResources = [
    'applications',
    'interfaces',
    'business_processes',
    'internal_activities',
    'technical_processes',
    'hierarchy_designs',
    'communications',
    'initiatives',
    'version_control'
  ];

  const expectedActions = ['create', 'read', 'update', 'delete'];
  
  for (const resource of expectedResources) {
    console.log(`\n${resource}:`);
    for (const action of expectedActions) {
      const hasPermission = adminRolePerms.some(
        p => p.permission.resource === resource && p.permission.action === action
      );
      console.log(`  ${action}: ${hasPermission ? '✓' : '✗ MISSING'}`);
    }
  }

  // Check all permissions in the permissions table
  console.log("\n\nAll available permissions in the system:");
  const allPermissions = await db.select()
    .from(permissions)
    .orderBy(permissions.resource, permissions.action);
  
  const allPermsByResource: Record<string, string[]> = {};
  for (const perm of allPermissions) {
    if (!allPermsByResource[perm.resource]) {
      allPermsByResource[perm.resource] = [];
    }
    allPermsByResource[perm.resource].push(perm.action);
  }

  for (const [resource, actions] of Object.entries(allPermsByResource)) {
    console.log(`\n${resource}: ${actions.join(', ')}`);
  }

  process.exit(0);
}

checkAdminPermissions().catch(console.error);