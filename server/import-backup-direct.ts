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
import fs from 'fs';
import path from 'path';

async function importBackupDirect() {
  try {
    console.log("🔄 Starting direct database import from backup...");
    
    // Read the all-data.json file
    const backupFilePath = path.join(process.cwd(), 'data', 'all-data.json');
    
    if (!fs.existsSync(backupFilePath)) {
      // Try individual files instead
      console.log("📁 All-data.json not found, trying individual files...");
      await importIndividualFiles();
      return;
    }
    
    const fileContent = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
    console.log("✅ Backup file loaded successfully");
    
    // Extract the actual data from the nested structure
    const backupData = fileContent.data || fileContent;
    
    // Import data in correct order to respect foreign key constraints
    console.log("\n📥 Importing data...");
    
    // 1. Applications
    if (backupData.applications && backupData.applications.length > 0) {
      console.log(`Importing ${backupData.applications.length} applications...`);
      // Remove id field and ensure all required fields are present
      const appsToInsert = backupData.applications.map((app: any) => {
        const { id, createdAt, updatedAt, ...appData } = app;
        // Add amlNumber if missing
        if (!appData.amlNumber) {
          appData.amlNumber = `AML-${String(id || Date.now()).padStart(4, '0')}`;
        }
        // Convert date strings to Date objects
        if (appData.firstActiveDate) appData.firstActiveDate = new Date(appData.firstActiveDate);
        if (appData.lastChangeDate) appData.lastChangeDate = new Date(appData.lastChangeDate);
        if (appData.decommissionDate) appData.decommissionDate = new Date(appData.decommissionDate);
        
        return appData;
      });
      await db.insert(applications).values(appsToInsert);
      console.log("✅ Applications imported");
    }
    
    // 2. Interfaces
    if (backupData.interfaces && backupData.interfaces.length > 0) {
      console.log(`Importing ${backupData.interfaces.length} interfaces...`);
      const interfacesToInsert = backupData.interfaces.map((iface: any) => {
        const { id, createdAt, updatedAt, ...ifaceData } = iface;
        // Add middleware if missing
        if (!ifaceData.middleware) {
          ifaceData.middleware = "None";
        }
        // Convert date strings to Date objects
        if (ifaceData.lastChangeDate) ifaceData.lastChangeDate = new Date(ifaceData.lastChangeDate);
        if (ifaceData.decommissionDate) ifaceData.decommissionDate = new Date(ifaceData.decommissionDate);
        
        return ifaceData;
      });
      await db.insert(interfaces).values(interfacesToInsert);
      console.log("✅ Interfaces imported");
    }
    
    // 3. Business Processes
    if (backupData.businessProcesses && backupData.businessProcesses.length > 0) {
      console.log(`Importing ${backupData.businessProcesses.length} business processes...`);
      const bpsToInsert = backupData.businessProcesses.map((bp: any) => {
        const { id, ...bpData } = bp;
        return bpData;
      });
      await db.insert(businessProcesses).values(bpsToInsert);
      console.log("✅ Business processes imported");
    }
    
    // 4. Business Process Interfaces
    if (backupData.businessProcessInterfaces && backupData.businessProcessInterfaces.length > 0) {
      console.log(`Importing ${backupData.businessProcessInterfaces.length} business process interfaces...`);
      const bpInterfacesToInsert = backupData.businessProcessInterfaces.map((bpi: any) => {
        const { id, ...bpiData } = bpi;
        return bpiData;
      });
      await db.insert(businessProcessInterfaces).values(bpInterfacesToInsert);
      console.log("✅ Business process interfaces imported");
    }
    
    // 5. Change Requests
    if (backupData.changeRequests && backupData.changeRequests.length > 0) {
      console.log(`Importing ${backupData.changeRequests.length} change requests...`);
      const crsToInsert = backupData.changeRequests.map((cr: any) => {
        const { id, createdAt, updatedAt, ...crData } = cr;
        // Convert date strings to Date objects
        if (crData.createdDate) crData.createdDate = new Date(crData.createdDate);
        if (crData.draftDate) crData.draftDate = new Date(crData.draftDate);
        if (crData.submittedDate) crData.submittedDate = new Date(crData.submittedDate);
        if (crData.approvedDate) crData.approvedDate = new Date(crData.approvedDate);
        if (crData.inProgressDate) crData.inProgressDate = new Date(crData.inProgressDate);
        if (crData.completedDate) crData.completedDate = new Date(crData.completedDate);
        if (crData.cancelledDate) crData.cancelledDate = new Date(crData.cancelledDate);
        if (crData.targetDate) crData.targetDate = new Date(crData.targetDate);
        
        return crData;
      });
      await db.insert(changeRequests).values(crsToInsert);
      console.log("✅ Change requests imported");
    }
    
    // 6. Change Request Applications
    if (backupData.changeRequestApplications && backupData.changeRequestApplications.length > 0) {
      console.log(`Importing ${backupData.changeRequestApplications.length} change request applications...`);
      const craToInsert = backupData.changeRequestApplications.map((cra: any) => {
        const { id, ...craData } = cra;
        return craData;
      });
      await db.insert(changeRequestApplications).values(craToInsert);
      console.log("✅ Change request applications imported");
    }
    
    // 7. Change Request Interfaces
    if (backupData.changeRequestInterfaces && backupData.changeRequestInterfaces.length > 0) {
      console.log(`Importing ${backupData.changeRequestInterfaces.length} change request interfaces...`);
      const criToInsert = backupData.changeRequestInterfaces.map((cri: any) => {
        const { id, ...criData } = cri;
        return criData;
      });
      await db.insert(changeRequestInterfaces).values(criToInsert);
      console.log("✅ Change request interfaces imported");
    }
    
    // 8. Conversations
    if (backupData.conversations && backupData.conversations.length > 0) {
      console.log(`Importing ${backupData.conversations.length} conversations...`);
      const convsToInsert = backupData.conversations.map((conv: any) => {
        const { id, createdAt, updatedAt, ...convData } = conv;
        // Convert date strings to Date objects
        if (convData.conversationDate) convData.conversationDate = new Date(convData.conversationDate);
        if (convData.followUpDate) convData.followUpDate = new Date(convData.followUpDate);
        
        return convData;
      });
      await db.insert(conversations).values(convsToInsert);
      console.log("✅ Conversations imported");
    }
    
    // 9. IML Diagrams
    if (backupData.imlDiagrams && backupData.imlDiagrams.length > 0) {
      console.log(`Importing ${backupData.imlDiagrams.length} IML diagrams...`);
      const diagramsToInsert = backupData.imlDiagrams.map((diagram: any) => {
        const { id, ...diagramData } = diagram;
        return diagramData;
      });
      await db.insert(imlDiagrams).values(diagramsToInsert);
      console.log("✅ IML diagrams imported");
    }
    
    console.log("\n✅ Import completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during import:", error);
  } finally {
    // Clean up temporary directory
    const dataDir = path.join(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true, force: true });
      console.log("🧹 Data directory cleaned up");
    }
    process.exit(0);
  }
}

async function importIndividualFiles() {
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    // Import in correct order
    const importOrder = [
      { file: 'applications.json', table: applications, name: 'applications' },
      { file: 'interfaces.json', table: interfaces, name: 'interfaces' },
      { file: 'businessProcesses.json', table: businessProcesses, name: 'businessProcesses' },
      { file: 'businessProcessInterfaces.json', table: businessProcessInterfaces, name: 'businessProcessInterfaces' },
      { file: 'changeRequests.json', table: changeRequests, name: 'changeRequests' },
      { file: 'changeRequestApplications.json', table: changeRequestApplications, name: 'changeRequestApplications' },
      { file: 'changeRequestInterfaces.json', table: changeRequestInterfaces, name: 'changeRequestInterfaces' },
      { file: 'conversations.json', table: conversations, name: 'conversations' },
      { file: 'conversationLinks.json', table: conversationLinks, name: 'conversationLinks' },
      { file: 'conversationParticipants.json', table: conversationParticipants, name: 'conversationParticipants' },
      { file: 'communicationComments.json', table: communicationComments, name: 'communicationComments' },
      { file: 'imlDiagrams.json', table: imlDiagrams, name: 'imlDiagrams' }
    ];
    
    for (const { file, table, name } of importOrder) {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Importing ${data.length} ${name}...`);
          
          // Process data based on table
          const processedData = data.map((record: any) => {
            const { id, createdAt, updatedAt, ...recordData } = record;
            
            // Add missing fields based on table
            if (name === 'applications' && !recordData.amlNumber) {
              recordData.amlNumber = `AML-${String(id || Date.now()).padStart(4, '0')}`;
            }
            if (name === 'interfaces' && !recordData.middleware) {
              recordData.middleware = "None";
            }
            
            // Convert date fields for all entities
            Object.keys(recordData).forEach(key => {
              if (key.includes('Date') && recordData[key]) {
                recordData[key] = new Date(recordData[key]);
              }
            });
            
            return recordData;
          });
          
          await db.insert(table).values(processedData);
          console.log(`✅ ${name} imported`);
        }
      }
    }
    
    console.log("\n✅ Import from individual files completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during individual file import:", error);
    throw error;
  }
}

importBackupDirect();