import 'dotenv/config';
import { db } from "./db";
import { 
  applications,
  interfaces,
  businessProcesses,
  businessProcessInterfaces,
  businessProcessRelationships,
  changeRequests,
  changeRequestApplications,
  changeRequestInterfaces,
  interfaceComments,
  interfaceVersions,
  interfaceConsumerDescriptions,
  imlDiagrams,
  conversations,
  conversationLinks,
  conversationParticipants,
  communicationComments,
  communicationAttachments,
  communicationMentions,
  technicalProcesses,
  technicalProcessInterfaces,
  technicalProcessDependencies,
  changeRequestTechnicalProcesses
} from "@shared/schema";

async function cleanDataExceptUsers() {
  try {
    console.log("🧹 Cleaning all data except users...");
    
    // Delete in correct order to respect foreign key constraints
    
    // Communication related
    console.log("Cleaning communication data...");
    await db.delete(communicationMentions);
    await db.delete(communicationAttachments);
    await db.delete(communicationComments);
    await db.delete(conversationParticipants);
    await db.delete(conversationLinks);
    await db.delete(conversations);
    
    // Interface related
    console.log("Cleaning interface related data...");
    await db.delete(imlDiagrams);
    await db.delete(interfaceConsumerDescriptions);
    await db.delete(interfaceVersions);
    await db.delete(interfaceComments);
    await db.delete(businessProcessInterfaces);
    
    // Change request related
    console.log("Cleaning change request data...");
    await db.delete(changeRequestTechnicalProcesses);
    await db.delete(changeRequestInterfaces);
    await db.delete(changeRequestApplications);
    await db.delete(changeRequests);
    
    // Technical process related
    console.log("Cleaning technical process data...");
    await db.delete(technicalProcessDependencies);
    await db.delete(technicalProcessInterfaces);
    await db.delete(technicalProcesses);
    
    // Business process related
    console.log("Cleaning business process data...");
    await db.delete(businessProcessRelationships);
    await db.delete(businessProcesses);
    
    // Core entities
    console.log("Cleaning core entities...");
    await db.delete(interfaces);
    await db.delete(applications);
    
    console.log("✅ All data cleaned except users!");
    console.log("💡 Users remain in the system - you can still login with existing credentials");
    
  } catch (error) {
    console.error("❌ Error cleaning data:", error);
  } finally {
    process.exit(0);
  }
}

cleanDataExceptUsers();