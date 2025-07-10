import 'dotenv/config';
import { db } from './db';
import * as schema from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

async function exportAllData() {
  console.log('Starting data export...');
  
  const dataDir = path.join(process.cwd(), 'data');
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    // Export all tables
    const exportData: Record<string, any[]> = {};
    
    // Export users
    console.log('Exporting users...');
    const usersData = await db.select().from(schema.users);
    exportData.users = usersData;
    console.log(`  - Exported ${usersData.length} records from users`);
    
    // Export applications
    console.log('Exporting applications...');
    const applicationsData = await db.select().from(schema.applications);
    exportData.applications = applicationsData;
    console.log(`  - Exported ${applicationsData.length} records from applications`);
    
    // Export interfaces
    console.log('Exporting interfaces...');
    const interfacesData = await db.select().from(schema.interfaces);
    exportData.interfaces = interfacesData;
    console.log(`  - Exported ${interfacesData.length} records from interfaces`);
    
    // Export changeRequests
    console.log('Exporting changeRequests...');
    const changeRequestsData = await db.select().from(schema.changeRequests);
    exportData.changeRequests = changeRequestsData;
    console.log(`  - Exported ${changeRequestsData.length} records from changeRequests`);
    
    // Export changeRequestApplications
    console.log('Exporting changeRequestApplications...');
    const changeRequestApplicationsData = await db.select().from(schema.changeRequestApplications);
    exportData.changeRequestApplications = changeRequestApplicationsData;
    console.log(`  - Exported ${changeRequestApplicationsData.length} records from changeRequestApplications`);
    
    // Export changeRequestInterfaces
    console.log('Exporting changeRequestInterfaces...');
    const changeRequestInterfacesData = await db.select().from(schema.changeRequestInterfaces);
    exportData.changeRequestInterfaces = changeRequestInterfacesData;
    console.log(`  - Exported ${changeRequestInterfacesData.length} records from changeRequestInterfaces`);
    
    // Export businessProcesses
    console.log('Exporting businessProcesses...');
    const businessProcessesData = await db.select().from(schema.businessProcesses);
    exportData.businessProcesses = businessProcessesData;
    console.log(`  - Exported ${businessProcessesData.length} records from businessProcesses`);
    
    // Export businessProcessInterfaces
    console.log('Exporting businessProcessInterfaces...');
    const businessProcessInterfacesData = await db.select().from(schema.businessProcessInterfaces);
    exportData.businessProcessInterfaces = businessProcessInterfacesData;
    console.log(`  - Exported ${businessProcessInterfacesData.length} records from businessProcessInterfaces`);
    
    // Export conversations
    console.log('Exporting conversations...');
    const conversationsData = await db.select().from(schema.conversations);
    exportData.conversations = conversationsData;
    console.log(`  - Exported ${conversationsData.length} records from conversations`);
    
    // Export conversationLinks
    console.log('Exporting conversationLinks...');
    const conversationLinksData = await db.select().from(schema.conversationLinks);
    exportData.conversationLinks = conversationLinksData;
    console.log(`  - Exported ${conversationLinksData.length} records from conversationLinks`);
    
    // Export conversationParticipants
    console.log('Exporting conversationParticipants...');
    const conversationParticipantsData = await db.select().from(schema.conversationParticipants);
    exportData.conversationParticipants = conversationParticipantsData;
    console.log(`  - Exported ${conversationParticipantsData.length} records from conversationParticipants`);
    
    // Export communicationComments
    console.log('Exporting communicationComments...');
    const communicationCommentsData = await db.select().from(schema.communicationComments);
    exportData.communicationComments = communicationCommentsData;
    console.log(`  - Exported ${communicationCommentsData.length} records from communicationComments`);
    
    // Export communicationAttachments
    console.log('Exporting communicationAttachments...');
    const communicationAttachmentsData = await db.select().from(schema.communicationAttachments);
    exportData.communicationAttachments = communicationAttachmentsData;
    console.log(`  - Exported ${communicationAttachmentsData.length} records from communicationAttachments`);
    
    // Export communicationMentions
    console.log('Exporting communicationMentions...');
    const communicationMentionsData = await db.select().from(schema.communicationMentions);
    exportData.communicationMentions = communicationMentionsData;
    console.log(`  - Exported ${communicationMentionsData.length} records from communicationMentions`);
    
    // Export interfaceComments
    console.log('Exporting interfaceComments...');
    const interfaceCommentsData = await db.select().from(schema.interfaceComments);
    exportData.interfaceComments = interfaceCommentsData;
    console.log(`  - Exported ${interfaceCommentsData.length} records from interfaceComments`);
    
    // Export interfaceVersions
    console.log('Exporting interfaceVersions...');
    const interfaceVersionsData = await db.select().from(schema.interfaceVersions);
    exportData.interfaceVersions = interfaceVersionsData;
    console.log(`  - Exported ${interfaceVersionsData.length} records from interfaceVersions`);
    
    // Export interfaceConsumerDescriptions
    console.log('Exporting interfaceConsumerDescriptions...');
    const interfaceConsumerDescriptionsData = await db.select().from(schema.interfaceConsumerDescriptions);
    exportData.interfaceConsumerDescriptions = interfaceConsumerDescriptionsData;
    console.log(`  - Exported ${interfaceConsumerDescriptionsData.length} records from interfaceConsumerDescriptions`);
    
    // Export imlDiagrams
    console.log('Exporting imlDiagrams...');
    const imlDiagramsData = await db.select().from(schema.imlDiagrams);
    exportData.imlDiagrams = imlDiagramsData;
    console.log(`  - Exported ${imlDiagramsData.length} records from imlDiagrams`);
    

    // Save as JSON files
    for (const [tableName, data] of Object.entries(exportData)) {
      const filePath = path.join(dataDir, `${tableName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    // Create a metadata file with export info
    const metadata = {
      exportDate: new Date().toISOString(),
      tables: Object.keys(exportData).map(table => ({
        name: table,
        recordCount: exportData[table].length
      })),
      version: '1.0'
    };
    
    fs.writeFileSync(
      path.join(dataDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Create a combined data file for easy import
    const combinedData = {
      metadata,
      data: exportData
    };
    
    fs.writeFileSync(
      path.join(dataDir, 'all-data.json'),
      JSON.stringify(combinedData, null, 2)
    );

    console.log('\nData export completed successfully!');
    console.log(`All data exported to: ${dataDir}`);
    
  } catch (error) {
    console.error('Error exporting data:', error);
    process.exit(1);
  }
}

// Run the export
exportAllData().then(() => {
  console.log('Export process finished');
  process.exit(0);
}).catch(error => {
  console.error('Export failed:', error);
  process.exit(1);
});