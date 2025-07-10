import 'dotenv/config';
import { db } from "./db";
import { applications, interfaces } from "@shared/schema";
import { isNull, sql } from "drizzle-orm";

async function fixMissingFields() {
  try {
    console.log("🔧 Fixing missing fields in existing data...");
    
    // Get all applications without amlNumber
    const appsWithoutAml = await db
      .select()
      .from(applications)
      .where(isNull(applications.amlNumber));
    
    console.log(`Found ${appsWithoutAml.length} applications without AML numbers`);
    
    // Update each application with a generated AML number
    for (let i = 0; i < appsWithoutAml.length; i++) {
      const app = appsWithoutAml[i];
      const amlNumber = `AML-AUTO-${String(i + 1).padStart(3, '0')}`;
      
      await db
        .update(applications)
        .set({ amlNumber })
        .where(sql`id = ${app.id}`);
      
      console.log(`Updated ${app.name} with AML number: ${amlNumber}`);
    }
    
    // Get all interfaces without middleware
    const interfacesWithoutMiddleware = await db
      .select()
      .from(interfaces)
      .where(isNull(interfaces.middleware));
    
    console.log(`Found ${interfacesWithoutMiddleware.length} interfaces without middleware`);
    
    // Update interfaces to have default middleware value
    if (interfacesWithoutMiddleware.length > 0) {
      await db
        .update(interfaces)
        .set({ middleware: "None" })
        .where(isNull(interfaces.middleware));
      
      console.log(`Updated all interfaces with default middleware: None`);
    }
    
    console.log("✅ Fixed missing fields successfully!");
    
  } catch (error) {
    console.error("❌ Error fixing missing fields:", error);
  } finally {
    process.exit(0);
  }
}

fixMissingFields();