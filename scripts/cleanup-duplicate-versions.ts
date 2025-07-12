import dotenv from "dotenv";
dotenv.config();

import { db } from "../server/db";
import { artifactVersions } from "@db/schema";
import { sql, eq, and, inArray } from "drizzle-orm";

async function cleanupDuplicateVersions() {
  console.log("🔍 Identifying duplicate version records...");
  
  // Find duplicates: same artifactType, artifactId, versionNumber
  const duplicatesQuery = sql`
    SELECT 
      artifact_type,
      artifact_id,
      version_number,
      COUNT(*) as count,
      ARRAY_AGG(id ORDER BY created_at DESC) as ids
    FROM artifact_versions 
    GROUP BY artifact_type, artifact_id, version_number 
    HAVING COUNT(*) > 1
    ORDER BY artifact_type, artifact_id, version_number
  `;
  
  const duplicates = await db.execute(duplicatesQuery);
  
  if (duplicates.rows.length === 0) {
    console.log("✅ No duplicate records found!");
    return;
  }
  
  console.log(`⚠️  Found ${duplicates.rows.length} sets of duplicate records:`);
  
  let totalDuplicatesRemoved = 0;
  
  for (const duplicate of duplicates.rows) {
    const { artifact_type, artifact_id, version_number, count, ids } = duplicate as any;
    
    console.log(`\n📋 ${artifact_type} #${artifact_id} v${version_number}: ${count} duplicates`);
    console.log(`   IDs: [${ids.join(', ')}]`);
    
    // Keep the most recent record (first in the array due to DESC order)
    const idsToKeep = [ids[0]];
    const idsToDelete = ids.slice(1);
    
    console.log(`   Keeping ID: ${idsToKeep[0]}`);
    console.log(`   Deleting IDs: [${idsToDelete.join(', ')}]`);
    
    if (idsToDelete.length > 0) {
      // Delete duplicate records
      const deleteResult = await db
        .delete(artifactVersions)
        .where(inArray(artifactVersions.id, idsToDelete));
        
      console.log(`   ✅ Deleted ${idsToDelete.length} duplicate records`);
      totalDuplicatesRemoved += idsToDelete.length;
    }
  }
  
  console.log(`\n🧹 Cleanup complete! Removed ${totalDuplicatesRemoved} duplicate records.`);
}

async function addUniqueConstraint() {
  console.log("\n🔧 Adding unique constraint to prevent future duplicates...");
  
  try {
    // Add unique constraint
    await db.execute(sql`
      ALTER TABLE artifact_versions 
      ADD CONSTRAINT unique_artifact_version 
      UNIQUE (artifact_type, artifact_id, version_number)
    `);
    
    console.log("✅ Unique constraint added successfully!");
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log("ℹ️  Unique constraint already exists");
    } else {
      console.error("❌ Error adding unique constraint:", error.message);
      throw error;
    }
  }
}

async function verifyCleanup() {
  console.log("\n🔍 Verifying cleanup...");
  
  const remainingDuplicates = await db.execute(sql`
    SELECT 
      artifact_type,
      artifact_id,
      version_number,
      COUNT(*) as count
    FROM artifact_versions 
    GROUP BY artifact_type, artifact_id, version_number 
    HAVING COUNT(*) > 1
  `);
  
  if (remainingDuplicates.rows.length === 0) {
    console.log("✅ Verification passed: No duplicate records remain");
  } else {
    console.log("❌ Verification failed: Still have duplicates:");
    console.log(remainingDuplicates.rows);
  }
  
  // Show total count
  const totalCount = await db.execute(sql`SELECT COUNT(*) as count FROM artifact_versions`);
  console.log(`📊 Total artifact version records: ${(totalCount.rows[0] as any).count}`);
}

async function main() {
  try {
    console.log("🚀 Starting database cleanup process...\n");
    
    await cleanupDuplicateVersions();
    await addUniqueConstraint();
    await verifyCleanup();
    
    console.log("\n🎉 Database cleanup completed successfully!");
    
  } catch (error) {
    console.error("💥 Error during cleanup:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();