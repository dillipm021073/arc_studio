import 'dotenv/config';
import { db } from './db.js';
import { 
  applications,
  interfaces,
  changeRequests,
  changeRequestApplications,
  changeRequestInterfaces,
  interfaceComments,
  businessProcesses,
  businessProcessInterfaces,
  businessProcessRelationships,
  interfaceVersions,
  interfaceConsumerDescriptions,
  imlDiagrams,
  conversations,
  conversationLinks,
  communicationComments,
  communicationAttachments,
  conversationParticipants,
  communicationMentions,
  technicalProcesses,
  technicalProcessInterfaces,
  technicalProcessDependencies,
  changeRequestTechnicalProcesses
} from '../shared/schema.js';

async function cleanAndReseed() {
  console.log('🧹 Cleaning database (keeping users)...');
  
  try {
    // Delete in order to respect foreign key constraints
    // Start with tables that have no dependencies on them
    await db.delete(communicationMentions);
    await db.delete(communicationAttachments);
    await db.delete(communicationComments);
    await db.delete(conversationParticipants);
    await db.delete(conversationLinks);
    await db.delete(conversations);
    
    await db.delete(imlDiagrams);
    await db.delete(interfaceConsumerDescriptions);
    await db.delete(interfaceVersions);
    await db.delete(interfaceComments);
    
    await db.delete(businessProcessInterfaces);
    await db.delete(businessProcessRelationships);
    
    await db.delete(changeRequestTechnicalProcesses);
    await db.delete(changeRequestInterfaces);
    await db.delete(changeRequestApplications);
    await db.delete(changeRequests);
    
    await db.delete(technicalProcessDependencies);
    await db.delete(technicalProcessInterfaces);
    await db.delete(technicalProcesses);
    
    await db.delete(businessProcesses);
    await db.delete(interfaces);
    await db.delete(applications);
    
    console.log('✅ All data cleaned except users');
    
    // Run the test data seeding
    console.log('🌱 Seeding test data...');
    
    // Import and run the seeding script
    const seedModule = await import('./seed-test-data.js');
    const seedTestData = seedModule.default;
    await seedTestData();
    
    console.log('✅ Test data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error during clean and reseed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanAndReseed()
    .then(() => {
      console.log('🎉 Clean and reseed completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Clean and reseed failed:', error);
      process.exit(1);
    });
}

export default cleanAndReseed;