import 'dotenv/config';
import { db } from './db';
import { 
  applications, 
  interfaces, 
  businessProcesses,
  businessProcessInterfaces,
  businessProcessRelationships,
  businessProcessSequences,
  changeRequests, 
  changeRequestApplications,
  changeRequestInterfaces,
  changeRequestInternalActivities,
  changeRequestTechnicalProcesses,
  technicalProcesses,
  technicalProcessInterfaces,
  technicalProcessDependencies,
  internalActivities,
  conversations,
  conversationLinks,
  communicationComments,
  communicationAttachments,
  conversationParticipants,
  communicationMentions,
  interfaceComments,
  interfaceVersions,
  interfaceResponseScenarios,
  decisionPoints,
  interfaceConsumerDescriptions,
  imlDiagrams,
  interfaceBuilderProjects
} from '../shared/schema';

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // Delete all data except users and RBAC tables
    // Note: Order matters due to foreign key constraints
    
    console.log('Deleting interface builder projects...');
    await db.delete(interfaceBuilderProjects);
    
    console.log('Deleting IML diagrams...');
    await db.delete(imlDiagrams);
    
    console.log('Deleting interface consumer descriptions...');
    await db.delete(interfaceConsumerDescriptions);
    
    console.log('Deleting decision points...');
    await db.delete(decisionPoints);
    
    console.log('Deleting interface response scenarios...');
    await db.delete(interfaceResponseScenarios);
    
    console.log('Deleting business process sequences...');
    await db.delete(businessProcessSequences);
    
    console.log('Deleting interface versions...');
    await db.delete(interfaceVersions);
    
    console.log('Deleting interface comments...');
    await db.delete(interfaceComments);
    
    console.log('Deleting communication mentions...');
    await db.delete(communicationMentions);
    
    console.log('Deleting conversation participants...');
    await db.delete(conversationParticipants);
    
    console.log('Deleting communication attachments...');
    await db.delete(communicationAttachments);
    
    console.log('Deleting communication comments...');
    await db.delete(communicationComments);
    
    console.log('Deleting conversation links...');
    await db.delete(conversationLinks);
    
    console.log('Deleting conversations...');
    await db.delete(conversations);
    
    console.log('Deleting change request internal activities...');
    await db.delete(changeRequestInternalActivities);
    
    console.log('Deleting internal activities...');
    await db.delete(internalActivities);
    
    console.log('Deleting change request technical processes...');
    await db.delete(changeRequestTechnicalProcesses);
    
    console.log('Deleting technical process dependencies...');
    await db.delete(technicalProcessDependencies);
    
    console.log('Deleting technical process interfaces...');
    await db.delete(technicalProcessInterfaces);
    
    console.log('Deleting technical processes...');
    await db.delete(technicalProcesses);
    
    console.log('Deleting change request interfaces...');
    await db.delete(changeRequestInterfaces);
    
    console.log('Deleting change request applications...');
    await db.delete(changeRequestApplications);
    
    console.log('Deleting change requests...');
    await db.delete(changeRequests);
    
    console.log('Deleting business process relationships...');
    await db.delete(businessProcessRelationships);
    
    console.log('Deleting business process interfaces...');
    await db.delete(businessProcessInterfaces);
    
    console.log('Deleting business processes...');
    await db.delete(businessProcesses);
    
    console.log('Deleting interfaces...');
    await db.delete(interfaces);
    
    console.log('Deleting applications...');
    await db.delete(applications);
    
    console.log('✅ Database cleaned successfully!');
    console.log('🔒 User accounts and RBAC data have been preserved.');
    console.log('');
    console.log('To reseed with basic data, run:');
    console.log('  npx tsx server/seed.ts');
    console.log('');
    console.log('To reseed with test data, run:');
    console.log('  npx tsx server/seed-test-data.ts');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });