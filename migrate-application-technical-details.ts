import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function migrateApplicationTechnicalDetails() {
  console.log('Starting migration to add technical details fields to applications table...');
  
  try {
    // Add new columns to applications table
    await db.execute(sql`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS application_type TEXT,
      ADD COLUMN IF NOT EXISTS has_database BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS database_type TEXT,
      ADD COLUMN IF NOT EXISTS database_name TEXT,
      ADD COLUMN IF NOT EXISTS shared_database BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS frontend_technology TEXT,
      ADD COLUMN IF NOT EXISTS backend_technology TEXT
    `);
    
    console.log('Successfully added technical details columns to applications table');
    
    // Set default values for existing applications based on their characteristics
    console.log('Setting default values for existing applications...');
    
    // Update applications that provide external interfaces as likely backend/middleware
    await db.execute(sql`
      UPDATE applications 
      SET application_type = 'backend' 
      WHERE provides_ext_interface = true 
      AND application_type IS NULL
    `);
    
    // Update applications deployed on-premise as likely having databases
    await db.execute(sql`
      UPDATE applications 
      SET has_database = true 
      WHERE deployment = 'on-premise' 
      AND has_database = false
    `);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    process.exit();
  }
}

migrateApplicationTechnicalDetails();