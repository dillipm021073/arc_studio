import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function addProtocolContentType() {
  try {
    console.log("Adding protocol and contentType columns to api_test_requests table...");
    
    // Add protocol column
    await db.execute(sql`
      ALTER TABLE api_test_requests 
      ADD COLUMN IF NOT EXISTS protocol VARCHAR(10) DEFAULT 'HTTPS'
    `);
    
    // Add contentType column
    await db.execute(sql`
      ALTER TABLE api_test_requests 
      ADD COLUMN IF NOT EXISTS content_type VARCHAR(100) DEFAULT 'application/json'
    `);
    
    console.log("Protocol and contentType columns added successfully");
  } catch (error) {
    console.error("Error adding columns:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

addProtocolContentType();