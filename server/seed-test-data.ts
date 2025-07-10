import 'dotenv/config';
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  applications, 
  interfaces, 
  businessProcesses,
  businessProcessInterfaces,
  businessProcessRelationships,
  technicalProcesses,
  technicalProcessInterfaces,
  technicalProcessDependencies,
  changeRequests,
  changeRequestApplications,
  changeRequestInterfaces,
  changeRequestTechnicalProcesses,
  conversations,
  conversationLinks,
  conversationParticipants,
  users
} from "../shared/schema";

async function seedTestData() {
  try {
    console.log("Starting test data seeding...");
    
    // Seeding fresh test data

    // Get existing users
    const existingUsers = await db.select().from(users);
    const adminUser = existingUsers.find(u => u.username === 'admin');
    const testUser = existingUsers.find(u => u.username === 'testuser');

    if (!adminUser || !testUser) {
      console.error("Required users not found. Please run the main seed script first.");
      return;
    }

    // 1. Create 4 Applications
    console.log("Creating applications...");
    const [app1] = await db.insert(applications).values({
      amlNumber: "AML-TEST-001",
      name: "Customer Portal",
      lob: "Retail Banking",
      status: "active",
      description: "Web-based customer self-service portal for retail banking customers",
      os: "Linux",
      deployment: "cloud",
      uptime: "99.9",
      purpose: "Provides online banking services to retail customers",
      providesExtInterface: true,
      provInterfaceType: "REST API",
      consumesExtInterfaces: true,
      consInterfaceType: "REST API, SOAP",
      firstActiveDate: new Date("2020-01-15")
    }).returning();

    const [app2] = await db.insert(applications).values({
      amlNumber: "AML-TEST-002",
      name: "Core Banking System",
      lob: "Core Systems",
      status: "active",
      description: "Central banking system managing accounts, transactions, and products",
      os: "AIX",
      deployment: "on-premise",
      uptime: "99.99",
      purpose: "Core transaction processing and account management",
      providesExtInterface: true,
      provInterfaceType: "SOAP, MQ",
      consumesExtInterfaces: true,
      consInterfaceType: "MQ",
      firstActiveDate: new Date("2015-06-01")
    }).returning();

    const [app3] = await db.insert(applications).values({
      amlNumber: "AML-TEST-003",
      name: "Risk Analytics Platform",
      lob: "Risk Management",
      status: "active",
      description: "Real-time risk analysis and monitoring platform",
      os: "Linux",
      deployment: "hybrid",
      uptime: "99.5",
      purpose: "Monitor and analyze risk across all banking operations",
      providesExtInterface: true,
      provInterfaceType: "REST API, GraphQL",
      consumesExtInterfaces: true,
      consInterfaceType: "REST API, Database",
      firstActiveDate: new Date("2021-03-20")
    }).returning();

    const [app4] = await db.insert(applications).values({
      amlNumber: "AML-TEST-004",
      name: "Mobile Banking App",
      lob: "Digital Channels",
      status: "active",
      description: "Native mobile application for iOS and Android",
      os: "iOS/Android",
      deployment: "cloud",
      uptime: "99.7",
      purpose: "Mobile banking services for retail and business customers",
      providesExtInterface: false,
      provInterfaceType: null,
      consumesExtInterfaces: true,
      consInterfaceType: "REST API",
      firstActiveDate: new Date("2019-09-10")
    }).returning();

    // 2. Create 10 Interfaces
    console.log("Creating interfaces...");
    const [iml1] = await db.insert(interfaces).values({
      providerApplicationId: app2.id,
      consumerApplicationId: app1.id,
      imlNumber: "IML-TEST-001",
      interfaceType: "REST",
      middleware: "None",
      version: "2.0",
      lob: "Retail Banking",
      status: "active",
      description: "Account balance and transaction history API",
      businessProcessName: "Account Information Retrieval",
      customerFocal: "John Smith",
      providerOwner: "Core Banking Team",
      consumerOwner: "Digital Channels Team",
      sampleCode: "GET /api/v2/accounts/{accountId}/balance\nGET /api/v2/accounts/{accountId}/transactions",
      connectivitySteps: "1. Request API credentials from Core Banking team\n2. Configure SSL certificates\n3. Test connectivity using /health endpoint",
      interfaceTestSteps: "1. Test with valid account number\n2. Verify response format\n3. Check error handling for invalid accounts"
    }).returning();

    const [iml2] = await db.insert(interfaces).values({
      providerApplicationId: app2.id,
      consumerApplicationId: app4.id,
      imlNumber: "IML-TEST-002",
      interfaceType: "REST",
      middleware: "None",
      version: "2.0",
      lob: "Digital Channels",
      status: "active",
      description: "Mobile-optimized account services API",
      businessProcessName: "Mobile Banking Services",
      customerFocal: "Sarah Johnson",
      providerOwner: "Core Banking Team",
      consumerOwner: "Mobile Team",
      sampleCode: "POST /api/v2/mobile/login\nGET /api/v2/mobile/accounts/summary",
      connectivitySteps: "1. Register mobile app in API gateway\n2. Implement OAuth 2.0 flow\n3. Configure rate limiting",
      interfaceTestSteps: "1. Test authentication flow\n2. Verify mobile-specific endpoints\n3. Test offline scenarios"
    }).returning();

    const [iml3] = await db.insert(interfaces).values({
      providerApplicationId: app3.id,
      consumerApplicationId: app2.id,
      imlNumber: "IML-TEST-003",
      interfaceType: "GraphQL",
      middleware: "None",
      version: "1.0",
      lob: "Risk Management",
      status: "active",
      description: "Real-time risk assessment API",
      businessProcessName: "Transaction Risk Assessment",
      customerFocal: "Mike Davis",
      providerOwner: "Risk Analytics Team",
      consumerOwner: "Core Banking Team",
      sampleCode: "query { riskAssessment(transactionId: \"123\") { score, factors, recommendations } }",
      connectivitySteps: "1. Obtain GraphQL endpoint URL\n2. Set up subscription for real-time updates\n3. Configure webhook for alerts",
      interfaceTestSteps: "1. Test risk scoring for various transaction types\n2. Verify real-time performance\n3. Test alert mechanisms"
    }).returning();

    const [iml4] = await db.insert(interfaces).values({
      providerApplicationId: app1.id,
      consumerApplicationId: app3.id,
      imlNumber: "IML-TEST-004",
      interfaceType: "REST",
      middleware: "None",
      version: "1.0",
      lob: "Risk Management",
      status: "active",
      description: "Customer behavior data feed for risk analysis",
      businessProcessName: "Customer Risk Profiling",
      customerFocal: "Lisa Chen",
      providerOwner: "Digital Channels Team",
      consumerOwner: "Risk Analytics Team",
      sampleCode: "GET /api/v1/customers/{customerId}/behavior\nGET /api/v1/customers/{customerId}/transactions/pattern",
      connectivitySteps: "1. Request read-only API access\n2. Set up data streaming pipeline\n3. Configure data retention policies",
      interfaceTestSteps: "1. Verify data completeness\n2. Test data streaming performance\n3. Validate data privacy compliance"
    }).returning();

    const [iml5] = await db.insert(interfaces).values({
      providerApplicationId: app2.id,
      consumerApplicationId: app3.id,
      imlNumber: "IML-TEST-005",
      interfaceType: "MQ",
      middleware: "IBM MQ",
      version: "1.0",
      lob: "Core Systems",
      status: "active",
      description: "Transaction event stream for risk monitoring",
      businessProcessName: "Real-time Transaction Monitoring",
      customerFocal: "Tom Wilson",
      providerOwner: "Core Banking Team",
      consumerOwner: "Risk Analytics Team",
      sampleCode: "Queue: TRANSACTIONS.EVENTS\nMessage Format: JSON\nFrequency: Real-time",
      connectivitySteps: "1. Request MQ queue access\n2. Configure message listeners\n3. Set up dead letter queue handling",
      interfaceTestSteps: "1. Test message consumption rate\n2. Verify message ordering\n3. Test error recovery scenarios"
    }).returning();

    const [iml6] = await db.insert(interfaces).values({
      providerApplicationId: app3.id,
      consumerApplicationId: app1.id,
      imlNumber: "IML-TEST-006",
      interfaceType: "REST",
      middleware: "WSO2",
      version: "1.0",
      lob: "Retail Banking",
      status: "active",
      description: "Risk scores and alerts for customer portal",
      businessProcessName: "Customer Risk Communication",
      customerFocal: "Anna Brown",
      providerOwner: "Risk Analytics Team",
      consumerOwner: "Digital Channels Team",
      sampleCode: "GET /api/v1/customers/{customerId}/risk-profile\nGET /api/v1/customers/{customerId}/security-alerts",
      connectivitySteps: "1. Implement API authentication\n2. Set up caching for risk scores\n3. Configure alert push notifications",
      interfaceTestSteps: "1. Test risk score retrieval\n2. Verify alert delivery\n3. Test cache invalidation"
    }).returning();

    const [iml7] = await db.insert(interfaces).values({
      providerApplicationId: app4.id,
      consumerApplicationId: app3.id,
      imlNumber: "IML-TEST-007",
      interfaceType: "REST",
      middleware: "PSB",
      version: "1.0",
      lob: "Digital Channels",
      status: "active",
      description: "Mobile app usage analytics for fraud detection",
      businessProcessName: "Mobile Fraud Detection",
      customerFocal: "David Lee",
      providerOwner: "Mobile Team",
      consumerOwner: "Risk Analytics Team",
      sampleCode: "POST /api/v1/mobile/events/batch\nData: device info, location, app events",
      connectivitySteps: "1. Set up event batching\n2. Configure secure data transmission\n3. Implement data anonymization",
      interfaceTestSteps: "1. Test event batching performance\n2. Verify data anonymization\n3. Test geolocation accuracy"
    }).returning();

    const [iml8] = await db.insert(interfaces).values({
      providerApplicationId: app2.id,
      consumerApplicationId: app1.id,
      imlNumber: "IML-TEST-008",
      interfaceType: "SOAP",
      middleware: "PCE",
      version: "1.5",
      lob: "Core Systems",
      status: "active",
      description: "Payment processing and fund transfer services",
      businessProcessName: "Payment Processing",
      customerFocal: "Robert Zhang",
      providerOwner: "Core Banking Team",
      consumerOwner: "Digital Channels Team",
      sampleCode: "WSDL: https://corebanking.internal/services/payments?wsdl\nOperations: initiateTransfer, getTransferStatus",
      connectivitySteps: "1. Download and validate WSDL\n2. Generate client stubs\n3. Configure WS-Security headers",
      interfaceTestSteps: "1. Test payment initiation\n2. Verify status updates\n3. Test rollback scenarios"
    }).returning();

    const [iml9] = await db.insert(interfaces).values({
      providerApplicationId: app1.id,
      consumerApplicationId: app4.id,
      imlNumber: "IML-TEST-009",
      interfaceType: "REST",
      middleware: "None",
      version: "3.0",
      lob: "Digital Channels",
      status: "active",
      description: "Single sign-on and session management",
      businessProcessName: "Cross-Channel Authentication",
      customerFocal: "Emma Taylor",
      providerOwner: "Digital Channels Team",
      consumerOwner: "Mobile Team",
      sampleCode: "POST /api/v3/auth/token\nPOST /api/v3/auth/refresh\nPOST /api/v3/auth/logout",
      connectivitySteps: "1. Implement OAuth 2.0 client\n2. Configure token storage\n3. Set up biometric authentication",
      interfaceTestSteps: "1. Test SSO flow\n2. Verify token refresh\n3. Test session timeout handling"
    }).returning();

    const [iml10] = await db.insert(interfaces).values({
      providerApplicationId: app3.id,
      consumerApplicationId: app4.id,
      imlNumber: "IML-TEST-010",
      interfaceType: "REST",
      middleware: "Redis",
      version: "1.0",
      lob: "Risk Management",
      status: "active",
      description: "Mobile-specific fraud alerts and security recommendations",
      businessProcessName: "Mobile Security Advisory",
      customerFocal: "James Martinez",
      providerOwner: "Risk Analytics Team",
      consumerOwner: "Mobile Team",
      sampleCode: "GET /api/v1/mobile/security/recommendations\nPOST /api/v1/mobile/security/incident",
      connectivitySteps: "1. Set up push notification integration\n2. Configure real-time alert delivery\n3. Implement in-app security tips",
      interfaceTestSteps: "1. Test alert delivery speed\n2. Verify recommendation relevance\n3. Test incident reporting flow"
    }).returning();

    // 3. Create 3 Business Processes
    console.log("Creating business processes...");
    const [bp1] = await db.insert(businessProcesses).values({
      businessProcess: "Digital Banking Services",
      lob: "Retail Banking",
      product: "Online Banking Suite",
      version: "5.0",
      level: "A",
      domainOwner: "Maria Garcia",
      itOwner: "Tech Lead - Digital",
      vendorFocal: "TechCorp Solutions",
      status: "active"
    }).returning();

    const [bp2] = await db.insert(businessProcesses).values({
      businessProcess: "Account Management",
      lob: "Retail Banking",
      product: "Core Account Services",
      version: "3.2",
      level: "B",
      domainOwner: "John Anderson",
      itOwner: "Core Systems Lead",
      vendorFocal: "BankingSoft Inc",
      status: "active"
    }).returning();

    const [bp3] = await db.insert(businessProcesses).values({
      businessProcess: "Risk Assessment Services",
      lob: "Risk Management",
      product: "Enterprise Risk Platform",
      version: "2.1",
      level: "A",
      domainOwner: "Dr. Patricia Kim",
      itOwner: "Risk Tech Lead",
      vendorFocal: "RiskAnalytics Pro",
      status: "active"
    }).returning();

    // Create business process hierarchy
    await db.insert(businessProcessRelationships).values({
      parentProcessId: bp1.id,
      childProcessId: bp2.id,
      relationshipType: "contains"
    });

    // Link interfaces to business processes
    await db.insert(businessProcessInterfaces).values([
      { businessProcessId: bp1.id, interfaceId: iml1.id, sequenceNumber: 1, description: "Retrieve account data" },
      { businessProcessId: bp1.id, interfaceId: iml8.id, sequenceNumber: 2, description: "Process payments" },
      { businessProcessId: bp1.id, interfaceId: iml9.id, sequenceNumber: 3, description: "Manage authentication" },
      { businessProcessId: bp2.id, interfaceId: iml1.id, sequenceNumber: 1, description: "Account information" },
      { businessProcessId: bp2.id, interfaceId: iml2.id, sequenceNumber: 2, description: "Mobile account access" },
      { businessProcessId: bp3.id, interfaceId: iml3.id, sequenceNumber: 1, description: "Risk scoring" },
      { businessProcessId: bp3.id, interfaceId: iml5.id, sequenceNumber: 2, description: "Transaction monitoring" },
      { businessProcessId: bp3.id, interfaceId: iml6.id, sequenceNumber: 3, description: "Risk communication" }
    ]);

    // 4. Create 2 Technical Processes
    console.log("Creating technical processes...");
    const [tp1] = await db.insert(technicalProcesses).values({
      name: "Daily Risk Score Calculation",
      jobName: "risk_score_batch",
      applicationId: app3.id,
      description: "Nightly batch job that calculates risk scores for all active customers",
      frequency: "scheduled",
      schedule: "0 2 * * *",
      criticality: "high",
      status: "active",
      owner: "Risk Operations",
      technicalOwner: "batch-jobs@bank.com",
      lastRunDate: new Date("2024-01-14"),
      nextRunDate: new Date("2024-01-15")
    }).returning();

    const [tp2] = await db.insert(technicalProcesses).values({
      name: "Real-time Transaction Monitor",
      jobName: "txn_monitor_stream",
      applicationId: app3.id,
      description: "Continuous stream processing for real-time transaction fraud detection",
      frequency: "real-time",
      schedule: null,
      criticality: "critical",
      status: "active",
      owner: "Security Operations",
      technicalOwner: "security-ops@bank.com",
      lastRunDate: new Date("2024-01-14T23:59:00"),
      nextRunDate: null
    }).returning();

    // Link interfaces to technical processes
    await db.insert(technicalProcessInterfaces).values([
      { technicalProcessId: tp1.id, interfaceId: iml4.id, usageType: "consumes", description: "Read customer behavior data" },
      { technicalProcessId: tp1.id, interfaceId: iml6.id, usageType: "provides", description: "Publish risk scores" },
      { technicalProcessId: tp2.id, interfaceId: iml5.id, usageType: "consumes", description: "Consume transaction events" },
      { technicalProcessId: tp2.id, interfaceId: iml3.id, usageType: "provides", description: "Provide real-time risk assessment" }
    ]);

    // Create technical process dependency
    await db.insert(technicalProcessDependencies).values({
      technicalProcessId: tp2.id,
      dependsOnProcessId: tp1.id,
      dependencyType: "requires",
      description: "Requires daily risk scores for baseline comparison"
    });

    // 5. Create 2 Change Requests with comprehensive impacts
    console.log("Creating change requests...");
    const [cr1] = await db.insert(changeRequests).values({
      crNumber: "CR-TEST-001",
      title: "Upgrade Core Banking API to v3.0",
      description: "Major upgrade to modernize core banking APIs with improved performance and new features",
      reason: "Current API version is reaching end of support. New version provides better performance and security features.",
      benefit: "50% performance improvement, enhanced security, new features for mobile banking",
      status: "in-progress",
      priority: "high",
      owner: "Core Banking Team",
      requestedBy: "John Anderson",
      approvedBy: "CTO Office",
      targetDate: new Date("2024-03-31"),
      createdAt: new Date("2024-01-01")
    }).returning();

    const [cr2] = await db.insert(changeRequests).values({
      crNumber: "CR-TEST-002",
      title: "Implement Enhanced Fraud Detection ML Model",
      description: "Deploy new machine learning model for improved fraud detection accuracy",
      reason: "Current fraud detection has 15% false positive rate. New ML model reduces this to 5%.",
      benefit: "Reduced false positives, improved customer experience, $2M annual savings",
      status: "submitted",
      priority: "critical",
      owner: "Risk Analytics Team",
      requestedBy: "Dr. Patricia Kim",
      approvedBy: null,
      targetDate: new Date("2024-02-29"),
      createdAt: new Date("2024-01-10")
    }).returning();

    // Add impacts for CR1
    await db.insert(changeRequestApplications).values([
      { changeRequestId: cr1.id, applicationId: app2.id, impactType: "major", description: "Core system upgrade" },
      { changeRequestId: cr1.id, applicationId: app1.id, impactType: "minor", description: "API client library update" },
      { changeRequestId: cr1.id, applicationId: app4.id, impactType: "minor", description: "Mobile SDK update" }
    ]);

    await db.insert(changeRequestInterfaces).values([
      { changeRequestId: cr1.id, interfaceId: iml1.id, impactType: "major", description: "API version upgrade" },
      { changeRequestId: cr1.id, interfaceId: iml2.id, impactType: "major", description: "New endpoints" },
      { changeRequestId: cr1.id, interfaceId: iml8.id, impactType: "moderate", description: "SOAP to REST migration" }
    ]);

    // Add impacts for CR2
    await db.insert(changeRequestApplications).values([
      { changeRequestId: cr2.id, applicationId: app3.id, impactType: "major", description: "New ML model deployment" },
      { changeRequestId: cr2.id, applicationId: app2.id, impactType: "minor", description: "Integration point update" }
    ]);

    await db.insert(changeRequestInterfaces).values([
      { changeRequestId: cr2.id, interfaceId: iml3.id, impactType: "moderate", description: "New risk scoring algorithm" },
      { changeRequestId: cr2.id, interfaceId: iml5.id, impactType: "minor", description: "Additional event data" },
      { changeRequestId: cr2.id, interfaceId: iml6.id, impactType: "moderate", description: "New risk score format" },
      { changeRequestId: cr2.id, interfaceId: iml7.id, impactType: "minor", description: "Enhanced mobile analytics" }
    ]);

    await db.insert(changeRequestTechnicalProcesses).values([
      { changeRequestId: cr2.id, technicalProcessId: tp1.id, impactType: "major", description: "New ML model integration" },
      { changeRequestId: cr2.id, technicalProcessId: tp2.id, impactType: "moderate", description: "Updated fraud detection logic" }
    ]);

    // 6. Create 2 Communications across different areas
    console.log("Creating communications...");
    const [conv1] = await db.insert(conversations).values({
      title: "API Upgrade Testing Coordination",
      description: "Coordinating testing efforts for the Core Banking API v3.0 upgrade across all impacted systems",
      status: "open",
      priority: "high",
      createdBy: adminUser.email,
      assignedTo: "john.anderson@bank.com"
    }).returning();

    const [conv2] = await db.insert(conversations).values({
      title: "Fraud Detection Model Performance Review",
      description: "Review and analysis of the new ML model performance metrics and false positive rates",
      status: "pending",
      priority: "medium",
      createdBy: testUser.email,
      assignedTo: "patricia.kim@bank.com"
    }).returning();

    // Link conversations to entities
    await db.insert(conversationLinks).values([
      // Conv1 links - API upgrade discussion
      { conversationId: conv1.id, entityType: "change_request", entityId: cr1.id },
      { conversationId: conv1.id, entityType: "application", entityId: app2.id },
      { conversationId: conv1.id, entityType: "interface", entityId: iml1.id },
      { conversationId: conv1.id, entityType: "interface", entityId: iml2.id },
      
      // Conv2 links - Fraud detection discussion
      { conversationId: conv2.id, entityType: "change_request", entityId: cr2.id },
      { conversationId: conv2.id, entityType: "application", entityId: app3.id },
      { conversationId: conv2.id, entityType: "technical_process", entityId: tp1.id },
      { conversationId: conv2.id, entityType: "technical_process", entityId: tp2.id },
      { conversationId: conv2.id, entityType: "business_process", entityId: bp3.id }
    ]);

    // Add participants
    await db.insert(conversationParticipants).values([
      { conversationId: conv1.id, participantName: "Admin User", participantRole: "architect", isActive: true },
      { conversationId: conv1.id, participantName: "John Anderson", participantRole: "pm", isActive: true },
      { conversationId: conv1.id, participantName: "Test User", participantRole: "tester", isActive: true },
      { conversationId: conv1.id, participantName: "Core Banking Team", participantRole: "vendor", isActive: true },
      { conversationId: conv2.id, participantName: "Dr. Patricia Kim", participantRole: "pm", isActive: true },
      { conversationId: conv2.id, participantName: "Risk Analytics Team", participantRole: "vendor", isActive: true },
      { conversationId: conv2.id, participantName: "Test User", participantRole: "tester", isActive: true },
      { conversationId: conv2.id, participantName: "Security Operations", participantRole: "customer", isActive: true }
    ]);

    console.log("Test data seeding completed successfully!");
    console.log("\nCreated:");
    console.log("- 4 Applications");
    console.log("- 10 Interfaces");
    console.log("- 3 Business Processes (with hierarchy)");
    console.log("- 2 Technical Processes (with dependency)");
    console.log("- 2 Change Requests (with comprehensive impacts)");
    console.log("- 2 Communications (linked across multiple entities)");

  } catch (error) {
    console.error("Error seeding test data:", error);
    throw error;
  }
}

// Run the seed function only when called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData()
    .then(() => {
      console.log("Test data seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test data seeding failed:", error);
      process.exit(1);
    });
}

// Export as default for importing in other scripts
export default seedTestData;