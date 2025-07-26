import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables BEFORE importing db
config({ path: path.resolve(__dirname, "../.env") });

import { db } from "./db";
import { 
  applications,
  interfaces,
  businessProcesses,
  internalActivities,
  technicalProcesses,
  conversations,
  conversationLinks,
  changeRequests,
  applicationCapabilities,
  
  // Junction tables that need to be cleared first
  changeRequestApplications,
  changeRequestInterfaces,
  changeRequestInternalActivities,
  changeRequestTechnicalProcesses,
  businessProcessInterfaces,
  conversationParticipants,
  technicalProcessInterfaces,
  technicalProcessDependencies,
  technicalProcessInternalActivities
} from "../shared/schema";
import { sql } from "drizzle-orm";
import { exit } from "process";

async function cleanupTodayArtifacts() {
  console.log("Starting FINAL cleanup of artifacts created today...");
  
  const today = new Date().toISOString().split('T')[0];
  console.log(`Today's date: ${today}`);
  
  try {
    // Step 1: Delete from junction tables first (these reference the main tables)
    console.log("\n--- Step 1: Cleaning junction tables ---");
    
    // Delete change request relationships
    try {
      await db.delete(changeRequestApplications)
        .where(sql`
          application_id IN (
            SELECT id FROM ${applications} 
            WHERE DATE(created_at) = ${today}
          ) OR change_request_id IN (
            SELECT id FROM ${changeRequests}
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted change request application links");
    } catch (error: any) {
      console.log(`❌ Failed to delete change request application links - ${error.message}`);
    }

    try {
      await db.delete(changeRequestInterfaces)
        .where(sql`
          interface_id IN (
            SELECT id FROM ${interfaces} 
            WHERE DATE(created_at) = ${today}
          ) OR change_request_id IN (
            SELECT id FROM ${changeRequests}
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted change request interface links");
    } catch (error: any) {
      console.log(`❌ Failed to delete change request interface links - ${error.message}`);
    }

    try {
      await db.delete(changeRequestInternalActivities)
        .where(sql`
          internal_activity_id IN (
            SELECT id FROM ${internalActivities} 
            WHERE DATE(created_at) = ${today}
          ) OR change_request_id IN (
            SELECT id FROM ${changeRequests}
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted change request internal activity links");
    } catch (error: any) {
      console.log(`❌ Failed to delete change request internal activity links - ${error.message}`);
    }

    try {
      await db.delete(changeRequestTechnicalProcesses)
        .where(sql`
          technical_process_id IN (
            SELECT id FROM ${technicalProcesses} 
            WHERE DATE(created_at) = ${today}
          ) OR change_request_id IN (
            SELECT id FROM ${changeRequests}
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted change request technical process links");
    } catch (error: any) {
      console.log(`❌ Failed to delete change request technical process links - ${error.message}`);
    }

    // Delete business process relationships
    try {
      await db.delete(businessProcessRelationships)
        .where(sql`
          parent_process_id IN (
            SELECT id FROM ${businessProcesses} 
            WHERE DATE(created_at) = ${today}
          ) OR child_process_id IN (
            SELECT id FROM ${businessProcesses} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted business process relationships");
    } catch (error: any) {
      console.log(`❌ Failed to delete business process relationships - ${error.message}`);
    }

    // Delete business process interface relationships
    try {
      await db.delete(businessProcessInterfaces)
        .where(sql`
          business_process_id IN (
            SELECT id FROM ${businessProcesses} 
            WHERE DATE(created_at) = ${today}
          ) OR interface_id IN (
            SELECT id FROM ${interfaces} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted business process interface links");
    } catch (error: any) {
      console.log(`❌ Failed to delete business process interface links - ${error.message}`);
    }

    // Delete comments related to conversations created today
    try {
      await db.delete(comments)
        .where(sql`
          conversation_id IN (
            SELECT id FROM ${conversations} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted comments");
    } catch (error: any) {
      console.log(`❌ Failed to delete comments - ${error.message}`);
    }

    // Delete conversation participants before conversations
    try {
      await db.delete(conversationParticipants)
        .where(sql`
          conversation_id IN (
            SELECT id FROM ${conversations} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted conversation participants");
    } catch (error: any) {
      console.log(`❌ Failed to delete conversation participants - ${error.message}`);
    }

    // Delete technical process relationships
    try {
      await db.delete(technicalProcessInterfaces)
        .where(sql`
          technical_process_id IN (
            SELECT id FROM ${technicalProcesses} 
            WHERE DATE(created_at) = ${today}
          ) OR interface_id IN (
            SELECT id FROM ${interfaces} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted technical process interface links");
    } catch (error: any) {
      console.log(`❌ Failed to delete technical process interface links - ${error.message}`);
    }

    try {
      await db.delete(technicalProcessDependencies)
        .where(sql`
          technical_process_id IN (
            SELECT id FROM ${technicalProcesses} 
            WHERE DATE(created_at) = ${today}
          ) OR depends_on_process_id IN (
            SELECT id FROM ${technicalProcesses} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted technical process dependencies");
    } catch (error: any) {
      console.log(`❌ Failed to delete technical process dependencies - ${error.message}`);
    }

    try {
      await db.delete(technicalProcessInternalActivities)
        .where(sql`
          technical_process_id IN (
            SELECT id FROM ${technicalProcesses} 
            WHERE DATE(created_at) = ${today}
          ) OR internal_activity_id IN (
            SELECT id FROM ${internalActivities} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted technical process internal activity links");
    } catch (error: any) {
      console.log(`❌ Failed to delete technical process internal activity links - ${error.message}`);
    }

    // Step 2: Delete internal activities that reference applications created today
    // This is needed because application_id is NOT NULL in internal_activities
    console.log("\n--- Step 2: Handling dependent entities ---");
    
    try {
      await db.delete(internalActivities)
        .where(sql`
          application_id IN (
            SELECT id FROM ${applications} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted internal activities referencing applications created today");
    } catch (error: any) {
      console.log(`❌ Failed to delete internal activities referencing applications - ${error.message}`);
    }

    // Nullify interface references to applications that will be deleted
    try {
      await db.update(interfaces)
        .set({ 
          providerApplicationId: null,
          consumerApplicationId: null 
        })
        .where(sql`
          provider_application_id IN (
            SELECT id FROM ${applications} 
            WHERE DATE(created_at) = ${today}
          ) OR consumer_application_id IN (
            SELECT id FROM ${applications} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Nullified interfaces application references");
    } catch (error: any) {
      console.log(`❌ Failed to nullify interfaces application references - ${error.message}`);
    }

    // Step 3: Delete main entities
    console.log("\n--- Step 3: Cleaning main entities ---");
    
    // Delete version control locks
    try {
      await db.delete(versionControlLocks)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted version control locks");
    } catch (error: any) {
      console.log(`❌ Failed to delete version control locks - ${error.message}`);
    }

    // Delete initiative changes
    try {
      await db.delete(initiativeChanges)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted initiative changes");
    } catch (error: any) {
      console.log(`❌ Failed to delete initiative changes - ${error.message}`);
    }

    // Delete change requests
    try {
      await db.delete(changeRequests)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted change requests");
    } catch (error: any) {
      console.log(`❌ Failed to delete change requests - ${error.message}`);
    }

    // Delete conversation links
    try {
      await db.delete(conversationLinks)
        .where(sql`
          conversation_id IN (
            SELECT id FROM ${conversations} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted conversation links");
    } catch (error: any) {
      console.log(`❌ Failed to delete conversation links - ${error.message}`);
    }

    // Delete conversations (after participants and comments are deleted)
    try {
      await db.delete(conversations)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted conversations");
    } catch (error: any) {
      console.log(`❌ Failed to delete conversations - ${error.message}`);
    }

    // Delete technical processes
    try {
      await db.delete(technicalProcesses)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted technical processes");
    } catch (error: any) {
      console.log(`❌ Failed to delete technical processes - ${error.message}`);
    }

    // Delete business processes
    try {
      await db.delete(businessProcesses)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted business processes");
    } catch (error: any) {
      console.log(`❌ Failed to delete business processes - ${error.message}`);
    }

    // Delete internal activities created today (not just those referencing deleted apps)
    try {
      await db.delete(internalActivities)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted internal activities created today");
    } catch (error: any) {
      console.log(`❌ Failed to delete internal activities - ${error.message}`);
    }

    // Delete application capabilities
    try {
      await db.delete(applicationCapabilities)
        .where(sql`
          application_id IN (
            SELECT id FROM ${applications} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted application capabilities");
    } catch (error: any) {
      console.log(`❌ Failed to delete application capabilities - ${error.message}`);
    }

    // Delete interfaces created today
    try {
      await db.delete(interfaces)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted interfaces");
    } catch (error: any) {
      console.log(`❌ Failed to delete interfaces - ${error.message}`);
    }

    // Finally, delete applications (all references should be cleared by now)
    try {
      await db.delete(applications)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted applications");
    } catch (error: any) {
      console.log(`❌ Failed to delete applications - ${error.message}`);
    }

    console.log("\n✅ Cleanup completed successfully!");
    
  } catch (error) {
    console.error("❌ Cleanup failed with error:", error);
    exit(1);
  }
  
  exit(0);
}

// Run the cleanup
cleanupTodayArtifacts();