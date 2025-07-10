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
  internalActivities,
  users
} from "../shared/schema";

async function seedComprehensiveTestData() {
  try {
    console.log("Starting comprehensive test data seeding...");
    
    // Get existing users
    const existingUsers = await db.select().from(users);
    const adminUser = existingUsers.find(u => u.username === 'admin');
    const testUser = existingUsers.find(u => u.username === 'testuser');

    if (!adminUser || !testUser) {
      console.error("Required users not found. Please run the main seed script first.");
      return;
    }

    // 1. Create 4 Applications
    console.log("Creating 4 applications...");
    const [app1] = await db.insert(applications).values({
      amlNumber: "AML-2024-001",
      name: "Enterprise Customer Portal",
      lob: "Digital Banking",
      status: "active",
      description: "Comprehensive web portal for retail and business banking customers with advanced features",
      os: "Linux/Docker",
      deployment: "cloud",
      uptime: "99.95",
      purpose: "Full-service digital banking platform for all customer segments",
      providesExtInterface: true,
      provInterfaceType: "REST API, GraphQL, WebSocket",
      consumesExtInterfaces: true,
      consInterfaceType: "REST API, SOAP, MQ",
      firstActiveDate: new Date("2021-03-15"),
      xPosition: 100,
      yPosition: 200,
      layer: "presentation"
    }).returning();

    const [app2] = await db.insert(applications).values({
      amlNumber: "AML-2024-002",
      name: "Next-Gen Core Banking Platform",
      lob: "Core Banking",
      status: "active",
      description: "Modernized core banking system with microservices architecture",
      os: "Linux/Kubernetes",
      deployment: "hybrid",
      uptime: "99.99",
      purpose: "Central processing for all banking transactions and account management",
      providesExtInterface: true,
      provInterfaceType: "REST API, SOAP, MQ, gRPC",
      consumesExtInterfaces: true,
      consInterfaceType: "MQ, Database, REST API",
      firstActiveDate: new Date("2019-01-01"),
      xPosition: 300,
      yPosition: 200,
      layer: "business"
    }).returning();

    const [app3] = await db.insert(applications).values({
      amlNumber: "AML-2024-003",
      name: "AI Risk Intelligence Platform",
      lob: "Risk & Compliance",
      status: "active",
      description: "AI-powered risk analytics with real-time monitoring and predictive capabilities",
      os: "Linux/AWS",
      deployment: "cloud",
      uptime: "99.7",
      purpose: "Enterprise-wide risk monitoring, fraud detection, and compliance management",
      providesExtInterface: true,
      provInterfaceType: "REST API, GraphQL, Streaming API",
      consumesExtInterfaces: true,
      consInterfaceType: "REST API, MQ, Database, Kafka",
      firstActiveDate: new Date("2022-06-01"),
      xPosition: 500,
      yPosition: 200,
      layer: "business"
    }).returning();

    const [app4] = await db.insert(applications).values({
      amlNumber: "AML-2024-004",
      name: "Mobile Banking Super App",
      lob: "Mobile Banking",
      status: "active",
      description: "Next-generation mobile banking app with AI assistant and advanced features",
      os: "iOS/Android/HarmonyOS",
      deployment: "cloud",
      uptime: "99.8",
      purpose: "Complete mobile banking experience with payments, investments, and financial planning",
      providesExtInterface: false,
      provInterfaceType: null,
      consumesExtInterfaces: true,
      consInterfaceType: "REST API, GraphQL, WebSocket",
      firstActiveDate: new Date("2020-11-10"),
      xPosition: 100,
      yPosition: 400,
      layer: "presentation"
    }).returning();

    // 2. Create 10 Interfaces
    console.log("Creating 10 interfaces...");
    const [iml1] = await db.insert(interfaces).values({
      providerApplicationId: app2.id,
      consumerApplicationId: app1.id,
      imlNumber: "IML-2024-001",
      interfaceType: "REST",
      middleware: "API Gateway",
      version: "3.0",
      lob: "Digital Banking",
      status: "active",
      description: "Comprehensive account services API with real-time balance and transaction history",
      businessProcessName: "Digital Account Services",
      customerFocal: "James Wilson",
      providerOwner: "Core Banking API Team",
      consumerOwner: "Digital Channels Team",
      sampleCode: `// Account Balance API
GET /api/v3/accounts/{accountId}/balance
Headers: Authorization: Bearer {token}

// Transaction History API
GET /api/v3/accounts/{accountId}/transactions?startDate={date}&endDate={date}
Response: { transactions: [...], totalCount: 1000, hasMore: true }`,
      connectivitySteps: `1. Request API credentials via ServiceNow ticket
2. Configure OAuth 2.0 client with provided credentials
3. Set up SSL/TLS certificates for mTLS authentication
4. Test connectivity using /api/v3/health endpoint
5. Configure rate limiting (1000 req/min)`,
      interfaceTestSteps: `1. Authenticate using OAuth 2.0 flow
2. Test account balance retrieval with valid account
3. Verify transaction pagination works correctly
4. Test error scenarios (invalid account, expired token)
5. Validate response time < 200ms`
    }).returning();

    const [iml2] = await db.insert(interfaces).values({
      providerApplicationId: app2.id,
      consumerApplicationId: app4.id,
      imlNumber: "IML-2024-002",
      interfaceType: "GraphQL",
      middleware: "Apollo Server",
      version: "2.0",
      lob: "Mobile Banking",
      status: "active",
      description: "Mobile-optimized GraphQL API for efficient data fetching and real-time updates",
      businessProcessName: "Mobile Banking Operations",
      customerFocal: "Sarah Chen",
      providerOwner: "Core Banking API Team",
      consumerOwner: "Mobile Engineering Team",
      sampleCode: `query AccountDashboard($customerId: ID!) {
  customer(id: $customerId) {
    accounts {
      id
      type
      balance
      recentTransactions(limit: 10) {
        id
        amount
        description
        date
      }
    }
  }
}`,
      connectivitySteps: `1. Obtain GraphQL endpoint and schema
2. Set up Apollo Client with authentication
3. Configure WebSocket for subscriptions
4. Implement offline caching strategy
5. Set up error handling and retry logic`,
      interfaceTestSteps: `1. Test query batching and deduplication
2. Verify subscription updates in real-time
3. Test offline mode and sync
4. Validate field-level permissions
5. Check performance with large datasets`
    }).returning();

    const [iml3] = await db.insert(interfaces).values({
      providerApplicationId: app3.id,
      consumerApplicationId: app2.id,
      imlNumber: "IML-2024-003",
      interfaceType: "gRPC",
      middleware: "Envoy Proxy",
      version: "1.5",
      lob: "Risk & Compliance",
      status: "active",
      description: "High-performance risk scoring service with real-time fraud detection",
      businessProcessName: "Real-time Risk Assessment",
      customerFocal: "Michael Thompson",
      providerOwner: "Risk Analytics Team",
      consumerOwner: "Core Banking Team",
      sampleCode: `// Risk Assessment Service
service RiskAssessment {
  rpc AssessTransaction(TransactionRequest) returns (RiskScore);
  rpc StreamTransactionRisk(stream TransactionRequest) returns (stream RiskScore);
}

message TransactionRequest {
  string transaction_id = 1;
  double amount = 2;
  string merchant = 3;
  Location location = 4;
}`,
      connectivitySteps: `1. Download .proto files from repository
2. Generate client stubs for your language
3. Configure TLS for secure communication
4. Set up load balancing with Envoy
5. Implement circuit breaker pattern`,
      interfaceTestSteps: `1. Test unary RPC calls
2. Verify streaming performance
3. Test timeout and deadline propagation
4. Validate error handling
5. Benchmark throughput (target: 10K req/sec)`
    }).returning();

    const [iml4] = await db.insert(interfaces).values({
      providerApplicationId: app1.id,
      consumerApplicationId: app3.id,
      imlNumber: "IML-2024-004",
      interfaceType: "Kafka",
      middleware: "Confluent Cloud",
      version: "2.0",
      lob: "Risk & Compliance",
      status: "active",
      description: "Customer behavior event stream for ML model training and real-time analytics",
      businessProcessName: "Customer Behavior Analytics",
      customerFocal: "Lisa Martinez",
      providerOwner: "Digital Analytics Team",
      consumerOwner: "Risk ML Team",
      sampleCode: `// Topic: customer-behavior-events
// Schema: Avro
{
  "type": "record",
  "name": "CustomerBehaviorEvent",
  "fields": [
    {"name": "customerId", "type": "string"},
    {"name": "eventType", "type": "string"},
    {"name": "timestamp", "type": "long"},
    {"name": "deviceInfo", "type": "DeviceInfo"},
    {"name": "sessionData", "type": "SessionData"}
  ]
}`,
      connectivitySteps: `1. Request Kafka cluster access
2. Configure consumer group and ACLs
3. Set up Schema Registry client
4. Implement exactly-once semantics
5. Configure monitoring with Prometheus`,
      interfaceTestSteps: `1. Test message production rate
2. Verify schema evolution compatibility
3. Test consumer lag monitoring
4. Validate message ordering
5. Test failure recovery scenarios`
    }).returning();

    const [iml5] = await db.insert(interfaces).values({
      providerApplicationId: app2.id,
      consumerApplicationId: app3.id,
      imlNumber: "IML-2024-005",
      interfaceType: "MQ",
      middleware: "IBM MQ",
      version: "2.5",
      lob: "Core Banking",
      status: "active",
      description: "High-volume transaction event feed for fraud monitoring and compliance",
      businessProcessName: "Transaction Event Processing",
      customerFocal: "Robert Kim",
      providerOwner: "Core Transaction Team",
      consumerOwner: "Fraud Detection Team",
      sampleCode: `Queue: BANK.TRANSACTIONS.EVENTS
Message Format: JSON with MQRFH2 header
Sample Message:
{
  "transactionId": "TXN-2024-123456",
  "accountId": "ACC-789012",
  "amount": 1500.00,
  "currency": "USD",
  "merchantCode": "5411",
  "timestamp": "2024-01-15T10:30:00Z",
  "channel": "POS"
}`,
      connectivitySteps: `1. Request MQ channel and credentials
2. Configure SSL/TLS for channel security
3. Set up message persistence
4. Configure DLQ handling
5. Implement message acknowledgment`,
      interfaceTestSteps: `1. Test message throughput (5K msg/sec)
2. Verify message persistence
3. Test poison message handling
4. Validate message ordering guarantees
5. Test failover scenarios`
    }).returning();

    const [iml6] = await db.insert(interfaces).values({
      providerApplicationId: app3.id,
      consumerApplicationId: app1.id,
      imlNumber: "IML-2024-006",
      interfaceType: "REST",
      middleware: "Kong Gateway",
      version: "1.2",
      lob: "Digital Banking",
      status: "active",
      description: "Customer risk profile and security alerts API for digital channels",
      businessProcessName: "Risk Communication Service",
      customerFocal: "Anna Rodriguez",
      providerOwner: "Risk Platform Team",
      consumerOwner: "Customer Experience Team",
      sampleCode: `// Risk Profile API
GET /api/v1/customers/{customerId}/risk-profile
Response: {
  "riskScore": 85,
  "riskLevel": "low",
  "factors": ["transaction_history", "account_age", "location"],
  "lastUpdated": "2024-01-15T09:00:00Z"
}

// Security Alerts API
GET /api/v1/customers/{customerId}/security-alerts?status=active`,
      connectivitySteps: `1. Register consumer in Kong
2. Configure API key authentication
3. Set up rate limiting per consumer
4. Configure response caching
5. Implement webhook for push alerts`,
      interfaceTestSteps: `1. Test API authentication flow
2. Verify rate limiting works
3. Test cache hit ratio > 80%
4. Validate webhook delivery
5. Test alert filtering logic`
    }).returning();

    const [iml7] = await db.insert(interfaces).values({
      providerApplicationId: app4.id,
      consumerApplicationId: app3.id,
      imlNumber: "IML-2024-007",
      interfaceType: "WebSocket",
      middleware: "AWS API Gateway",
      version: "1.0",
      lob: "Mobile Banking",
      status: "active",
      description: "Real-time mobile app telemetry and user behavior stream for fraud detection",
      businessProcessName: "Mobile Fraud Prevention",
      customerFocal: "David Park",
      providerOwner: "Mobile Platform Team",
      consumerOwner: "Fraud Analytics Team",
      sampleCode: `// WebSocket Connection
wss://api.bank.com/mobile/telemetry

// Message Types
{
  "type": "device_event",
  "payload": {
    "deviceId": "uuid",
    "eventType": "app_launch|transaction|biometric_auth",
    "timestamp": "ISO8601",
    "location": {...},
    "deviceFingerprint": {...}
  }
}`,
      connectivitySteps: `1. Obtain WebSocket endpoint
2. Implement exponential backoff reconnection
3. Configure message compression
4. Set up heartbeat mechanism
5. Implement message batching`,
      interfaceTestSteps: `1. Test connection stability
2. Verify message delivery rate
3. Test reconnection logic
4. Validate data compression
5. Test with 10K concurrent connections`
    }).returning();

    const [iml8] = await db.insert(interfaces).values({
      providerApplicationId: app2.id,
      consumerApplicationId: app1.id,
      imlNumber: "IML-2024-008",
      interfaceType: "SOAP",
      middleware: "WSO2 ESB",
      version: "3.5",
      lob: "Core Banking",
      status: "active",
      description: "Payment processing and wire transfer services with comprehensive validation",
      businessProcessName: "Payment Processing Hub",
      customerFocal: "Jennifer Wu",
      providerOwner: "Payments Team",
      consumerOwner: "Digital Channels Team",
      sampleCode: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header>
    <wsse:Security>...</wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <pay:InitiatePayment>
      <pay:FromAccount>123456789</pay:FromAccount>
      <pay:ToAccount>987654321</pay:ToAccount>
      <pay:Amount currency="USD">1000.00</pay:Amount>
      <pay:Reference>INV-2024-001</pay:Reference>
    </pay:InitiatePayment>
  </soapenv:Body>
</soapenv:Envelope>`,
      connectivitySteps: `1. Download WSDL and XSD schemas
2. Generate client stubs with wsimport
3. Configure WS-Security headers
4. Set up MTOM for attachments
5. Configure timeout values`,
      interfaceTestSteps: `1. Test payment initiation flow
2. Verify signature validation
3. Test idempotency handling
4. Validate error fault messages
5. Test large payment batches`
    }).returning();

    const [iml9] = await db.insert(interfaces).values({
      providerApplicationId: app1.id,
      consumerApplicationId: app4.id,
      imlNumber: "IML-2024-009",
      interfaceType: "REST",
      middleware: "Okta",
      version: "4.0",
      lob: "Digital Banking",
      status: "active",
      description: "Unified authentication and authorization service with biometric support",
      businessProcessName: "Omnichannel Authentication",
      customerFocal: "Emma Johnson",
      providerOwner: "Identity Team",
      consumerOwner: "Mobile Security Team",
      sampleCode: `// OAuth 2.0 + PKCE Flow
POST /oauth2/v1/token
{
  "grant_type": "authorization_code",
  "code": "auth_code_here",
  "code_verifier": "pkce_verifier",
  "client_id": "mobile_app_client"
}

// Biometric Registration
POST /api/v1/users/{userId}/factors/biometric
{
  "factorType": "face|fingerprint",
  "publicKey": "base64_encoded_key"
}`,
      connectivitySteps: `1. Register OAuth client
2. Implement PKCE flow
3. Configure biometric factors
4. Set up token refresh logic
5. Implement session management`,
      interfaceTestSteps: `1. Test full authentication flow
2. Verify biometric enrollment
3. Test token refresh mechanism
4. Validate session timeout
5. Test MFA bypass scenarios`
    }).returning();

    const [iml10] = await db.insert(interfaces).values({
      providerApplicationId: app3.id,
      consumerApplicationId: app4.id,
      imlNumber: "IML-2024-010",
      interfaceType: "Push Notification",
      middleware: "Firebase Cloud Messaging",
      version: "1.5",
      lob: "Risk & Compliance",
      status: "active",
      description: "Real-time fraud alerts and security notifications to mobile devices",
      businessProcessName: "Mobile Security Alerts",
      customerFocal: "Carlos Mendez",
      providerOwner: "Security Operations",
      consumerOwner: "Mobile UX Team",
      sampleCode: `// FCM Message Format
{
  "to": "device_token_here",
  "priority": "high",
  "notification": {
    "title": "Security Alert",
    "body": "Unusual transaction detected",
    "sound": "security_alert.mp3"
  },
  "data": {
    "alertType": "fraud_detection",
    "transactionId": "TXN-123456",
    "actionRequired": true,
    "deepLink": "app://security/alerts/123"
  }
}`,
      connectivitySteps: `1. Configure FCM project
2. Implement device token management
3. Set up topic subscriptions
4. Configure notification channels
5. Implement delivery tracking`,
      interfaceTestSteps: `1. Test notification delivery time
2. Verify deep link handling
3. Test notification grouping
4. Validate delivery receipts
5. Test with app in background/killed state`
    }).returning();

    // 3. Create 4 Business Processes with B and C level hierarchy
    console.log("Creating 4 business processes with hierarchy...");
    const [bp1] = await db.insert(businessProcesses).values({
      businessProcess: "Enterprise Digital Banking",
      lob: "Digital Banking",
      product: "Omnichannel Banking Platform",
      version: "6.0",
      level: "A",
      domainOwner: "Maria Garcia",
      itOwner: "John Anderson",
      vendorFocal: "TechCorp Solutions",
      status: "active",
      description: "Top-level digital banking services across all channels"
    }).returning();

    const [bp1b1] = await db.insert(businessProcesses).values({
      businessProcess: "Online Banking Services",
      lob: "Digital Banking",
      product: "Web Banking Portal",
      version: "5.5",
      level: "B",
      domainOwner: "Tom Wilson",
      itOwner: "Sarah Miller",
      vendorFocal: "WebTech Inc",
      status: "active",
      description: "Web-based banking services and customer portal"
    }).returning();

    const [bp1b1c1] = await db.insert(businessProcesses).values({
      businessProcess: "Account Management",
      lob: "Digital Banking",
      product: "Account Services Module",
      version: "5.5.1",
      level: "C",
      domainOwner: "Lisa Brown",
      itOwner: "Mike Chen",
      vendorFocal: "WebTech Inc",
      status: "active",
      description: "Account viewing, statements, and basic transactions"
    }).returning();

    const [bp1b1c2] = await db.insert(businessProcesses).values({
      businessProcess: "Payment Services",
      lob: "Digital Banking",
      product: "Payment Processing Module",
      version: "5.5.2",
      level: "C",
      domainOwner: "David Lee",
      itOwner: "Anna White",
      vendorFocal: "PaymentPro",
      status: "active",
      description: "Bill payments, transfers, and wire services"
    }).returning();

    const [bp1b2] = await db.insert(businessProcesses).values({
      businessProcess: "Mobile Banking Services",
      lob: "Mobile Banking",
      product: "Mobile Banking Suite",
      version: "4.0",
      level: "B",
      domainOwner: "Robert Kim",
      itOwner: "Jessica Tang",
      vendorFocal: "MobileFirst Labs",
      status: "active",
      description: "Native mobile banking applications"
    }).returning();

    const [bp1b2c1] = await db.insert(businessProcesses).values({
      businessProcess: "Mobile Payments",
      lob: "Mobile Banking",
      product: "Mobile Payment Engine",
      version: "4.0.1",
      level: "C",
      domainOwner: "Chris Martinez",
      itOwner: "Rachel Green",
      vendorFocal: "MobileFirst Labs",
      status: "active",
      description: "P2P payments, QR codes, and contactless payments"
    }).returning();

    const [bp2] = await db.insert(businessProcesses).values({
      businessProcess: "Risk Management Framework",
      lob: "Risk & Compliance",
      product: "Enterprise Risk Platform",
      version: "3.0",
      level: "A",
      domainOwner: "Dr. Patricia Kim",
      itOwner: "Steven Zhang",
      vendorFocal: "RiskTech Solutions",
      status: "active",
      description: "Comprehensive risk management across all business lines"
    }).returning();

    const [bp2b1] = await db.insert(businessProcesses).values({
      businessProcess: "Fraud Detection Services",
      lob: "Risk & Compliance",
      product: "AI Fraud Detection",
      version: "2.5",
      level: "B",
      domainOwner: "Michelle Davis",
      itOwner: "Kevin Liu",
      vendorFocal: "AI Security Corp",
      status: "active",
      description: "Real-time fraud detection and prevention"
    }).returning();

    const [bp2b1c1] = await db.insert(businessProcesses).values({
      businessProcess: "Transaction Monitoring",
      lob: "Risk & Compliance",
      product: "Transaction Monitor",
      version: "2.5.1",
      level: "C",
      domainOwner: "Brian Taylor",
      itOwner: "Sophia Wang",
      vendorFocal: "AI Security Corp",
      status: "active",
      description: "Real-time transaction anomaly detection"
    }).returning();

    const [bp3] = await db.insert(businessProcesses).values({
      businessProcess: "Core Banking Operations",
      lob: "Core Banking",
      product: "Core Banking System",
      version: "8.0",
      level: "A",
      domainOwner: "William Thompson",
      itOwner: "Nancy Rodriguez",
      vendorFocal: "BankCore Systems",
      status: "active",
      description: "Fundamental banking operations and transaction processing"
    }).returning();

    const [bp4] = await db.insert(businessProcesses).values({
      businessProcess: "Customer Experience Platform",
      lob: "Digital Banking",
      product: "CX Platform",
      version: "2.0",
      level: "A",
      domainOwner: "Jennifer Wu",
      itOwner: "Daniel Park",
      vendorFocal: "CX Innovations",
      status: "active",
      description: "Unified customer experience across all touchpoints"
    }).returning();

    // Create business process hierarchy relationships
    await db.insert(businessProcessRelationships).values([
      { parentProcessId: bp1.id, childProcessId: bp1b1.id, relationshipType: "contains" },
      { parentProcessId: bp1.id, childProcessId: bp1b2.id, relationshipType: "contains" },
      { parentProcessId: bp1b1.id, childProcessId: bp1b1c1.id, relationshipType: "contains" },
      { parentProcessId: bp1b1.id, childProcessId: bp1b1c2.id, relationshipType: "contains" },
      { parentProcessId: bp1b2.id, childProcessId: bp1b2c1.id, relationshipType: "contains" },
      { parentProcessId: bp2.id, childProcessId: bp2b1.id, relationshipType: "contains" },
      { parentProcessId: bp2b1.id, childProcessId: bp2b1c1.id, relationshipType: "contains" }
    ]);

    // Link interfaces to business processes
    await db.insert(businessProcessInterfaces).values([
      // Enterprise Digital Banking uses multiple interfaces
      { businessProcessId: bp1.id, interfaceId: iml1.id, sequenceNumber: 1, description: "Core account services" },
      { businessProcessId: bp1.id, interfaceId: iml6.id, sequenceNumber: 2, description: "Risk profile integration" },
      { businessProcessId: bp1.id, interfaceId: iml9.id, sequenceNumber: 3, description: "Authentication services" },
      
      // Online Banking Services
      { businessProcessId: bp1b1.id, interfaceId: iml1.id, sequenceNumber: 1, description: "Account data retrieval" },
      { businessProcessId: bp1b1.id, interfaceId: iml8.id, sequenceNumber: 2, description: "Payment processing" },
      
      // Account Management (C level)
      { businessProcessId: bp1b1c1.id, interfaceId: iml1.id, sequenceNumber: 1, description: "Account information display" },
      
      // Payment Services (C level)
      { businessProcessId: bp1b1c2.id, interfaceId: iml8.id, sequenceNumber: 1, description: "Execute payments" },
      
      // Mobile Banking Services
      { businessProcessId: bp1b2.id, interfaceId: iml2.id, sequenceNumber: 1, description: "Mobile API access" },
      { businessProcessId: bp1b2.id, interfaceId: iml9.id, sequenceNumber: 2, description: "Mobile authentication" },
      { businessProcessId: bp1b2.id, interfaceId: iml10.id, sequenceNumber: 3, description: "Push notifications" },
      
      // Mobile Payments (C level)
      { businessProcessId: bp1b2c1.id, interfaceId: iml2.id, sequenceNumber: 1, description: "Mobile payment execution" },
      
      // Risk Management Framework
      { businessProcessId: bp2.id, interfaceId: iml3.id, sequenceNumber: 1, description: "Risk assessment service" },
      { businessProcessId: bp2.id, interfaceId: iml4.id, sequenceNumber: 2, description: "Behavior analytics" },
      { businessProcessId: bp2.id, interfaceId: iml5.id, sequenceNumber: 3, description: "Transaction monitoring" },
      
      // Fraud Detection Services
      { businessProcessId: bp2b1.id, interfaceId: iml3.id, sequenceNumber: 1, description: "Real-time risk scoring" },
      { businessProcessId: bp2b1.id, interfaceId: iml7.id, sequenceNumber: 2, description: "Mobile telemetry analysis" },
      
      // Transaction Monitoring (C level)
      { businessProcessId: bp2b1c1.id, interfaceId: iml5.id, sequenceNumber: 1, description: "Monitor transaction stream" },
      
      // Core Banking Operations
      { businessProcessId: bp3.id, interfaceId: iml1.id, sequenceNumber: 1, description: "Provide account services" },
      { businessProcessId: bp3.id, interfaceId: iml5.id, sequenceNumber: 2, description: "Emit transaction events" },
      { businessProcessId: bp3.id, interfaceId: iml8.id, sequenceNumber: 3, description: "Process payments" }
    ]);

    // 4. Create 4 Internal Activities
    console.log("Creating 4 internal activities...");
    const [ia1] = await db.insert(internalActivities).values({
      applicationId: app2.id,
      activityName: "Data Quality Validation",
      activityType: "validate",
      description: "Daily batch job to validate and reconcile account data across systems",
      sequenceNumber: 1,
      preCondition: "Database connections available and source systems online",
      postCondition: "All account data validated and discrepancies logged",
      estimatedDurationMs: 120000,
      createdAt: new Date("2024-01-01")
    }).returning();

    const [ia2] = await db.insert(internalActivities).values({
      applicationId: app3.id,
      activityName: "Security Log Analysis",
      activityType: "check",
      description: "Automated security log analysis and threat detection using ML models",
      sequenceNumber: 2,
      preCondition: "Log aggregation service available and ML models loaded",
      postCondition: "Security threats identified and alerts generated",
      estimatedDurationMs: 30000,
      createdAt: new Date("2024-01-05")
    }).returning();

    const [ia3] = await db.insert(internalActivities).values({
      applicationId: app1.id,
      activityName: "Customer Session Cleanup",
      activityType: "transform",
      description: "Clean up expired customer sessions and temporary data",
      sequenceNumber: 3,
      preCondition: "Redis cache and session database accessible",
      postCondition: "Expired sessions removed and resources freed",
      estimatedDurationMs: 5000,
      createdAt: new Date("2024-01-10")
    }).returning();

    const [ia4] = await db.insert(internalActivities).values({
      applicationId: app4.id,
      activityName: "Mobile App Analytics Processing",
      activityType: "compute",
      description: "Process and aggregate mobile app usage analytics for insights",
      sequenceNumber: 4,
      preCondition: "Kafka cluster available and analytics database online",
      postCondition: "Analytics data processed and insights generated",
      estimatedDurationMs: 1000,
      createdAt: new Date("2024-01-12")
    }).returning();

    // Note: Internal activity relationships would be tracked here if the table existed

    // 5. Create 4 Technical Processes
    console.log("Creating 4 technical processes...");
    const [tp1] = await db.insert(technicalProcesses).values({
      name: "Enterprise Risk Score Calculator",
      jobName: "risk_score_calc_v2",
      applicationId: app3.id,
      description: "Advanced ML-based risk scoring for all customers using behavioral patterns",
      frequency: "scheduled",
      schedule: "0 3 * * *",
      criticality: "critical",
      status: "active",
      owner: "Risk Analytics",
      technicalOwner: "risk-batch@bank.com",
      runDuration: 180,
      dataVolume: "50GB",
      lastRunDate: new Date("2024-01-14T03:00:00"),
      nextRunDate: new Date("2024-01-15T03:00:00"),
      successRate: 99.5
    }).returning();

    const [tp2] = await db.insert(technicalProcesses).values({
      name: "Real-time Fraud Detection Stream",
      jobName: "fraud_stream_processor",
      applicationId: app3.id,
      description: "Kafka streams application for real-time transaction fraud detection",
      frequency: "real-time",
      schedule: null,
      criticality: "critical",
      status: "active",
      owner: "Fraud Prevention",
      technicalOwner: "fraud-streams@bank.com",
      runDuration: null,
      dataVolume: "100GB/day",
      lastRunDate: new Date("2024-01-14T23:59:59"),
      nextRunDate: null,
      successRate: 99.9
    }).returning();

    const [tp3] = await db.insert(technicalProcesses).values({
      name: "Account Statement Generator",
      jobName: "monthly_statements",
      applicationId: app2.id,
      description: "Generate and distribute monthly account statements to all customers",
      frequency: "scheduled",
      schedule: "0 0 1 * *",
      criticality: "high",
      status: "active",
      owner: "Customer Communications",
      technicalOwner: "statements@bank.com",
      runDuration: 360,
      dataVolume: "10TB",
      lastRunDate: new Date("2024-01-01T00:00:00"),
      nextRunDate: new Date("2024-02-01T00:00:00"),
      successRate: 98.5
    }).returning();

    const [tp4] = await db.insert(technicalProcesses).values({
      name: "Mobile App Performance Monitor",
      jobName: "mobile_perf_analytics",
      applicationId: app4.id,
      description: "Analyze mobile app performance metrics and user experience data",
      frequency: "scheduled",
      schedule: "*/30 * * * *",
      criticality: "medium",
      status: "active",
      owner: "Mobile Platform",
      technicalOwner: "mobile-ops@bank.com",
      runDuration: 15,
      dataVolume: "500MB",
      lastRunDate: new Date("2024-01-14T23:30:00"),
      nextRunDate: new Date("2024-01-15T00:00:00"),
      successRate: 99.7
    }).returning();

    // Link interfaces to technical processes
    await db.insert(technicalProcessInterfaces).values([
      { technicalProcessId: tp1.id, interfaceId: iml4.id, usageType: "consumes", description: "Read customer behavior events" },
      { technicalProcessId: tp1.id, interfaceId: iml6.id, usageType: "provides", description: "Publish calculated risk scores" },
      { technicalProcessId: tp2.id, interfaceId: iml5.id, usageType: "consumes", description: "Consume transaction event stream" },
      { technicalProcessId: tp2.id, interfaceId: iml3.id, usageType: "provides", description: "Provide real-time fraud scores" },
      { technicalProcessId: tp2.id, interfaceId: iml10.id, usageType: "provides", description: "Send fraud alerts" },
      { technicalProcessId: tp3.id, interfaceId: iml1.id, usageType: "consumes", description: "Read account data" },
      { technicalProcessId: tp4.id, interfaceId: iml7.id, usageType: "consumes", description: "Analyze mobile telemetry" }
    ]);

    // Create technical process dependencies
    await db.insert(technicalProcessDependencies).values([
      { technicalProcessId: tp2.id, dependsOnProcessId: tp1.id, dependencyType: "requires", description: "Needs risk scores for baseline comparison" },
      { technicalProcessId: tp4.id, dependsOnProcessId: tp2.id, dependencyType: "optional", description: "Can use fraud signals for performance correlation" }
    ]);

    // 6. Create 5 Change Requests with various statuses
    console.log("Creating 5 change requests...");
    const [cr1] = await db.insert(changeRequests).values({
      crNumber: "CR-2024-001",
      title: "Core Banking API Modernization Phase 2",
      description: "Complete migration from SOAP to REST APIs with GraphQL support for complex queries",
      reason: "Legacy SOAP APIs are difficult to maintain and have performance limitations",
      benefit: "60% reduction in API response time, 40% reduction in maintenance costs, improved developer experience",
      status: "in-progress",
      priority: "critical",
      owner: "Core Banking Transformation",
      requestedBy: "John Anderson",
      approvedBy: "CTO Council",
      targetDate: new Date("2024-04-30"),
      completionDate: null,
      createdAt: new Date("2023-12-01"),
      statusHistory: [
        { status: "draft", date: "2023-12-01", by: "john.anderson@bank.com" },
        { status: "submitted", date: "2023-12-15", by: "john.anderson@bank.com" },
        { status: "approved", date: "2024-01-05", by: "cto@bank.com" },
        { status: "in-progress", date: "2024-01-10", by: "pm-office@bank.com" }
      ]
    }).returning();

    const [cr2] = await db.insert(changeRequests).values({
      crNumber: "CR-2024-002",
      title: "AI-Powered Fraud Detection Enhancement",
      description: "Deploy next-generation AI models with 95% accuracy and real-time learning capabilities",
      reason: "Current fraud detection has 20% false positive rate causing customer friction",
      benefit: "Reduce false positives to 5%, save $5M annually, improve customer satisfaction by 30%",
      status: "approved",
      priority: "critical",
      owner: "Risk Innovation Lab",
      requestedBy: "Dr. Patricia Kim",
      approvedBy: "Risk Committee",
      targetDate: new Date("2024-03-15"),
      completionDate: null,
      createdAt: new Date("2024-01-05"),
      statusHistory: [
        { status: "draft", date: "2024-01-05", by: "patricia.kim@bank.com" },
        { status: "submitted", date: "2024-01-08", by: "patricia.kim@bank.com" },
        { status: "approved", date: "2024-01-12", by: "risk-committee@bank.com" }
      ]
    }).returning();

    const [cr3] = await db.insert(changeRequests).values({
      crNumber: "CR-2024-003",
      title: "Mobile Banking Super App Launch",
      description: "Launch comprehensive mobile app with investment, insurance, and financial planning features",
      reason: "Customers demand all-in-one financial services in mobile app",
      benefit: "Increase mobile engagement 200%, cross-sell ratio 3x, new revenue stream $10M/year",
      status: "submitted",
      priority: "high",
      owner: "Digital Innovation",
      requestedBy: "Sarah Chen",
      approvedBy: null,
      targetDate: new Date("2024-06-30"),
      completionDate: null,
      createdAt: new Date("2024-01-10"),
      statusHistory: [
        { status: "draft", date: "2024-01-10", by: "sarah.chen@bank.com" },
        { status: "submitted", date: "2024-01-14", by: "sarah.chen@bank.com" }
      ]
    }).returning();

    const [cr4] = await db.insert(changeRequests).values({
      crNumber: "CR-2024-004",
      title: "Legacy System Decommissioning - Phase 1",
      description: "Decommission old mainframe systems after successful migration to cloud",
      reason: "Legacy systems cost $2M/year to maintain with declining vendor support",
      benefit: "Save $2M annually, reduce operational risk, improve system agility",
      status: "completed",
      priority: "medium",
      owner: "Infrastructure Team",
      requestedBy: "William Thompson",
      approvedBy: "Executive Committee",
      targetDate: new Date("2024-01-31"),
      completionDate: new Date("2024-01-28"),
      createdAt: new Date("2023-10-01"),
      statusHistory: [
        { status: "draft", date: "2023-10-01", by: "william.thompson@bank.com" },
        { status: "submitted", date: "2023-10-15", by: "william.thompson@bank.com" },
        { status: "approved", date: "2023-11-01", by: "exec-committee@bank.com" },
        { status: "in-progress", date: "2023-11-15", by: "infra-team@bank.com" },
        { status: "completed", date: "2024-01-28", by: "infra-team@bank.com" }
      ]
    }).returning();

    const [cr5] = await db.insert(changeRequests).values({
      crNumber: "CR-2024-005",
      title: "Customer Data Platform Implementation",
      description: "Implement unified customer data platform for 360-degree customer view",
      reason: "Customer data is fragmented across 15+ systems making personalization difficult",
      benefit: "Enable real-time personalization, improve marketing ROI 40%, reduce data queries by 70%",
      status: "draft",
      priority: "high",
      owner: "Data & Analytics",
      requestedBy: "Jennifer Wu",
      approvedBy: null,
      targetDate: new Date("2024-09-30"),
      completionDate: null,
      createdAt: new Date("2024-01-12"),
      statusHistory: [
        { status: "draft", date: "2024-01-12", by: "jennifer.wu@bank.com" }
      ]
    }).returning();

    // Add comprehensive impacts for change requests
    await db.insert(changeRequestApplications).values([
      // CR1 impacts
      { changeRequestId: cr1.id, applicationId: app2.id, impactType: "major", description: "Complete API layer rewrite" },
      { changeRequestId: cr1.id, applicationId: app1.id, impactType: "moderate", description: "Update API client libraries" },
      { changeRequestId: cr1.id, applicationId: app4.id, impactType: "moderate", description: "Mobile SDK updates required" },
      { changeRequestId: cr1.id, applicationId: app3.id, impactType: "minor", description: "Update API endpoints" },
      
      // CR2 impacts
      { changeRequestId: cr2.id, applicationId: app3.id, impactType: "major", description: "Deploy new ML models and infrastructure" },
      { changeRequestId: cr2.id, applicationId: app2.id, impactType: "minor", description: "Add new event attributes" },
      { changeRequestId: cr2.id, applicationId: app1.id, impactType: "minor", description: "Update fraud alert UI" },
      
      // CR3 impacts
      { changeRequestId: cr3.id, applicationId: app4.id, impactType: "major", description: "Major app redesign and new features" },
      { changeRequestId: cr3.id, applicationId: app1.id, impactType: "moderate", description: "New APIs for mobile features" },
      { changeRequestId: cr3.id, applicationId: app2.id, impactType: "moderate", description: "New service integrations" },
      
      // CR4 impacts
      { changeRequestId: cr4.id, applicationId: app2.id, impactType: "major", description: "Migrate from mainframe" },
      
      // CR5 impacts
      { changeRequestId: cr5.id, applicationId: app1.id, impactType: "moderate", description: "Integrate with CDP" },
      { changeRequestId: cr5.id, applicationId: app3.id, impactType: "moderate", description: "New data sources for risk" },
      { changeRequestId: cr5.id, applicationId: app4.id, impactType: "minor", description: "Enhanced personalization" }
    ]);

    await db.insert(changeRequestInterfaces).values([
      // CR1 interface impacts
      { changeRequestId: cr1.id, interfaceId: iml1.id, impactType: "major", description: "SOAP to REST migration" },
      { changeRequestId: cr1.id, interfaceId: iml2.id, impactType: "moderate", description: "GraphQL schema updates" },
      { changeRequestId: cr1.id, interfaceId: iml8.id, impactType: "major", description: "Complete SOAP deprecation" },
      
      // CR2 interface impacts
      { changeRequestId: cr2.id, interfaceId: iml3.id, impactType: "major", description: "New ML scoring API" },
      { changeRequestId: cr2.id, interfaceId: iml4.id, impactType: "moderate", description: "Enhanced event schema" },
      { changeRequestId: cr2.id, interfaceId: iml5.id, impactType: "minor", description: "Additional event types" },
      { changeRequestId: cr2.id, interfaceId: iml7.id, impactType: "moderate", description: "New telemetry data" },
      { changeRequestId: cr2.id, interfaceId: iml10.id, impactType: "minor", description: "New alert types" },
      
      // CR3 interface impacts
      { changeRequestId: cr3.id, interfaceId: iml2.id, impactType: "major", description: "New mobile GraphQL queries" },
      { changeRequestId: cr3.id, interfaceId: iml9.id, impactType: "moderate", description: "Enhanced auth for new features" },
      { changeRequestId: cr3.id, interfaceId: iml10.id, impactType: "moderate", description: "New notification types" },
      
      // CR5 interface impacts
      { changeRequestId: cr5.id, interfaceId: iml1.id, impactType: "minor", description: "Add customer context" },
      { changeRequestId: cr5.id, interfaceId: iml4.id, impactType: "major", description: "New unified event stream" },
      { changeRequestId: cr5.id, interfaceId: iml6.id, impactType: "moderate", description: "Enhanced risk profiles" }
    ]);

    await db.insert(changeRequestTechnicalProcesses).values([
      // CR1 technical process impacts
      { changeRequestId: cr1.id, technicalProcessId: tp3.id, impactType: "moderate", description: "Update API calls" },
      
      // CR2 technical process impacts
      { changeRequestId: cr2.id, technicalProcessId: tp1.id, impactType: "major", description: "New ML model integration" },
      { changeRequestId: cr2.id, technicalProcessId: tp2.id, impactType: "major", description: "Deploy new fraud models" },
      
      // CR5 technical process impacts
      { changeRequestId: cr5.id, technicalProcessId: tp1.id, impactType: "moderate", description: "Use unified customer data" },
      { changeRequestId: cr5.id, technicalProcessId: tp4.id, impactType: "minor", description: "Enhanced analytics data" }
    ]);

    // Note: Business Process impacts would be tracked here if the table existed
    // Currently commenting out as changeRequestBusinessProcesses table doesn't exist in schema

    // 7. Create 10 Communications linked to various entities
    console.log("Creating 10 communications...");
    const createdConversations = await db.insert(conversations).values([
      {
        title: "Core API Migration - Testing Strategy",
        description: "Define comprehensive testing strategy for SOAP to REST migration including regression, performance, and security testing",
        status: "open",
        priority: "critical",
        createdBy: adminUser.email,
        assignedTo: "qa-lead@bank.com"
      },
      {
        title: "Fraud Model Performance Benchmarking",
        description: "Establish performance benchmarks and KPIs for new AI fraud detection models",
        status: "in-progress",
        priority: "high",
        createdBy: testUser.email,
        assignedTo: "risk-analytics@bank.com"
      },
      {
        title: "Mobile App Security Review",
        description: "Security assessment for new mobile banking features including biometric auth and payment flows",
        status: "pending",
        priority: "high",
        createdBy: adminUser.email,
        assignedTo: "security-team@bank.com"
      },
      {
        title: "Production Incident - Payment Processing Delay",
        description: "Investigation and resolution of payment processing delays experienced on Jan 10",
        status: "resolved",
        priority: "critical",
        createdBy: adminUser.email,
        assignedTo: "incident-response@bank.com"
      },
      {
        title: "Customer Data Platform Architecture Review",
        description: "Technical architecture review and vendor evaluation for CDP implementation",
        status: "open",
        priority: "medium",
        createdBy: testUser.email,
        assignedTo: "architecture@bank.com"
      },
      {
        title: "Risk Score Calculation Performance Optimization",
        description: "Optimize batch job performance to handle 2x volume growth",
        status: "in-progress",
        priority: "high",
        createdBy: adminUser.email,
        assignedTo: "performance-team@bank.com"
      },
      {
        title: "Interface Version Compatibility Matrix",
        description: "Document and maintain compatibility matrix for all interface versions during migration",
        status: "open",
        priority: "medium",
        createdBy: testUser.email,
        assignedTo: "integration-team@bank.com"
      },
      {
        title: "Mobile Push Notification Delivery Issues",
        description: "Troubleshoot and resolve push notification delivery failures on Android devices",
        status: "resolved",
        priority: "high",
        createdBy: adminUser.email,
        assignedTo: "mobile-ops@bank.com"
      },
      {
        title: "Business Process Optimization Workshop",
        description: "Workshop to identify and optimize inefficient business processes using new capabilities",
        status: "pending",
        priority: "low",
        createdBy: testUser.email,
        assignedTo: "process-excellence@bank.com"
      },
      {
        title: "Q1 Change Advisory Board Review",
        description: "Quarterly review of all major changes and their business impacts",
        status: "scheduled",
        priority: "medium",
        createdBy: adminUser.email,
        assignedTo: "cab@bank.com"
      }
    ]).returning();

    // Link conversations to various entities
    await db.insert(conversationLinks).values([
      // Conv 1 - Core API Migration Testing
      { conversationId: createdConversations[0].id, entityType: "change_request", entityId: cr1.id },
      { conversationId: createdConversations[0].id, entityType: "application", entityId: app2.id },
      { conversationId: createdConversations[0].id, entityType: "interface", entityId: iml1.id },
      { conversationId: createdConversations[0].id, entityType: "interface", entityId: iml8.id },
      { conversationId: createdConversations[0].id, entityType: "business_process", entityId: bp3.id },
      
      // Conv 2 - Fraud Model Performance
      { conversationId: createdConversations[1].id, entityType: "change_request", entityId: cr2.id },
      { conversationId: createdConversations[1].id, entityType: "application", entityId: app3.id },
      { conversationId: createdConversations[1].id, entityType: "technical_process", entityId: tp1.id },
      { conversationId: createdConversations[1].id, entityType: "technical_process", entityId: tp2.id },
      { conversationId: createdConversations[1].id, entityType: "business_process", entityId: bp2b1.id },
      
      // Conv 3 - Mobile Security Review
      { conversationId: createdConversations[2].id, entityType: "change_request", entityId: cr3.id },
      { conversationId: createdConversations[2].id, entityType: "application", entityId: app4.id },
      { conversationId: createdConversations[2].id, entityType: "interface", entityId: iml9.id },
      { conversationId: createdConversations[2].id, entityType: "interface", entityId: iml7.id },
      
      // Conv 4 - Payment Processing Incident
      { conversationId: createdConversations[3].id, entityType: "application", entityId: app2.id },
      { conversationId: createdConversations[3].id, entityType: "interface", entityId: iml8.id },
      { conversationId: createdConversations[3].id, entityType: "technical_process", entityId: tp3.id },
      { conversationId: createdConversations[3].id, entityType: "business_process", entityId: bp1b1c2.id },
      
      // Conv 5 - CDP Architecture
      { conversationId: createdConversations[4].id, entityType: "change_request", entityId: cr5.id },
      { conversationId: createdConversations[4].id, entityType: "application", entityId: app1.id },
      { conversationId: createdConversations[4].id, entityType: "interface", entityId: iml4.id },
      
      // Conv 6 - Risk Score Performance
      { conversationId: createdConversations[5].id, entityType: "technical_process", entityId: tp1.id },
      { conversationId: createdConversations[5].id, entityType: "application", entityId: app3.id },
      { conversationId: createdConversations[5].id, entityType: "interface", entityId: iml6.id },
      
      // Conv 7 - Interface Compatibility
      { conversationId: createdConversations[6].id, entityType: "interface", entityId: iml1.id },
      { conversationId: createdConversations[6].id, entityType: "interface", entityId: iml2.id },
      { conversationId: createdConversations[6].id, entityType: "interface", entityId: iml3.id },
      { conversationId: createdConversations[6].id, entityType: "change_request", entityId: cr1.id },
      
      // Conv 8 - Push Notification Issues
      { conversationId: createdConversations[7].id, entityType: "application", entityId: app4.id },
      { conversationId: createdConversations[7].id, entityType: "interface", entityId: iml10.id },
      { conversationId: createdConversations[7].id, entityType: "technical_process", entityId: tp4.id },
      
      // Conv 9 - Business Process Workshop
      { conversationId: createdConversations[8].id, entityType: "business_process", entityId: bp1.id },
      { conversationId: createdConversations[8].id, entityType: "business_process", entityId: bp2.id },
      { conversationId: createdConversations[8].id, entityType: "business_process", entityId: bp4.id },
      
      // Conv 10 - CAB Review
      { conversationId: createdConversations[9].id, entityType: "change_request", entityId: cr1.id },
      { conversationId: createdConversations[9].id, entityType: "change_request", entityId: cr2.id },
      { conversationId: createdConversations[9].id, entityType: "change_request", entityId: cr3.id }
    ]);

    // Add participants to conversations
    await db.insert(conversationParticipants).values([
      // Technical discussions
      { conversationId: createdConversations[0].id, participantName: "QA Lead", participantRole: "tester", isActive: true },
      { conversationId: createdConversations[0].id, participantName: "API Team", participantRole: "vendor", isActive: true },
      { conversationId: createdConversations[0].id, participantName: "John Anderson", participantRole: "pm", isActive: true },
      
      { conversationId: createdConversations[1].id, participantName: "Dr. Patricia Kim", participantRole: "architect", isActive: true },
      { conversationId: createdConversations[1].id, participantName: "Risk Analytics", participantRole: "vendor", isActive: true },
      { conversationId: createdConversations[1].id, participantName: "Data Science Team", participantRole: "customer", isActive: true },
      
      { conversationId: createdConversations[2].id, participantName: "Security Architect", participantRole: "architect", isActive: true },
      { conversationId: createdConversations[2].id, participantName: "Mobile Team", participantRole: "vendor", isActive: true },
      { conversationId: createdConversations[2].id, participantName: "CISO Office", participantRole: "customer", isActive: true },
      
      // Incident response
      { conversationId: createdConversations[3].id, participantName: "Incident Commander", participantRole: "pm", isActive: true },
      { conversationId: createdConversations[3].id, participantName: "Operations Team", participantRole: "vendor", isActive: true },
      { conversationId: createdConversations[3].id, participantName: "Customer Support", participantRole: "customer", isActive: true },
      
      // Architecture reviews
      { conversationId: createdConversations[4].id, participantName: "Enterprise Architect", participantRole: "architect", isActive: true },
      { conversationId: createdConversations[4].id, participantName: "Vendor Team", participantRole: "vendor", isActive: true },
      
      // Performance optimization
      { conversationId: createdConversations[5].id, participantName: "Performance Engineer", participantRole: "architect", isActive: true },
      { conversationId: createdConversations[5].id, participantName: "DBA Team", participantRole: "vendor", isActive: true },
      
      // General participants
      { conversationId: createdConversations[6].id, participantName: "Integration Team", participantRole: "vendor", isActive: true },
      { conversationId: createdConversations[7].id, participantName: "Mobile Ops", participantRole: "vendor", isActive: true },
      { conversationId: createdConversations[8].id, participantName: "Process Team", participantRole: "pm", isActive: true },
      { conversationId: createdConversations[9].id, participantName: "CAB Members", participantRole: "customer", isActive: true }
    ]);

    console.log("\n✅ Comprehensive test data seeding completed successfully!");
    console.log("\n📊 Created Summary:");
    console.log("- 4 Applications (with comprehensive details)");
    console.log("- 10 Interfaces (various types: REST, GraphQL, gRPC, MQ, etc.)");
    console.log("- 4 Business Processes with B and C level hierarchy (11 total)");
    console.log("- 4 Internal Activities");
    console.log("- 5 Change Requests (various statuses: draft, submitted, approved, in-progress, completed)");
    console.log("- 4 Technical Processes");
    console.log("- 10 Communications (linked to applications, interfaces, business processes, change requests)");
    console.log("\n🔐 Login Credentials:");
    console.log("- Admin: username: 'admin', password: 'admin123'");
    console.log("- Test User: username: 'testuser', password: 'test123'");

  } catch (error) {
    console.error("❌ Error seeding comprehensive test data:", error);
    throw error;
  }
}

// Run the seed function only when called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedComprehensiveTestData()
    .then(() => {
      console.log("\n✨ Test data seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test data seeding failed:", error);
      process.exit(1);
    });
}

export default seedComprehensiveTestData;