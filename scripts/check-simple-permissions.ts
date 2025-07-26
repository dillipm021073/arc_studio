import { db } from "../server/db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

async function checkSimplePermissions() {
  console.log("Checking user roles in the system...\n");

  // Get all users and their roles
  const allUsers = await db.select()
    .from(users)
    .orderBy(users.id);
  
  console.log(`Found ${allUsers.length} users:`);
  console.log("ID | Username | Name | Role | Active");
  console.log("---|----------|------|------|--------");
  
  for (const user of allUsers) {
    console.log(`${user.id} | ${user.username} | ${user.name || 'N/A'} | ${user.role || 'N/A'} | ${user.isActive ?? 'N/A'}`);
  }

  // Check admin users specifically
  const adminUsers = allUsers.filter(u => u.role === 'admin');
  console.log(`\n\nFound ${adminUsers.length} admin users:`);
  for (const admin of adminUsers) {
    console.log(`- ${admin.username} (ID: ${admin.id})`);
  }

  // Check what roles exist
  const uniqueRoles = [...new Set(allUsers.map(u => u.role).filter(Boolean))];
  console.log(`\n\nUnique roles in the system: ${uniqueRoles.join(', ')}`);

  // Test API endpoint access patterns
  console.log("\n\nPermission system analysis:");
  console.log("- The system uses a simple role-based access control");
  console.log("- Users have a 'role' field (admin, user, viewer, etc.)");
  console.log("- Middleware checks: requireAuth (any authenticated user), requireAdmin (role='admin')");
  console.log("- Admin users have full access to all APIs");

  process.exit(0);
}

checkSimplePermissions().catch(console.error);