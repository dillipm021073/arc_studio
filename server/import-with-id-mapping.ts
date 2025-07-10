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
  communicationMentions
} from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Maps to track old IDs to new IDs
const idMaps = {
  applications: new Map<number, number>(),
  interfaces: new Map<number, number>(),
  businessProcesses: new Map<number, number>(),
  changeRequests: new Map<number, number>(),
  conversations: new Map<number, number>(),
  businessProcessInterfaces: new Map<number, number>(),
  communicationComments: new Map<number, number>()
};

async function importWithIdMapping() {
  try {
    console.log("🔄 Starting import with ID mapping...");
    
    // Read the all-data.json file
    const backupFilePath = path.join(process.cwd(), 'data', 'all-data.json');
    
    if (!fs.existsSync(backupFilePath)) {
      console.error("❌ Backup file not found at:", backupFilePath);
      process.exit(1);
    }
    
    const fileContent = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
    console.log("✅ Backup file loaded successfully");
    
    // Extract the actual data from the nested structure
    const backupData = fileContent.data || fileContent;
    
    // Import data in correct order to respect foreign key constraints
    console.log("\n📥 Importing data with ID mapping...");
    
    // 1. Applications
    if (backupData.applications && backupData.applications.length > 0) {
      console.log(`Importing ${backupData.applications.length} applications...`);
      
      for (const app of backupData.applications) {
        const { id: oldId, createdAt, updatedAt, ...appData } = app;
        
        // Add amlNumber if missing
        if (!appData.amlNumber) {
          appData.amlNumber = `AML-${String(oldId || Date.now()).padStart(4, '0')}`;
        }
        
        // Convert date strings to Date objects
        if (appData.firstActiveDate) appData.firstActiveDate = new Date(appData.firstActiveDate);
        if (appData.lastChangeDate) appData.lastChangeDate = new Date(appData.lastChangeDate);
        if (appData.decommissionDate) appData.decommissionDate = new Date(appData.decommissionDate);
        
        const [inserted] = await db.insert(applications).values(appData).returning({ id: applications.id });
        idMaps.applications.set(oldId, inserted.id);
      }
      
      console.log("✅ Applications imported with ID mapping");
    }
    
    // 2. Interfaces
    if (backupData.interfaces && backupData.interfaces.length > 0) {
      console.log(`Importing ${backupData.interfaces.length} interfaces...`);
      
      for (const iface of backupData.interfaces) {
        const { id: oldId, createdAt, updatedAt, ...ifaceData } = iface;
        
        // Add middleware if missing
        if (!ifaceData.middleware) {
          ifaceData.middleware = "None";
        }
        
        // Map foreign keys
        if (ifaceData.providerApplicationId) {
          ifaceData.providerApplicationId = idMaps.applications.get(ifaceData.providerApplicationId) || ifaceData.providerApplicationId;
        }
        if (ifaceData.consumerApplicationId) {
          ifaceData.consumerApplicationId = idMaps.applications.get(ifaceData.consumerApplicationId) || ifaceData.consumerApplicationId;
        }
        
        // Convert date strings to Date objects
        if (ifaceData.lastChangeDate) ifaceData.lastChangeDate = new Date(ifaceData.lastChangeDate);
        if (ifaceData.decommissionDate) ifaceData.decommissionDate = new Date(ifaceData.decommissionDate);
        
        const [inserted] = await db.insert(interfaces).values(ifaceData).returning({ id: interfaces.id });
        idMaps.interfaces.set(oldId, inserted.id);
      }
      
      console.log("✅ Interfaces imported with ID mapping");
    }
    
    // 3. Business Processes
    if (backupData.businessProcesses && backupData.businessProcesses.length > 0) {
      console.log(`Importing ${backupData.businessProcesses.length} business processes...`);
      
      for (const bp of backupData.businessProcesses) {
        const { id: oldId, createdAt, updatedAt, ...bpData } = bp;
        
        // Map parent process ID if exists
        if (bpData.parentProcessId) {
          bpData.parentProcessId = idMaps.businessProcesses.get(bpData.parentProcessId) || null;
        }
        
        const [inserted] = await db.insert(businessProcesses).values(bpData).returning({ id: businessProcesses.id });
        idMaps.businessProcesses.set(oldId, inserted.id);
      }
      
      console.log("✅ Business processes imported with ID mapping");
    }
    
    // 4. Business Process Interfaces
    if (backupData.businessProcessInterfaces && backupData.businessProcessInterfaces.length > 0) {
      console.log(`Importing ${backupData.businessProcessInterfaces.length} business process interfaces...`);
      
      for (const bpi of backupData.businessProcessInterfaces) {
        const { id: oldId, createdAt, updatedAt, ...bpiData } = bpi;
        
        // Map foreign keys
        if (bpiData.businessProcessId) {
          bpiData.businessProcessId = idMaps.businessProcesses.get(bpiData.businessProcessId) || bpiData.businessProcessId;
        }
        if (bpiData.interfaceId) {
          bpiData.interfaceId = idMaps.interfaces.get(bpiData.interfaceId) || bpiData.interfaceId;
        }
        
        const [inserted] = await db.insert(businessProcessInterfaces).values(bpiData).returning({ id: businessProcessInterfaces.id });
        idMaps.businessProcessInterfaces.set(oldId, inserted.id);
      }
      
      console.log("✅ Business process interfaces imported with ID mapping");
    }
    
    // 5. Change Requests
    if (backupData.changeRequests && backupData.changeRequests.length > 0) {
      console.log(`Importing ${backupData.changeRequests.length} change requests...`);
      
      for (const cr of backupData.changeRequests) {
        const { id: oldId, createdAt, updatedAt, ...crData } = cr;
        
        // Convert date strings to Date objects
        if (crData.createdDate) crData.createdDate = new Date(crData.createdDate);
        if (crData.draftDate) crData.draftDate = new Date(crData.draftDate);
        if (crData.submittedDate) crData.submittedDate = new Date(crData.submittedDate);
        if (crData.approvedDate) crData.approvedDate = new Date(crData.approvedDate);
        if (crData.inProgressDate) crData.inProgressDate = new Date(crData.inProgressDate);
        if (crData.completedDate) crData.completedDate = new Date(crData.completedDate);
        if (crData.cancelledDate) crData.cancelledDate = new Date(crData.cancelledDate);
        if (crData.targetDate) crData.targetDate = new Date(crData.targetDate);
        
        const [inserted] = await db.insert(changeRequests).values(crData).returning({ id: changeRequests.id });
        idMaps.changeRequests.set(oldId, inserted.id);
      }
      
      console.log("✅ Change requests imported with ID mapping");
    }
    
    // 6. Change Request Applications
    if (backupData.changeRequestApplications && backupData.changeRequestApplications.length > 0) {
      console.log(`Importing ${backupData.changeRequestApplications.length} change request applications...`);
      
      for (const cra of backupData.changeRequestApplications) {
        const { id, createdAt, updatedAt, ...craData } = cra;
        
        // Map foreign keys
        if (craData.changeRequestId) {
          craData.changeRequestId = idMaps.changeRequests.get(craData.changeRequestId) || craData.changeRequestId;
        }
        if (craData.applicationId) {
          craData.applicationId = idMaps.applications.get(craData.applicationId) || craData.applicationId;
        }
        
        await db.insert(changeRequestApplications).values(craData);
      }
      
      console.log("✅ Change request applications imported");
    }
    
    // 7. Change Request Interfaces
    if (backupData.changeRequestInterfaces && backupData.changeRequestInterfaces.length > 0) {
      console.log(`Importing ${backupData.changeRequestInterfaces.length} change request interfaces...`);
      
      for (const cri of backupData.changeRequestInterfaces) {
        const { id, createdAt, updatedAt, ...criData } = cri;
        
        // Map foreign keys
        if (criData.changeRequestId) {
          criData.changeRequestId = idMaps.changeRequests.get(criData.changeRequestId) || criData.changeRequestId;
        }
        if (criData.interfaceId) {
          criData.interfaceId = idMaps.interfaces.get(criData.interfaceId) || criData.interfaceId;
        }
        
        await db.insert(changeRequestInterfaces).values(criData);
      }
      
      console.log("✅ Change request interfaces imported");
    }
    
    // 8. Conversations
    if (backupData.conversations && backupData.conversations.length > 0) {
      console.log(`Importing ${backupData.conversations.length} conversations...`);
      
      for (const conv of backupData.conversations) {
        const { id: oldId, ...convData } = conv;
        
        // Convert date strings to Date objects
        if (convData.createdAt) convData.createdAt = new Date(convData.createdAt);
        if (convData.updatedAt) convData.updatedAt = new Date(convData.updatedAt);
        if (convData.resolvedAt) convData.resolvedAt = new Date(convData.resolvedAt);
        
        const [inserted] = await db.insert(conversations).values(convData).returning({ id: conversations.id });
        idMaps.conversations.set(oldId, inserted.id);
      }
      
      console.log("✅ Conversations imported with ID mapping");
    }
    
    // 9. Conversation Links
    if (backupData.conversationLinks && backupData.conversationLinks.length > 0) {
      console.log(`Importing ${backupData.conversationLinks.length} conversation links...`);
      
      for (const link of backupData.conversationLinks) {
        const { id, createdAt, updatedAt, ...linkData } = link;
        
        // Map foreign keys
        if (linkData.conversationId) {
          linkData.conversationId = idMaps.conversations.get(linkData.conversationId) || linkData.conversationId;
        }
        
        // Map entity IDs based on entity type
        if (linkData.entityId) {
          switch (linkData.entityType) {
            case 'application':
              linkData.entityId = idMaps.applications.get(linkData.entityId) || linkData.entityId;
              break;
            case 'interface':
              linkData.entityId = idMaps.interfaces.get(linkData.entityId) || linkData.entityId;
              break;
            case 'businessProcess':
              linkData.entityId = idMaps.businessProcesses.get(linkData.entityId) || linkData.entityId;
              break;
            case 'changeRequest':
              linkData.entityId = idMaps.changeRequests.get(linkData.entityId) || linkData.entityId;
              break;
          }
        }
        
        await db.insert(conversationLinks).values(linkData);
      }
      
      console.log("✅ Conversation links imported");
    }
    
    // 10. Conversation Participants
    if (backupData.conversationParticipants && backupData.conversationParticipants.length > 0) {
      console.log(`Importing ${backupData.conversationParticipants.length} conversation participants...`);
      
      for (const participant of backupData.conversationParticipants) {
        const { id, createdAt, updatedAt, ...participantData } = participant;
        
        // Map foreign keys
        if (participantData.conversationId) {
          participantData.conversationId = idMaps.conversations.get(participantData.conversationId) || participantData.conversationId;
        }
        
        // Convert date strings
        if (participantData.addedAt) participantData.addedAt = new Date(participantData.addedAt);
        
        await db.insert(conversationParticipants).values(participantData);
      }
      
      console.log("✅ Conversation participants imported");
    }
    
    // 11. Communication Comments
    if (backupData.communicationComments && backupData.communicationComments.length > 0) {
      console.log(`Importing ${backupData.communicationComments.length} communication comments...`);
      
      for (const comment of backupData.communicationComments) {
        const { id: oldId, ...commentData } = comment;
        
        // Map foreign keys
        if (commentData.conversationId) {
          commentData.conversationId = idMaps.conversations.get(commentData.conversationId) || commentData.conversationId;
        }
        
        // Convert date strings
        if (commentData.createdAt) commentData.createdAt = new Date(commentData.createdAt);
        if (commentData.updatedAt) commentData.updatedAt = new Date(commentData.updatedAt);
        
        const [inserted] = await db.insert(communicationComments).values(commentData).returning({ id: communicationComments.id });
        idMaps.communicationComments.set(oldId, inserted.id);
      }
      
      console.log("✅ Communication comments imported");
    }
    
    // 12. IML Diagrams
    if (backupData.imlDiagrams && backupData.imlDiagrams.length > 0) {
      console.log(`Importing ${backupData.imlDiagrams.length} IML diagrams...`);
      
      for (const diagram of backupData.imlDiagrams) {
        const { id, createdAt, updatedAt, ...diagramData } = diagram;
        
        // Map foreign keys
        if (diagramData.businessProcessId) {
          diagramData.businessProcessId = idMaps.businessProcesses.get(diagramData.businessProcessId) || diagramData.businessProcessId;
        }
        
        await db.insert(imlDiagrams).values(diagramData);
      }
      
      console.log("✅ IML diagrams imported");
    }
    
    console.log("\n✅ Import completed successfully with ID mapping!");
    
    // Print summary
    console.log("\n📊 Import Summary:");
    console.log(`  - Applications: ${idMaps.applications.size}`);
    console.log(`  - Interfaces: ${idMaps.interfaces.size}`);
    console.log(`  - Business Processes: ${idMaps.businessProcesses.size}`);
    console.log(`  - Change Requests: ${idMaps.changeRequests.size}`);
    console.log(`  - Conversations: ${idMaps.conversations.size}`);
    
  } catch (error) {
    console.error("❌ Error during import:", error);
  } finally {
    // Clean up data directory
    const dataDir = path.join(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true, force: true });
      console.log("🧹 Data directory cleaned up");
    }
    process.exit(0);
  }
}

importWithIdMapping();