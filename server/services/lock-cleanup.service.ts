import { db } from "../db";
import { artifactLocks, initiatives } from "@db/schema";
import { and, lt, sql, eq, or } from "drizzle-orm";

export class LockCleanupService {
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  /**
   * Start the automatic lock cleanup service
   */
  static startCleanupService() {
    if (this.cleanupInterval) {
      console.log("Lock cleanup service already running");
      return;
    }

    console.log("Starting lock cleanup service...");
    
    // Run cleanup immediately on start
    this.cleanupExpiredLocks();
    
    // Then run every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredLocks();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop the automatic lock cleanup service
   */
  static stopCleanupService() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log("Lock cleanup service stopped");
    }
  }

  /**
   * Clean up expired locks and locks from completed/cancelled initiatives
   */
  static async cleanupExpiredLocks() {
    try {
      const now = new Date();
      console.log(`[Lock Cleanup] Starting cleanup at ${now.toISOString()}`);
      
      // 1. Delete expired locks
      const expiredResult = await db.delete(artifactLocks)
        .where(
          and(
            sql`${artifactLocks.lockExpiry} IS NOT NULL`,
            lt(artifactLocks.lockExpiry, now)
          )
        )
        .returning();
      
      if (expiredResult.length > 0) {
        console.log(`[Lock Cleanup] Deleted ${expiredResult.length} expired locks`);
        expiredResult.forEach(lock => {
          console.log(`  - Deleted: ${lock.artifactType} #${lock.artifactId}, expired at ${lock.lockExpiry}`);
        });
      }

      // 2. Delete locks from completed/cancelled initiatives
      const problematicResult = await db.delete(artifactLocks)
        .where(
          sql`${artifactLocks.initiativeId} IN (
            SELECT initiative_id FROM initiatives 
            WHERE status IN ('completed', 'cancelled')
          )`
        )
        .returning();
      
      if (problematicResult.length > 0) {
        console.log(`[Lock Cleanup] Deleted ${problematicResult.length} locks from completed/cancelled initiatives`);
      }

      const totalCleaned = expiredResult.length + problematicResult.length;
      if (totalCleaned === 0) {
        console.log("[Lock Cleanup] No locks to clean up");
      } else {
        console.log(`[Lock Cleanup] Total locks cleaned: ${totalCleaned}`);
      }
      
    } catch (error) {
      console.error("[Lock Cleanup] Error during cleanup:", error);
    }
  }

  /**
   * Manually trigger lock cleanup
   */
  static async forceCleanup() {
    console.log("[Lock Cleanup] Manual cleanup triggered");
    await this.cleanupExpiredLocks();
  }

  /**
   * Check if a lock is valid (not expired and initiative is active)
   */
  static async isLockValid(artifactType: string, artifactId: number): Promise<boolean> {
    const [lock] = await db.select({
      lock: artifactLocks,
      initiative: initiatives
    })
    .from(artifactLocks)
    .leftJoin(initiatives, eq(initiatives.initiativeId, artifactLocks.initiativeId))
    .where(
      and(
        eq(artifactLocks.artifactType, artifactType),
        eq(artifactLocks.artifactId, artifactId)
      )
    )
    .limit(1);

    if (!lock || !lock.lock) {
      return false;
    }

    // Check if lock is expired
    if (lock.lock.lockExpiry && new Date(lock.lock.lockExpiry) < new Date()) {
      return false;
    }

    // Check if initiative is still active
    if (!lock.initiative || lock.initiative.status !== 'active') {
      return false;
    }

    return true;
  }
}