import { config } from "dotenv";
import path from "path";
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
  changeRequestBusinessProcesses,
  changeRequestTechnicalProcesses,
  businessProcessInterfaces,
  conversationParticipants,
  artifactVersions,
  artifactLocks,
  initiativeArtifacts
} from "../shared/schema";
import { sql } from "drizzle-orm";
import { exit } from "process";

// Load environment variables
config({ path: path.resolve(__dirname, "../.env") });

async function cleanupTodayArtifacts() {
  console.log("Starting cleanup of artifacts created today with cascade handling...");
  
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
          )
        `);
      console.log("✅ Deleted change request interface links");
    } catch (error: any) {
      console.log(`❌ Failed to delete change request interface links - ${error.message}`);
    }

    try {
      await db.delete(changeRequestBusinessProcesses)
        .where(sql`
          business_process_id IN (
            SELECT id FROM ${businessProcesses} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted change request business process links");
    } catch (error: any) {
      console.log(`❌ Failed to delete change request business process links - ${error.message}`);
    }

    try {
      await db.delete(changeRequestTechnicalProcesses)
        .where(sql`
          technical_process_id IN (
            SELECT id FROM ${technicalProcesses} 
            WHERE DATE(created_at) = ${today}
          )
        `);
      console.log("✅ Deleted change request technical process links");
    } catch (error: any) {
      console.log(`❌ Failed to delete change request technical process links - ${error.message}`);
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

    // Step 2: Delete version control related data
    console.log("\n--- Step 2: Cleaning version control data ---");
    
    try {
      // Delete artifact versions for today's artifacts
      await db.delete(artifactVersions)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted artifact versions");
    } catch (error: any) {
      console.log(`⚠️  Artifact versions - ${error.message}`);
    }

    try {
      // Delete artifact locks for today's artifacts
      await db.delete(artifactLocks)
        .where(sql`DATE(locked_at) = ${today}`);
      console.log("✅ Deleted artifact locks");
    } catch (error: any) {
      console.log(`⚠️  Artifact locks - ${error.message}`);
    }

    try {
      // Delete initiative artifacts for today's artifacts
      await db.delete(initiativeArtifacts)
        .where(sql`DATE(added_at) = ${today}`);
      console.log("✅ Deleted initiative artifacts");
    } catch (error: any) {
      console.log(`⚠️  Initiative artifacts - ${error.message}`);
    }

    // Step 3: Delete main entities
    console.log("\n--- Step 3: Cleaning main entities ---");
    
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
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted conversation links");
    } catch (error: any) {
      console.log(`❌ Failed to delete conversation links - ${error.message}`);
    }

    // Delete conversations (after participants are deleted)
    try {
      await db.delete(conversations)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted conversations");
    } catch (error: any) {
      console.log(`❌ Failed to delete conversations - ${error.message}`);
    }

    // Delete internal activities
    try {
      await db.delete(internalActivities)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted internal activities");
    } catch (error: any) {
      console.log(`❌ Failed to delete internal activities - ${error.message}`);
    }

    // Delete technical processes
    try {
      await db.delete(technicalProcesses)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted technical processes");
    } catch (error: any) {
      console.log(`❌ Failed to delete technical processes - ${error.message}`);
    }

    // Delete business processes (after interface relationships are deleted)
    try {
      await db.delete(businessProcesses)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted business processes");
    } catch (error: any) {
      console.log(`❌ Failed to delete business processes - ${error.message}`);
    }

    // Delete interfaces (after relationships are deleted)
    try {
      await db.delete(interfaces)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted interfaces");
    } catch (error: any) {
      console.log(`❌ Failed to delete interfaces - ${error.message}`);
    }

    // Delete application capabilities
    try {
      await db.delete(applicationCapabilities)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted application capabilities");
    } catch (error: any) {
      console.log(`❌ Failed to delete application capabilities - ${error.message}`);
    }

    // Delete applications (after all relationships are deleted)
    try {
      await db.delete(applications)
        .where(sql`DATE(created_at) = ${today}`);
      console.log("✅ Deleted applications");
    } catch (error: any) {
      console.log(`❌ Failed to delete applications - ${error.message}`);
    }

    console.log("\n✅ Cleanup completed!");
    
  } catch (error) {
    console.error("❌ Cleanup failed with error:", error);
    exit(1);
  }
  
  exit(0);
}

// Run the cleanup
cleanupTodayArtifacts();