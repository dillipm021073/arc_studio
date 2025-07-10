import 'dotenv/config';
import { db } from './db';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from '@shared/schema';

async function importAllData() {
  console.log('Starting data import...');
  
  const dataDir = path.join(process.cwd(), 'data');
  const allDataPath = path.join(dataDir, 'all-data.json');
  
  if (!fs.existsSync(allDataPath)) {
    console.error('Data file not found:', allDataPath);
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(allDataPath, 'utf-8');
    const { metadata, data } = JSON.parse(fileContent);
    
    console.log(`Importing data exported on: ${metadata.exportDate}`);
    console.log('Tables to import:', metadata.tables.map((t: any) => `${t.name} (${t.recordCount} records)`).join(', '));
    
    // Clear existing data (optional - comment out if you want to merge)
    console.log('\nClearing existing data...');
    
    // Import in correct order to handle foreign key constraints
    const importOrder = [
      'users',
      'applications',
      'interfaces', 
      'changeRequests',
      'businessProcesses',
      'changeRequestApplications',
      'changeRequestInterfaces',
      'businessProcessInterfaces',
      'conversations',
      'conversationLinks',
      'conversationParticipants',
      'communicationComments',
      'communicationAttachments',
      'communicationMentions',
      'interfaceComments',
      'interfaceVersions',
      'interfaceConsumerDescriptions',
      'imlDiagrams'
    ];
    
    // Clear tables in reverse order
    const tableMapping: Record<string, any> = {
      users: schema.users,
      applications: schema.applications,
      interfaces: schema.interfaces,
      changeRequests: schema.changeRequests,
      businessProcesses: schema.businessProcesses,
      changeRequestApplications: schema.changeRequestApplications,
      changeRequestInterfaces: schema.changeRequestInterfaces,
      businessProcessInterfaces: schema.businessProcessInterfaces,
      conversations: schema.conversations,
      conversationLinks: schema.conversationLinks,
      conversationParticipants: schema.conversationParticipants,
      communicationComments: schema.communicationComments,
      communicationAttachments: schema.communicationAttachments,
      communicationMentions: schema.communicationMentions,
      interfaceComments: schema.interfaceComments,
      interfaceVersions: schema.interfaceVersions,
      interfaceConsumerDescriptions: schema.interfaceConsumerDescriptions,
      imlDiagrams: schema.imlDiagrams
    };
    
    for (const tableName of [...importOrder].reverse()) {
      if (tableMapping[tableName]) {
        console.log(`Clearing ${tableName}...`);
        await db.delete(tableMapping[tableName]);
      }
    }
    
    // Import data in correct order
    for (const tableName of importOrder) {
      if (data[tableName] && data[tableName].length > 0) {
        console.log(`\nImporting ${tableName}...`);
        
        // Handle date conversions
        const processedData = data[tableName].map((record: any) => {
          const processed = { ...record };
          
          // Convert date strings back to Date objects for timestamp fields
          const dateFields = ['createdAt', 'updatedAt', 'lastChangeDate', 'firstActiveDate', 
                            'decommissionDate', 'targetDate', 'completedDate', 'submittedDate', 
                            'approvedDate', 'inProgressDate', 'completedDate'];
          
          for (const field of dateFields) {
            if (processed[field]) {
              processed[field] = new Date(processed[field]);
            }
          }
          
          return processed;
        });
        
        // Insert data
        if (tableMapping[tableName]) {
          await db.insert(tableMapping[tableName]).values(processedData);
          console.log(`  - Imported ${processedData.length} records into ${tableName}`);
        }
      }
    }
    
    console.log('\nData import completed successfully!');
    
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

// Run the import
importAllData().then(() => {
  console.log('Import process finished');
  process.exit(0);
}).catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});