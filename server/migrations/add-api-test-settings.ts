import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function addApiTestSettings() {
  try {
    console.log("Adding settings column to api_test_requests table...");
    
    // Check if column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'api_test_requests' 
      AND column_name = 'settings'
    `);
    
    if (result.rows.length > 0) {
      console.log("Settings column already exists");
      return;
    }
    
    // Add the settings column
    await db.execute(sql`
      ALTER TABLE api_test_requests 
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb
    `);
    
    console.log("Settings column added successfully");
  } catch (error) {
    console.error("Error adding settings column:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

addApiTestSettings();