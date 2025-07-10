import { sql } from "drizzle-orm";
import { db } from "../db";

async function recreateUserActivityLog() {
  try {
    console.log("Creating user_activity_log table...");

    // Create the table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        username TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        method TEXT,
        endpoint TEXT,
        resource TEXT,
        resource_id INTEGER,
        action TEXT,
        status_code INTEGER,
        error_message TEXT,
        request_body TEXT,
        response_time INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Table created successfully!");

    // Create indexes
    console.log("Creating indexes...");

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id 
      ON user_activity_log(user_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type 
      ON user_activity_log(activity_type)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at 
      ON user_activity_log(created_at)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_activity_log_resource 
      ON user_activity_log(resource, resource_id)
    `);

    console.log("Indexes created successfully!");

    // Verify the table
    const result = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'user_activity_log'
      ORDER BY 
        ordinal_position
    `);

    console.log("Table structure:");
    console.table(result.rows);

    console.log("user_activity_log table recreated successfully!");

  } catch (error) {
    console.error("Error recreating user_activity_log table:", error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  recreateUserActivityLog()
    .then(() => {
      console.log("Migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { recreateUserActivityLog };